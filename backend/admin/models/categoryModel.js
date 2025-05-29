// backend/models/categoryModel.js
const db = require('../../config/database'); // Đường dẫn tới file kết nối CSDL của bạn

// Hàm lấy tất cả các loại sản phẩm KÈM SỐ LƯỢNG SẢN PHẨM
function getAll() {
    try {
        const stmt = db.prepare(`
            SELECT 
                lsp.id_loai, 
                lsp.ten, 
                lsp.mota, 
                lsp.ngaytao,
                COUNT(sp.id_sp) AS so_luong_san_pham
            FROM loai_san_pham lsp
            LEFT JOIN san_pham sp ON lsp.id_loai = sp.id_loai
            GROUP BY lsp.id_loai, lsp.ten, lsp.mota, lsp.ngaytao
            ORDER BY lsp.ten
        `);
        return stmt.all();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách loại sản phẩm:", error);
        throw error;
    }
}

// Hàm lấy một loại sản phẩm theo ID (KÈM SỐ LƯỢNG SẢN PHẨM)
function getById(id_loai) {
    try {
        const stmt = db.prepare(`
            SELECT 
                lsp.id_loai, 
                lsp.ten, 
                lsp.mota, 
                lsp.ngaytao,
                COUNT(sp.id_sp) AS so_luong_san_pham
            FROM loai_san_pham lsp
            LEFT JOIN san_pham sp ON lsp.id_loai = sp.id_loai
            WHERE lsp.id_loai = ?
            GROUP BY lsp.id_loai, lsp.ten, lsp.mota, lsp.ngaytao
        `);
        return stmt.get(id_loai);
    } catch (error) {
        console.error(`Lỗi khi lấy loại sản phẩm ID ${id_loai}:`, error);
        throw error;
    }
}


// Hàm tạo loại sản phẩm mới
function create(ten, mota) {
    const ngaytao = new Date().toISOString().slice(0, 19).replace('T', ' '); // Định dạng YYYY-MM-DD HH:MM:SS
    try {
        // Kiểm tra xem tên danh mục đã tồn tại chưa (để tránh lỗi UNIQUE nếu có)
        const existingCategory = db.prepare('SELECT id_loai FROM loai_san_pham WHERE LOWER(ten) = LOWER(?)').get(ten);
        if (existingCategory) {
            const err = new Error('Tên danh mục đã tồn tại.');
            err.code = 'DUPLICATE_CATEGORY_NAME'; // Mã lỗi tùy chỉnh
            throw err;
        }

        const stmt = db.prepare('INSERT INTO loai_san_pham (ten, mota, ngaytao) VALUES (?, ?, ?)');
        const info = stmt.run(ten, mota || null, ngaytao);
        // Trả về thông tin loại sản phẩm vừa tạo, bao gồm cả số lượng sản phẩm (mới tạo sẽ là 0)
        return { id_loai: info.lastInsertRowid, ten, mota, ngaytao, so_luong_san_pham: 0 };
    } catch (error) {
        console.error("Lỗi khi tạo loại sản phẩm:", error);
        throw error;
    }
}

// Hàm cập nhật loại sản phẩm
function update(id_loai, ten, mota) {
    const ngaycapnhat = new Date().toISOString().slice(0, 19).replace('T', ' '); // Giả sử bạn có cột ngaycapnhat
    try {
        // Kiểm tra xem tên mới có trùng với danh mục khác không (trừ chính nó)
        const existingCategory = db.prepare('SELECT id_loai FROM loai_san_pham WHERE LOWER(ten) = LOWER(?) AND id_loai != ?').get(ten, id_loai);
        if (existingCategory) {
            const err = new Error('Tên danh mục đã tồn tại.');
            err.code = 'DUPLICATE_CATEGORY_NAME';
            throw err;
        }

        // Nếu bạn có cột ngaycapnhat trong bảng loai_san_pham:
        // const stmt = db.prepare('UPDATE loai_san_pham SET ten = ?, mota = ?, ngaycapnhat = ? WHERE id_loai = ?');
        // const info = stmt.run(ten, mota || null, ngaycapnhat, id_loai);
        
        // Nếu không có cột ngaycapnhat:
        const stmt = db.prepare('UPDATE loai_san_pham SET ten = ?, mota = ? WHERE id_loai = ?');
        const info = stmt.run(ten, mota || null, id_loai);
        
        if (info.changes === 0) {
            return null; // Không tìm thấy danh mục để cập nhật
        }
        return getById(id_loai); // Trả về danh mục đã cập nhật (có số lượng sản phẩm)
    } catch (error) {
        console.error(`Lỗi khi cập nhật loại sản phẩm ID ${id_loai}:`, error);
        throw error;
    }
}

// Hàm xóa loại sản phẩm
function deleteById(id_loai) {
    try {
        // Kiểm tra xem danh mục có sản phẩm nào đang sử dụng không
        const productCountStmt = db.prepare('SELECT COUNT(id_sp) AS count FROM san_pham WHERE id_loai = ?');
        const result = productCountStmt.get(id_loai);
        
        if (result && result.count > 0) {
            const err = new Error(`Không thể xóa danh mục này vì có ${result.count} sản phẩm đang thuộc về nó.`);
            err.code = 'CATEGORY_IN_USE'; // Mã lỗi tùy chỉnh
            throw err;
        }

        const stmt = db.prepare('DELETE FROM loai_san_pham WHERE id_loai = ?');
        const info = stmt.run(id_loai);
        return info.changes > 0; // Trả về true nếu xóa thành công, false nếu không
    } catch (error) {
        console.error(`Lỗi khi xóa loại sản phẩm ID ${id_loai}:`, error);
        throw error;
    }
}

module.exports = { getAll, getById, create, update, deleteById };