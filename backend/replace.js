const fs = require('fs');
let lines = fs.readFileSync('src/controllers/customer/orderController.ts', 'utf8').split('\n');
const newLines = [
    '        queueEmail(',
    '            email || (req.user ? req.user.email : ""),',
    '            isEnglish ? "Order Confirmation" : "Xác nhận đơn hàng",',
    '            isEnglish',
    '                ? `Thank you! Order #${orderId} has been placed successfully. Total: ${finalTotal.toLocaleString()} VND`',
    '                : `Cảm ơn bạn! Đơn hàng #${orderId} đã được đặt thành công. Tổng cộng: ${finalTotal.toLocaleString()} VNĐ`,',
    '            emailLang',
    '        );'
];
lines.splice(476, 8, ...newLines);
fs.writeFileSync('src/controllers/customer/orderController.ts', lines.join('\n'));
console.log('done');
