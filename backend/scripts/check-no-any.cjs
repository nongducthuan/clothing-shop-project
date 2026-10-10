const fs = require('fs');
const path = require('path');
const swc = require('@swc/core');

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
  const ast = swc.parseSync(source, { syntax: 'typescript', decorators: true });

  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'TsKeywordType' && node.kind === 'any' && node.span) {
      const prefix = Buffer.from(source, 'utf8').subarray(0, node.span.start - 1).toString('utf8');
      const lines = prefix.split('\n');
      violations.push(`${file}:${lines.length}:${lines[lines.length - 1].length + 1}`);
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    for (const value of Object.values(node)) visit(value);
  }

  visit(ast);
}

console.log(`Scanned ${files.length} TypeScript files.`);
console.log(`Explicit TypeScript any count: ${violations.length}`);

if (violations.length > 0) {
  console.error('\nExplicit any found at:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('PASS: 0 explicit TypeScript any.');
