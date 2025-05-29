// test-hash.js
const { hashPassword, comparePassword } = require('./utils/passwordUtils');

// Kiểm tra hash của 'admin123'
const password = 'admin123';
const correctHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

console.log('Hash của "admin123":', hashPassword(password));
console.log('So sánh với hash đã biết:', hashPassword(password) === correctHash);
console.log('Kết quả sử dụng comparePassword:', comparePassword(password, correctHash));