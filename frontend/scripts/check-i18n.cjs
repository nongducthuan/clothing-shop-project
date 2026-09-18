#!/usr/bin/env node
/**
 * check-i18n.cjs — Chặn build khi bản dịch không nhất quán.
 *
 * Chạy: npm run check:i18n   (được gắn tự động trước `npm run build`)
 *
 * Kiểm tra:
 *  1. Key chỉ có ở `vi` mà thiếu ở `en` (hoặc ngược lại)
 *  2. Key trùng lặp trong cùng 1 locale
 *  3. Placeholder `{...}` lệch giữa vi/en (câu dịch mất biến nội suy)
 *  4. Key dùng trong code t("...") nhưng chưa khai báo ở CẢ 2 locale
 *     (đây chính là lỗi `admin.order.confirm_cancel` trước đây — chỉ so vi/en sẽ KHÔNG bắt được)
 *  5. Prefix của key dựng động t(`order_status.${...}`) không khớp key nào
 *
 * Không cần thư viện ngoài: parse bằng TypeScript compiler API (typescript có sẵn trong devDependencies).
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const FRONTEND_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(FRONTEND_DIR, "src");
const TRANSLATIONS_FILE = path.join(SRC_DIR, "locales", "translations.ts");

const errors = [];
const warnings = [];

// ─── 1. Parse translations.ts ────────────────────────────────────────────────
function readDictionaries() {
  const code = fs.readFileSync(TRANSLATIONS_FILE, "utf8");
  const source = ts.createSourceFile(
    TRANSLATIONS_FILE,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  let translationsNode = null;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === "translations" &&
      node.initializer
    ) {
      translationsNode = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  if (!translationsNode || !ts.isObjectLiteralExpression(translationsNode)) {
    throw new Error("Không tìm thấy object `translations` trong " + TRANSLATIONS_FILE);
  }

  const dicts = {};
  for (const prop of translationsNode.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isObjectLiteralExpression(prop.initializer)) continue;
    const lang = prop.name.getText(source).replace(/["']/g, "");
    const map = new Map();
    for (const entry of prop.initializer.properties) {
      if (!ts.isPropertyAssignment(entry)) continue;
      const key = entry.name.getText(source).replace(/^["']|["']$/g, "");
      if (map.has(key)) errors.push(`[trùng key] "${lang}" khai báo 2 lần: ${key}`);
      const value = ts.isStringLiteral(entry.initializer) ? entry.initializer.text : "";
      map.set(key, value);
    }
    dicts[lang] = map;
  }
  return dicts;
}

// ─── 2. Quét key đang dùng trong code ────────────────────────────────────────
function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const STATIC_KEY = /\bt\(\s*(["'])([^"'`\\]+)\1/g; // t("a.b") / t('a.b')
const TEMPLATE_KEY = /\bt\(\s*`([^`$]*)\$\{/g; // t(`order_status.${...}`)

function collectUsage() {
  const used = new Map(); // key -> file đầu tiên dùng
  const prefixes = new Map(); // prefix -> file đầu tiên dùng
  const files = walkFiles(SRC_DIR);
  for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    const rel = path.relative(FRONTEND_DIR, file).replace(/\\/g, "/");
    for (const m of code.matchAll(STATIC_KEY)) if (!used.has(m[2])) used.set(m[2], rel);
    for (const m of code.matchAll(TEMPLATE_KEY)) {
      const prefix = m[1];
      if (prefix && !prefixes.has(prefix)) prefixes.set(prefix, rel);
    }
  }
  return { files: files.length, used, prefixes };
}

// ─── 3. Chạy kiểm tra ────────────────────────────────────────────────────────
const dicts = readDictionaries();
const vi = dicts.vi;
const en = dicts.en;
if (!vi || !en) {
  console.error('❌ translations.ts phải có đủ 2 locale "vi" và "en"');
  process.exit(1);
}

// (1) thiếu key ở 1 bên
for (const key of vi.keys()) if (!en.has(key)) errors.push(`[thiếu "en"] ${key}`);
for (const key of en.keys()) if (!vi.has(key)) errors.push(`[thiếu "vi"] ${key}`);

// (3) placeholder lệch giữa 2 ngôn ngữ
const placeholders = (text) => (text.match(/\{[^}]+\}/g) || []).sort().join(",");
for (const [key, viValue] of vi) {
  if (!en.has(key)) continue;
  const a = placeholders(viValue);
  const b = placeholders(en.get(key));
  if (a !== b) errors.push(`[placeholder lệch] ${key}: vi{${a}} vs en{${b}}`);
}

// giá trị rỗng → chỉ cảnh báo, không chặn build
for (const lang of ["vi", "en"]) {
  for (const [key, value] of dicts[lang]) {
    if (!String(value).trim()) warnings.push(`[giá trị rỗng] "${lang}": ${key}`);
  }
}

// (4) key dùng trong code nhưng chưa khai báo
const { files, used, prefixes } = collectUsage();
for (const [key, file] of used) {
  if (!vi.has(key) && !en.has(key)) errors.push(`[chưa khai báo] t("${key}") tại ${file}`);
  else if (!vi.has(key)) errors.push(`[thiếu "vi"] ${key} (dùng tại ${file})`);
  else if (!en.has(key)) errors.push(`[thiếu "en"] ${key} (dùng tại ${file})`);
}

// (5) prefix của key dựng động phải khớp ít nhất 1 key thật
for (const [prefix, file] of prefixes) {
  const hit = [...vi.keys()].some((k) => k.startsWith(prefix));
  if (!hit) errors.push("[prefix sai] t(`" + prefix + "${...}`) tại " + file + " — không khớp key nào");
}

// ─── 4. Báo cáo ──────────────────────────────────────────────────────────────
console.log("─── Kiểm tra đa ngữ ───────────────────────────────────────────");
console.log(`  File quét           : ${files}`);
console.log(`  Key dùng trong code : ${used.size}`);
console.log(`  Key vi / en         : ${vi.size} / ${en.size}`);
console.log(`  Key dựng động       : ${prefixes.size} prefix`);
if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} cảnh báo (không chặn build):`);
  warnings.slice(0, 10).forEach((w) => console.log("   - " + w));
  if (warnings.length > 10) console.log(`   ... và ${warnings.length - 10} cảnh báo khác`);
}

if (errors.length) {
  console.log(`\n❌ ${errors.length} lỗi bản dịch:`);
  errors.slice(0, 40).forEach((e) => console.log("   - " + e));
  if (errors.length > 40) console.log(`   ... và ${errors.length - 40} lỗi khác`);
  console.log("\nBuild bị chặn. Sửa các key trên trong frontend/src/locales/translations.ts.");
  process.exit(1);
}

console.log("\n✅ Bản dịch vi/en nhất quán, mọi key dùng trong code đều đã khai báo.");