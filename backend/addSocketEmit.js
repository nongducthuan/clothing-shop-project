const fs = require('fs');
let code = fs.readFileSync('src/controllers/customer/orderController.ts', 'utf8');

if (!code.includes('getIO')) {
    code = code.replace("import { queueEmail } from '../../utils/emailQueue';", "import { queueEmail } from '../../utils/emailQueue';\nimport { getIO } from '../../utils/socket';");
}

code = code.replace(
    "emailLang\n        );", 
    "emailLang\n        );\n\n        // Emit realtime notification to Admin\n        try {\n            getIO().to('admin_room').emit('new_order', { orderId, total: finalTotal, customerName: name });\n        } catch(e) {\n            console.error('Socket emit error:', e);\n        }"
);

fs.writeFileSync('src/controllers/customer/orderController.ts', code);
console.log('done');
