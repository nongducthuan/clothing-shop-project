const fs = require('fs');
const path = require('path');

const extractFunctions = (content) => {
    const regex1 = /(?:const|let|var|function)\s+([a-zA-Z0-9_]+)\s*=?\s*(?:async)?\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*\{)/g;
    const regex2 = /exports\.([a-zA-Z0-9_]+)/g;
    const fns = new Set();
    let match;
    while ((match = regex1.exec(content)) !== null) fns.add(match[1]);
    while ((match = regex2.exec(content)) !== null) fns.add(match[1]);
    return Array.from(fns);
};

const dirs = ['controllers', 'models', 'routes'];
for (const dir of dirs) {
    const dirPath = path.join(__dirname, 'server', 'src', dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
        const fns = extractFunctions(content);
        console.log(`\n--- ${dir}/${file} ---`);
        console.log(fns.join(', '));
    }
}
