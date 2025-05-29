// backend/read_db.js
const path = require('path');
const Database = require('better-sqlite3');

// Đường dẫn đến file CSDL, giống như trong db.js
const dbPath = path.resolve(__dirname, '../data/handmade_store.db');
let db; // Khai báo db ở ngoài để có thể đóng trong khối finally

try {
    // Kết nối đến CSDL ở chế độ chỉ đọc (readonly) vì chúng ta chỉ đọc dữ liệu
    db = new Database(dbPath, { readonly: true });
    console.log(`✅ Đã kết nối thành công đến CSDL: ${dbPath}`);

    // Hàm để lấy tất cả các bảng người dùng (không phải bảng hệ thống của SQLite)
    function getAllUserTables(database) {
        const stmt = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
        return stmt.all().map(row => row.name);
    }

    // Lấy danh sách tất cả các bảng
    const tableNames = getAllUserTables(db);

    if (tableNames.length === 0) {
        console.log("❌ Không tìm thấy bảng nào trong CSDL.");
    } else {
        console.log("\n📖 Đang đọc dữ liệu từ các bảng...");

        tableNames.forEach(tableName => {
            console.log(`\n--- Dữ liệu bảng: ${tableName} ---`);
            try {
                const stmt = db.prepare(`SELECT * FROM "${tableName}"`); // Sử dụng dấu ngoặc kép cho tên bảng phòng trường hợp tên bảng có ký tự đặc biệt
                const rows = stmt.all();

                if (rows.length > 0) {
                    console.table(rows); // console.table hiển thị dữ liệu dạng bảng đẹp hơn
                } else {
                    console.log(`(Bảng ${tableName} không có dữ liệu)`);
                }
            } catch (tableError) {
                console.error(`❌ Lỗi khi đọc dữ liệu từ bảng ${tableName}:`, tableError.message);
            }
        });
    }

} catch (err) {
    console.error("❌ Lỗi khi kết nối hoặc đọc CSDL:", err.message);
    if (err.code === 'SQLITE_CANTOPEN') {
        console.error("💡 Gợi ý: Kiểm tra xem file CSDL có tồn tại tại đường dẫn trên không, hoặc file db.js đã chạy để tạo CSDL chưa.");
    }
} finally {
    if (db) {
        db.close();
        console.log("\n🔌 Đã đóng kết nối CSDL.");
    }
}