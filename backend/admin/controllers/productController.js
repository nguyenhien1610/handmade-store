const Product = require('../models/productModel'); // Nhập Product model
const path = require('path'); // Module path để làm việc với đường dẫn file/thư mục
const fs = require('fs'); // Để xóa file ảnh cũ (nếu cần)

// Hàm xử lý yêu cầu tạo sản phẩm mới
async function createProduct(req, res) {
    try {
        const productData = req.body; // Dữ liệu sản phẩm từ form (trừ file)

        // Kiểm tra dữ liệu đầu vào cơ bản
        if (!productData.ten || !productData.gia || !productData.id_loai || productData.slton === undefined) {
            return res.status(400).json({ message: "Thông tin bắt buộc (Tên, Giá, Danh mục, Số lượng tồn) không được để trống." });
        }
        // Kiểm tra giá có phải là số hợp lệ không
        if (isNaN(parseFloat(productData.gia)) || parseFloat(productData.gia) < 0) {
            return res.status(400).json({ message: "Giá bán không hợp lệ." });
        }
        // Kiểm tra giá khuyến mãi (nếu có) có hợp lệ không
        if (productData.gia_khuyen_mai && (isNaN(parseFloat(productData.gia_khuyen_mai)) || parseFloat(productData.gia_khuyen_mai) < 0)) {
            return res.status(400).json({ message: "Giá khuyến mãi không hợp lệ." });
        }
        // Kiểm tra số lượng tồn kho có hợp lệ không
        if (isNaN(parseInt(productData.slton)) || parseInt(productData.slton) < 0) {
            return res.status(400).json({ message: "Số lượng tồn kho không hợp lệ." });
        }

        let imagePaths = []; // Mảng chứa đường dẫn tương đối của các hình ảnh
        // Kiểm tra xem có file nào được tải lên không (req.files được cung cấp bởi multer)
        if (req.files && req.files.length > 0) {
            // Tạo mảng các đường dẫn tương đối để lưu vào CSDL và sử dụng cho URL
            // Ví dụ: /uploads/products/ten_file_anh.jpg
            imagePaths = req.files.map(file => `/uploads/products/${file.filename}`);
        }
        
        // Gọi hàm createProduct từ Product model để lưu sản phẩm và hình ảnh vào CSDL
        const newProduct = await Product.createProduct(productData, imagePaths);
        // Trả về mã 201 (Created) và thông báo thành công cùng với dữ liệu sản phẩm vừa tạo
        res.status(201).json({ message: "Sản phẩm đã được tạo thành công!", product: newProduct });

    } catch (error) {
        // Ghi lỗi chi tiết ra console
        console.error("Lỗi Controller khi tạo sản phẩm:", error);
        // Trả về mã 500 (Internal Server Error) và thông báo lỗi
        // Ưu tiên hiển thị thông báo lỗi cụ thể từ model nếu có
        res.status(500).json({ message: error.message || "Lỗi máy chủ khi tạo sản phẩm." });
    }
}

async function getAllProducts(req, res) {
    try {
        const filters = req.query; 
        const products = await Product.getAllProducts(filters);
        res.json(products);
    } catch (error) {
        console.error("Lỗi Controller khi lấy danh sách sản phẩm:", error);
        res.status(500).json({ message: error.message || "Lỗi máy chủ khi lấy danh sách sản phẩm." });
    }
}

async function getProductById(req, res) {
    try {
        const { id } = req.params; 
        const product = await Product.getProductById(id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Sản phẩm không tồn tại." });
        }
    } catch (error) {
        console.error(`Lỗi Controller khi lấy sản phẩm ID ${req.params.id}:`, error);
        res.status(500).json({ message: error.message || "Lỗi máy chủ khi lấy sản phẩm." });
    }
}

// Hàm xử lý yêu cầu cập nhật sản phẩm
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const productData = req.body;

        // Kiểm tra dữ liệu đầu vào cơ bản (tương tự createProduct)
        if (!productData.ten || !productData.gia || !productData.id_loai || productData.slton === undefined) {
            return res.status(400).json({ message: "Thông tin bắt buộc (Tên, Giá, Danh mục, Số lượng tồn) không được để trống." });
        }
        if (isNaN(parseFloat(productData.gia)) || parseFloat(productData.gia) < 0) {
            return res.status(400).json({ message: "Giá bán không hợp lệ." });
        }
        if (productData.gia_khuyen_mai && (isNaN(parseFloat(productData.gia_khuyen_mai)) || parseFloat(productData.gia_khuyen_mai) < 0)) {
            return res.status(400).json({ message: "Giá khuyến mãi không hợp lệ." });
        }
        if (isNaN(parseInt(productData.slton)) || parseInt(productData.slton) < 0) {
            return res.status(400).json({ message: "Số lượng tồn kho không hợp lệ." });
        }

        let newImagePaths = [];
        // Nếu có file mới được tải lên, chúng sẽ thay thế toàn bộ ảnh cũ
        // Model Product.updateProduct sẽ cần xử lý việc xóa ảnh cũ trong CSDL và trên server.
        if (req.files && req.files.length > 0) {
            newImagePaths = req.files.map(file => `/uploads/products/${file.filename}`);
        }
        // Nếu không có file mới nào được tải lên (req.files rỗng hoặc undefined),
        // productData có thể chứa thông tin về ảnh hiện tại cần giữ lại hoặc một mảng rỗng
        // nếu người dùng muốn xóa hết ảnh mà không thêm ảnh mới.
        // Model Product.updateProduct cần logic để xử lý việc này.
        // Ví dụ: nếu productData.existing_images là một mảng các URL ảnh cũ cần giữ lại
        // hoặc nếu newImagePaths rỗng và productData.clear_images = true thì xóa hết ảnh.
        // Hiện tại, đơn giản là nếu có file mới thì dùng file mới, nếu không thì model tự xử lý.

        const updatedProduct = await Product.updateProduct(id, productData, newImagePaths);
        if (updatedProduct) {
            res.json({ message: "Sản phẩm đã được cập nhật thành công!", product: updatedProduct });
        } else {
            // Trường hợp Product.updateProduct trả về null/undefined nếu sản phẩm không tìm thấy để cập nhật
            res.status(404).json({ message: "Sản phẩm không tồn tại hoặc không thể cập nhật." });
        }
    } catch (error) {
        console.error(`Lỗi Controller khi cập nhật sản phẩm ID ${req.params.id}:`, error);
        // Xóa file đã tải lên nếu có lỗi xảy ra sau khi multer đã lưu file
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '..', file.path); // Giả sử file.path là đường dẫn đầy đủ hoặc tương đối từ thư mục gốc dự án
                // Hoặc nếu file.path là '../uploads/products/filename.jpg'
                // const filePath = path.join(__dirname, '../uploads/products/', file.filename);
                fs.unlink(filePath, err => {
                    if (err) console.error("Lỗi khi xóa file tạm sau lỗi controller:", err);
                });
            });
        }
        res.status(500).json({ message: error.message || "Lỗi máy chủ khi cập nhật sản phẩm." });
    }
}

// Hàm xử lý yêu cầu xóa sản phẩm
async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const result = await Product.deleteProduct(id); // Model nên trả về thông tin về việc xóa

        if (result && result.affectedRows > 0) { // Giả sử result có affectedRows
            res.json({ message: "Sản phẩm đã được xóa thành công." });
        } else if (result && result.message) { // Nếu model trả về thông báo cụ thể
             res.status(404).json({ message: result.message });
        }
        else {
            res.status(404).json({ message: "Sản phẩm không tồn tại hoặc không thể xóa." });
        }
    } catch (error) {
        console.error(`Lỗi Controller khi xóa sản phẩm ID ${req.params.id}:`, error);
        res.status(500).json({ message: error.message || "Lỗi máy chủ khi xóa sản phẩm." });
    }
}


// Xuất các hàm controller
module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,    // <<--- THÊM DÒNG NÀY
    deleteProduct     // <<--- VÀ DÒNG NÀY
};