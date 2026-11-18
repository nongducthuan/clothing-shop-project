// check-no-any.cjs
// Dùng TypeScript Compiler API thay vì @swc/core để tránh vấn đề native binding
// trên Windows (ERR_SWC_NATIVE_CACHE). TypeScript đã là devDependency nên không
// cần cài thêm package nào.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOTS = ['src', 'prisma'];
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', 'generated']);

function collectTsFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectTsFiles(fullPath));
    else if (entry.isFile() && fullPath.endsWith('.ts')) files.push(fullPath);
  }
  return files;
}

const files = ROOTS.flatMap(collectTsFiles);
const violations = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

  function visit(node) {
    // TsKeywordType(any) → SyntaxKind.AnyKeyword in TS Compiler API
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      violations.push(`${file}:${line + 1}:${character + 1}`);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

console.log(`Scanned ${files.length} TypeScript files.`);
console.log(`Explicit TypeScript any count: ${violations.length}`);

if (violations.length > 0) {
  console.error('\nExplicit any found at:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('PASS: 0 explicit TypeScript any.');
