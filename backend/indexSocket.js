const fs = require('fs');
let code = fs.readFileSync('src/index.ts', 'utf8');

code = code.replace("import express from 'express';", "import express from 'express';\nimport http from 'http';\nimport { initSocket } from './utils/socket';");

code = code.replace("const PORT = process.env.PORT || 5000;\napp.listen(PORT, () => {\n    console.log(`Server is running at port ${PORT}`);\n});", "const PORT = process.env.PORT || 5000;\nconst server = http.createServer(app);\ninitSocket(server);\nserver.listen(PORT, () => {\n    console.log(`Server is running at port ${PORT}`);\n});");

fs.writeFileSync('src/index.ts', code);
console.log('done');
