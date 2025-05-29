// backend/models/labelModel.js
const db = require('../../config/database'); // Đường dẫn tới file kết nối CSDL của bạn

// Hàm lấy tất cả các nhãn KÈM SỐ LƯỢNG SẢN PHẨM sử dụng nhãn đó
function getAll() {
    try {
        const stmt = db.prepare(`
            SELECT 
                n.id_nhan, 
                n.ten_nhan, 
                n.mau_sac_hex, 
                n.mota_nhan,
                COUNT(sp.id_sp) AS so_luong_san_pham
            FROM nhan n
            LEFT JOIN san_pham sp ON n.id_nhan = sp.id_nhan 
            GROUP BY n.id_nhan, n.ten_nhan, n.mau_sac_hex, n.mota_nhan
            ORDER BY n.ten_nhan
        `);
        return stmt.all();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nhãn:", error);
        throw error;
    }
}

// Hàm lấy một nhãn theo ID (KÈM SỐ LƯỢNG SẢN PHẨM)
function getById(id_nhan) {
    try {
        const stmt = db.prepare(`
            SELECT 
                n.id_nhan, 
                n.ten_nhan, 
                n.mau_sac_hex, 
                n.mota_nhan,
                COUNT(sp.id_sp) AS so_luong_san_pham
            FROM nhan n
            LEFT JOIN san_pham sp ON n.id_nhan = sp.id_nhan
            WHERE n.id_nhan = ?
            GROUP BY n.id_nhan, n.ten_nhan, n.mau_sac_hex, n.mota_nhan
        `);
        return stmt.get(id_nhan);
    } catch (error) {
        console.error(`Lỗi khi lấy nhãn ID ${id_nhan}:`, error);
        throw error;
    }
}

// Hàm tạo nhãn mới
function create(ten_nhan, mau_sac_hex, mota_nhan) {
    try {
        // Kiểm tra tên nhãn đã tồn tại chưa
        const existingLabel = db.prepare('SELECT id_nhan FROM nhan WHERE LOWER(ten_nhan) = LOWER(?)').get(ten_nhan);
        if (existingLabel) {
            const err = new Error('Tên nhãn đã tồn tại.');
            err.code = 'DUPLICATE_LABEL_NAME';
            throw err;
        }

        const stmt = db.prepare('INSERT INTO nhan (ten_nhan, mau_sac_hex, mota_nhan) VALUES (?, ?, ?)');
        const info = stmt.run(ten_nhan, mau_sac_hex || '#CCCCCC', mota_nhan || null);
        return { 
            id_nhan: info.lastInsertRowid, 
            ten_nhan, 
            mau_sac_hex: mau_sac_hex || '#CCCCCC', 
            mota_nhan, 
            so_luong_san_pham: 0 
        };
    } catch (error) {
        console.error("Lỗi khi tạo nhãn:", error);
        throw error;
    }
}

// Hàm cập nhật nhãn
function update(id_nhan, ten_nhan, mau_sac_hex, mota_nhan) {
    try {
        // Kiểm tra tên mới có trùng với nhãn khác không (trừ chính nó)
        const existingLabel = db.prepare('SELECT id_nhan FROM nhan WHERE LOWER(ten_nhan) = LOWER(?) AND id_nhan != ?').get(ten_nhan, id_nhan);
        if (existingLabel) {
            const err = new Error('Tên nhãn đã tồn tại.');
            err.code = 'DUPLICATE_LABEL_NAME';
            throw err;
        }

        const stmt = db.prepare('UPDATE nhan SET ten_nhan = ?, mau_sac_hex = ?, mota_nhan = ? WHERE id_nhan = ?');
        const info = stmt.run(ten_nhan, mau_sac_hex || '#CCCCCC', mota_nhan || null, id_nhan);
        
        if (info.changes === 0) {
            return null; // Không tìm thấy nhãn để cập nhật
        }
        return getById(id_nhan); // Trả về nhãn đã cập nhật
    } catch (error) {
        console.error(`Lỗi khi cập nhật nhãn ID ${id_nhan}:`, error);
        throw error;
    }
}

// Hàm xóa nhãn
function deleteById(id_nhan) {
    try {
        // Quan trọng: Khi xóa nhãn, các sản phẩm đang sử dụng nhãn này sẽ có id_nhan được SET NULL
        // do cấu trúc bảng san_pham: FOREIGN KEY (id_nhan) REFERENCES nhan(id_nhan) ON DELETE SET NULL
        // Vì vậy, không cần kiểm tra productCount ở đây nếu bạn chấp nhận hành vi SET NULL.
        // Nếu bạn muốn cấm xóa nếu nhãn đang được dùng, bạn cần thêm logic kiểm tra tương tự category.

        const stmt = db.prepare('DELETE FROM nhan WHERE id_nhan = ?');
        const info = stmt.run(id_nhan);
        return info.changes > 0;
    } catch (error) {
        console.error(`Lỗi khi xóa nhãn ID ${id_nhan}:`, error);
        throw error;
    }
}

module.exports = { getAll, getById, create, update, deleteById };