#!/usr/bin/env node
/**
 * fix-mojibake.cjs — Sửa lỗi double-encode (mojibake) tiếng Việt trong file text.
 *
 * Nguyên nhân lỗi: file UTF-8 bị đọc nhầm bằng codepage đơn byte (Windows-1252/1258)
 * rồi ghi lại dưới dạng UTF-8. Ví dụ 'Sắp ra mắt' (UTF-8: 53 E1 BA AF 70) bị lưu thành
 * 'Sáº¯p ra máº¯t' (UTF-8 của các ký tự Latin-1 tương ứng).
 *
 * Cách sửa: đảo ngược đúng phép biến đổi đó (ký tự -> byte -> UTF-8) nhưng CHỈ áp dụng
 * cho dòng thực sự là mojibake. Dòng đúng chuẩn UTF-8 sẵn (ví dụ 'Người dùng') sẽ bị
 * bỏ qua vì chứa ký tự > U+00FF không thể quy về 1 byte.
 *
 * Chạy:
 *   node scripts/fix-mojibake.cjs                  # dry-run: chỉ in ra kế hoạch sửa
 *   node scripts/fix-mojibake.cjs --write          # sửa thật
 *   node scripts/fix-mojibake.cjs --write <file>   # sửa 1 file bất kỳ
 */
const fs = require("fs");
const path = require("path");

// Bảng ngược của Windows-1252 cho dải 0x80–0x9F (các byte này khi decode ra
// ký tự Unicode "lạ" nên không thể lấy trực tiếp bằng code point).
const CP1252_REVERSE = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
]);

/** Ký tự -> byte. Trả về null nếu gặp ký tự không thể quy về 1 byte. */
function toBytes(text) {
  const bytes = [];
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code <= 0xff) {
      bytes.push(code);
    } else {
      const mapped = CP1252_REVERSE.get(code);
      if (mapped === undefined) return null;
      bytes.push(mapped);
    }
  }
  return Buffer.from(bytes);
}

/** Dòng có chứa ký tự không thể là mojibake => đã là UTF-8 đúng, bỏ qua. */
function isProperUtf8(line) {
  for (const char of line) {
    const code = char.codePointAt(0);
    if (code > 0xff && !CP1252_REVERSE.has(code)) return true;
  }
  return false;
}

/**
 * Ký tự gần như không bao giờ xuất hiện trong tiếng Việt đúng chuẩn nhưng lại là
 * thành phần của mojibake (do byte thứ 2/3 của UTF-8 bị decode thành ký tự Latin-1).
 * Dùng để tránh báo nhầm những từ tiếng Việt ngắn chỉ gồm ký tự Latin-1 (vd: 'Xác minh').
 */
const MOJIBAKE_MARKER = /[»ºÆ¡¿½¾±²³µ¶·¸¹ª¬®¯°«]/;

/**
 * @returns {"ok"|"fixed"|"review"} trạng thái của dòng
 *   "ok"     : không cần đổi (ASCII thuần hoặc đã đúng UTF-8)
 *   "fixed"  : đã sửa được (trả về nội dung mới qua out.value)
 *   "review" : nghi bị lỗi nhưng không đủ dữ liệu để tự sửa (cần xem tay)
 */
function classifyLine(line) {
  if (!/[^\x00-\x7F]/.test(line)) return { status: "ok" };           // ASCII thuần
  if (isProperUtf8(line)) return { status: "ok" };                    // đã là UTF-8 đúng
  if (!MOJIBAKE_MARKER.test(line)) return { status: "ok" };           // không có dấu hiệu mojibake

  const bytes = toBytes(line);
  if (!bytes) return { status: "review" };                            // ký tự lạ => không đoán
  const repaired = bytes.toString("utf8");
  if (repaired.includes("\uFFFD")) return { status: "review" };       // byte bị mất => không đoán
  if (/[\u0080-\u009F]/.test(repaired)) return { status: "review" };
  if (repaired === line) return { status: "ok" };
  return { status: "fixed", value: repaired };
}

function detectEol(text) {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function fixFile(file, write) {
  const original = fs.readFileSync(file, "utf8");
  const eol = detectEol(original);
  const lines = original.split(eol);

  const samples = [];
  const skipped = [];
  let changed = 0;

  const fixedLines = lines.map((line, index) => {
    const result = classifyLine(line);
    if (result.status === "review") {
      skipped.push({ line: index + 1, text: line });
      return line;
    }
    if (result.status === "fixed") {
      changed += 1;
      if (samples.length < 8) samples.push({ line: index + 1, before: line, after: result.value });
      return result.value;
    }
    return line;
  });

  const result = fixedLines.join(eol);

  console.log(`\n=== ${file} ===`);
  console.log(`  EOL                 : ${eol === "\r\n" ? "CRLF" : "LF"}`);
  console.log(`  Tổng số dòng        : ${lines.length}`);
  console.log(`  Dòng sẽ sửa         : ${changed}`);
  console.log(`  Dòng cần xem tay    : ${skipped.length}`);

  if (samples.length) {
    console.log("  Ví dụ trước/sau:");
    samples.forEach((s) => {
      console.log(`   - dòng ${s.line}`);
      console.log(`     trước: ${JSON.stringify(s.before)}`);
      console.log(`     sau  : ${JSON.stringify(s.after)}`);
    });
  }

  if (skipped.length) {
    console.log("  Dòng không tự sửa (cần xem tay):");
    skipped.slice(0, 10).forEach((s) => console.log(`   - dòng ${s.line}: ${JSON.stringify(s.text)}`));
    if (skipped.length > 10) console.log(`   ... và ${skipped.length - 10} dòng khác`);
  }

  if (write) {
    if (changed === 0) {
      console.log("  => Không có gì để ghi.");
    } else {
      fs.writeFileSync(file, result, "utf8");
      console.log(`  => Đã ghi lại ${changed} dòng vào ${file}`);
    }
  } else {
    console.log("  (dry-run — thêm --write để ghi thật)");
  }

  return changed;
}

const args = process.argv.slice(2);
const write = args.includes("--write");
const targets = args.filter((a) => !a.startsWith("--"));

if (targets.length === 0) {
  targets.push(path.resolve(__dirname, "..", "src", "locales", "translations.ts"));
}

let total = 0;
for (const target of targets) total += fixFile(target, write);
console.log(`\nTổng số dòng đã sửa: ${total}`);
