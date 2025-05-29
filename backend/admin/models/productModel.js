// backend/models/productModel.js
const db = require('../../config/database'); // Nhập module kết nối cơ sở dữ liệu
const fs = require('fs'); // Module file system để làm việc với file
const path = require('path'); // Module path để làm việc với đường dẫn file/thư mục

// Helper function để xóa file ảnh từ server
// relativePath là đường dẫn dạng /uploads/products/ten_file.jpg
const deleteFileFromServer = (relativePath) => {
    if (!relativePath) return;
    // __dirname ở đây là backend/models
    // Đường dẫn tới thư mục uploads là ../uploads (một cấp lên, rồi vào uploads)
    const filePath = path.join(__dirname, '..', relativePath);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            // console.log(`Đã xóa file: ${filePath}`);
        }
    } catch (err) {
        // Ghi lỗi nhưng không ném ra để không dừng tiến trình chính nếu chỉ xóa file lỗi
        console.error(`Lỗi khi xóa file ${filePath}:`, err);
    }
};


// Hàm tạo sản phẩm mới và lưu hình ảnh liên quan
function createProduct(productData, imagePaths) {
    const {
        ten, mota, gia, gia_khuyen_mai, id_loai, id_nhan, slton,
        // sku, // Hiện tại chưa dùng, sẽ thêm nếu form có
    } = productData;

    const ngaytao = new Date().toISOString();
    const ngaycapnhat = ngaytao;
    let primaryImageUrl = null;

    if (imagePaths && imagePaths.length > 0) {
        primaryImageUrl = imagePaths[0];
    }

    const insertProductAndImages = db.transaction((product, images) => {
        const productStmt = db.prepare(`
            INSERT INTO san_pham 
            (ten, mota, gia, gia_khuyen_mai, id_loai, id_nhan, slton, ha_url, noi_bat, ngaytao, ngaycapnhat)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const productInfo = productStmt.run(
            product.ten,
            product.mota,
            parseFloat(product.gia), // Đảm bảo là số
            product.gia_khuyen_mai ? parseFloat(product.gia_khuyen_mai) : null, // Đảm bảo là số hoặc null
            parseInt(product.id_loai), // Đảm bảo là số nguyên
            product.id_nhan ? parseInt(product.id_nhan) : null, // Đảm bảo là số nguyên hoặc null
            parseInt(product.slton), // Đảm bảo là số nguyên
            primaryImageUrl,
            0, // noi_bat mặc định là 0
            ngaytao,
            ngaycapnhat
        );
        const productId = productInfo.lastInsertRowid;

        if (images && images.length > 0) {
            const imageStmt = db.prepare(`
                INSERT INTO hinh_anh_san_pham (id_sp, url_hinh_anh, thu_tu, alt_text)
                VALUES (?, ?, ?, ?)
            `);
            images.forEach((url, index) => {
                imageStmt.run(productId, url, index, product.ten);
            });
        }
        return productId;
    });

    try {
        const productId = insertProductAndImages(productData, imagePaths);
        const createdProduct = db.prepare('SELECT * FROM san_pham WHERE id_sp = ?').get(productId);
        const productImages = db.prepare('SELECT * FROM hinh_anh_san_pham WHERE id_sp = ? ORDER BY thu_tu').all(productId);
        return { ...createdProduct, images: productImages };
    } catch (err) {
        console.error("Lỗi CSDL khi tạo sản phẩm:", err.message);
        if (err.message.includes('UNIQUE constraint failed: san_pham.ten')) {
            throw new Error('Tên sản phẩm đã tồn tại.');
        }
        if (err.message.includes('FOREIGN KEY constraint failed')) {
            if (err.message.includes('id_loai')) throw new Error('Danh mục sản phẩm không hợp lệ.');
            if (err.message.includes('id_nhan')) throw new Error('Nhãn sản phẩm không hợp lệ.');
        }
        throw new Error('Không thể tạo sản phẩm. Lỗi cơ sở dữ liệu.');
    }
}

function getAllProducts(filters = {}) {
    try {
        let sql = `
            SELECT 
                sp.*, 
                lsp.ten AS ten_loai,
                n.ten_nhan AS ten_nhan_chinh,
                n.mau_sac_hex AS mau_nhan_chinh
            FROM san_pham sp
            LEFT JOIN loai_san_pham lsp ON sp.id_loai = lsp.id_loai
            LEFT JOIN nhan n ON sp.id_nhan = n.id_nhan
            ORDER BY sp.ngaytao DESC 
        `;
        // TODO: Thêm logic filter và phân trang

        const stmt = db.prepare(sql);
        const products = stmt.all();

        const productsWithImages = products.map(product => {
            const images = db.prepare('SELECT id_hinhanh, url_hinh_anh, thu_tu, alt_text FROM hinh_anh_san_pham WHERE id_sp = ? ORDER BY thu_tu ASC').all(product.id_sp);
            return { ...product, hinh_anh: images };
        });
        
        return productsWithImages;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        throw error;
    }
}

function getProductById(id_sp) {
    try {
        const productStmt = db.prepare(`
            SELECT 
                sp.*, 
                lsp.ten AS ten_loai,
                n.ten_nhan AS ten_nhan_chinh,
                n.mau_sac_hex AS mau_nhan_chinh
            FROM san_pham sp
            LEFT JOIN loai_san_pham lsp ON sp.id_loai = lsp.id_loai
            LEFT JOIN nhan n ON sp.id_nhan = n.id_nhan
            WHERE sp.id_sp = ?
        `);
        const product = productStmt.get(id_sp);

        if (product) {
            const images = db.prepare('SELECT id_hinhanh, url_hinh_anh, thu_tu, alt_text FROM hinh_anh_san_pham WHERE id_sp = ? ORDER BY thu_tu ASC').all(id_sp);
            return { ...product, hinh_anh: images };
        }
        return null;
    } catch (error) {
        console.error(`Lỗi khi lấy sản phẩm với ID ${id_sp}:`, error);
        throw error;
    }
}

// Hàm cập nhật sản phẩm hiện có
function updateProduct(id_sp, productData, newImagePaths) {
    const {
        ten, mota, gia, gia_khuyen_mai, id_loai, id_nhan, slton,
        // sku, // Thêm nếu SKU có thể cập nhật từ form
        // trangthai_tonkho, // Nếu có trường riêng trong DB cho trạng thái này
    } = productData;

    const ngaycapnhat = new Date().toISOString();
    let primaryImageUrlForUpdate = undefined; // Để `undefined` ban đầu, chỉ set nếu có ảnh mới

    const updateFn = db.transaction(() => {
        // Bước 1: Xử lý hình ảnh NẾU có `newImagePaths` được cung cấp và không rỗng
        if (newImagePaths && newImagePaths.length > 0) {
            // 1a. Lấy danh sách ảnh cũ để xóa file vật lý
            const oldImages = db.prepare('SELECT url_hinh_anh FROM hinh_anh_san_pham WHERE id_sp = ?').all(id_sp);
            oldImages.forEach(img => deleteFileFromServer(img.url_hinh_anh));

            // 1b. Xóa các bản ghi ảnh cũ trong CSDL
            db.prepare('DELETE FROM hinh_anh_san_pham WHERE id_sp = ?').run(id_sp);

            // 1c. Đặt URL ảnh đại diện mới
            primaryImageUrlForUpdate = newImagePaths[0];

            // 1d. Thêm các bản ghi ảnh mới vào CSDL
            const imageStmt = db.prepare(`
                INSERT INTO hinh_anh_san_pham (id_sp, url_hinh_anh, thu_tu, alt_text)
                VALUES (?, ?, ?, ?)
            `);
            newImagePaths.forEach((url, index) => {
                imageStmt.run(id_sp, url, index, ten); // Dùng tên sản phẩm mới cho alt_text
            });
        }
        // Nếu newImagePaths là một mảng rỗng (không có file mới nào được tải lên),
        // chúng ta sẽ không thay đổi hình ảnh hiện có. `primaryImageUrlForUpdate` sẽ vẫn là `undefined`.

        // Bước 2: Cập nhật thông tin sản phẩm
        // Xây dựng câu lệnh SQL động để chỉ cập nhật ha_url nếu có ảnh mới
        let updateSql = `
            UPDATE san_pham
            SET ten = ?, mota = ?, gia = ?, gia_khuyen_mai = ?, id_loai = ?, id_nhan = ?, slton = ?, 
                ngaycapnhat = ?
        `;
        const params = [
            ten,
            mota,
            parseFloat(gia),
            gia_khuyen_mai ? parseFloat(gia_khuyen_mai) : null,
            parseInt(id_loai),
            id_nhan ? parseInt(id_nhan) : null,
            parseInt(slton),
            ngaycapnhat
        ];

        if (primaryImageUrlForUpdate !== undefined) { // Có ảnh mới để cập nhật ha_url
            updateSql = `
                UPDATE san_pham
                SET ten = ?, mota = ?, gia = ?, gia_khuyen_mai = ?, id_loai = ?, id_nhan = ?, slton = ?, 
                    ha_url = ?, ngaycapnhat = ? 
                WHERE id_sp = ?
            `;
            // Chèn ha_url vào đúng vị trí trong params
            params.splice(params.length -1, 0, primaryImageUrlForUpdate);
        } else { // Không có ảnh mới, giữ nguyên ha_url cũ
             updateSql += ' WHERE id_sp = ?';
        }
        params.push(id_sp); // id_sp luôn là tham số cuối cho điều kiện WHERE

        const productUpdateStmt = db.prepare(updateSql);
        const info = productUpdateStmt.run(...params);

        if (info.changes === 0) {
            // Kiểm tra xem sản phẩm có thực sự tồn tại không
            const productExists = db.prepare('SELECT 1 FROM san_pham WHERE id_sp = ?').get(id_sp);
            if (!productExists) {
                 throw new Error(`Sản phẩm với ID ${id_sp} không tìm thấy để cập nhật.`);
            }
            // Nếu tồn tại nhưng không có thay đổi, có thể dữ liệu giống hệt. Không coi là lỗi.
        }
        return id_sp;
    });

    try {
        const updatedProductId = updateFn();
        return getProductById(updatedProductId); // Trả về sản phẩm đã cập nhật đầy đủ
    } catch (err) {
        console.error(`Lỗi CSDL khi cập nhật sản phẩm ID ${id_sp}:`, err.message);
        if (err.message.includes('UNIQUE constraint failed: san_pham.ten')) {
            throw new Error('Tên sản phẩm đã tồn tại (cho một sản phẩm khác).');
        }
        if (err.message.includes('FOREIGN KEY constraint failed')) {
            if (err.message.includes('id_loai')) throw new Error('Danh mục sản phẩm không hợp lệ khi cập nhật.');
            if (err.message.includes('id_nhan')) throw new Error('Nhãn sản phẩm không hợp lệ khi cập nhật.');
        }
        throw new Error(err.message || 'Không thể cập nhật sản phẩm. Lỗi cơ sở dữ liệu.');
    }
}

// Hàm xóa sản phẩm
function deleteProduct(id_sp) {
    const deleteFn = db.transaction(() => {
        // Kiểm tra sản phẩm có tồn tại không trước khi xóa
        const product = db.prepare('SELECT ha_url FROM san_pham WHERE id_sp = ?').get(id_sp);
        if (!product) {
            return { affectedRows: 0, message: "Sản phẩm không tồn tại." };
        }

        // 1. Lấy danh sách tất cả hình ảnh phụ để xóa file
        const imagesToDelete = db.prepare('SELECT url_hinh_anh FROM hinh_anh_san_pham WHERE id_sp = ?').all(id_sp);

        // 2. Xóa các bản ghi hình ảnh từ bảng hinh_anh_san_pham
        db.prepare('DELETE FROM hinh_anh_san_pham WHERE id_sp = ?').run(id_sp);

        // 3. Xóa sản phẩm từ bảng san_pham
        const info = db.prepare('DELETE FROM san_pham WHERE id_sp = ?').run(id_sp);

        // 4. Xóa file vật lý của các hình ảnh
        imagesToDelete.forEach(img => deleteFileFromServer(img.url_hinh_anh));
        // Xóa cả ảnh đại diện (ha_url) nếu nó có và chưa nằm trong imagesToDelete (hiếm khi xảy ra nếu logic đúng)
        if (product.ha_url && !imagesToDelete.some(img => img.url_hinh_anh === product.ha_url)) {
            deleteFileFromServer(product.ha_url);
        }
        
        return { affectedRows: info.changes }; // info.changes sẽ là 1 nếu xóa thành công
    });

    try {
        const result = deleteFn();
        return result;
    } catch (err) {
        console.error(`Lỗi CSDL khi xóa sản phẩm ID ${id_sp}:`, err.message);
        if (err.message.includes('FOREIGN KEY constraint failed')) {
            // Lỗi này thường xảy ra nếu sản phẩm đã được liên kết trong bảng khác (VD: chi_tiet_don_hang)
            // và CSDL có ràng buộc khóa ngoại không cho phép xóa.
            throw new Error('Không thể xóa sản phẩm này do nó có liên quan đến dữ liệu khác (ví dụ: trong một đơn hàng đã đặt).');
        }
        throw new Error('Không thể xóa sản phẩm. Lỗi cơ sở dữ liệu.');
    }
}

// Xuất các hàm để các module khác có thể sử dụng
module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,    // <<--- THÊM DÒNG NÀY
    deleteProduct     // <<--- VÀ DÒNG NÀY
};