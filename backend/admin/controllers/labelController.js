// backend/controllers/labelController.js
const Label = require('../models/labelModel'); // Đường dẫn tới model

async function getAllLabels(req, res) {
    try {
        const labels = Label.getAll();
        res.json(labels);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tải danh sách nhãn: " + error.message });
    }
}

async function createLabel(req, res) {
    try {
        const { ten_nhan, mau_sac_hex, mota_nhan } = req.body;
        if (!ten_nhan || ten_nhan.trim() === '') {
            return res.status(400).json({ message: "Tên nhãn là bắt buộc." });
        }
        const newLabel = Label.create(ten_nhan, mau_sac_hex, mota_nhan);
        res.status(201).json(newLabel);
    } catch (error) {
        if (error.code === 'DUPLICATE_LABEL_NAME') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: "Lỗi khi tạo nhãn: " + error.message });
    }
}

async function updateLabel(req, res) {
    try {
        const { id } = req.params;
        const { ten_nhan, mau_sac_hex, mota_nhan } = req.body;

        if (!ten_nhan || ten_nhan.trim() === '') {
            return res.status(400).json({ message: "Tên nhãn là bắt buộc." });
        }
        const updatedLabel = Label.update(Number(id), ten_nhan, mau_sac_hex, mota_nhan);
        if (!updatedLabel) {
            return res.status(404).json({ message: "Không tìm thấy nhãn để cập nhật." });
        }
        res.json(updatedLabel);
    } catch (error) {
        if (error.code === 'DUPLICATE_LABEL_NAME') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: "Lỗi khi cập nhật nhãn: " + error.message });
    }
}

async function deleteLabel(req, res) {
    try {
        const { id } = req.params;
        const success = Label.deleteById(Number(id));
        if (!success) {
            return res.status(404).json({ message: "Không tìm thấy nhãn để xóa." });
        }
        res.status(200).json({ message: "Nhãn đã được xóa thành công." });
    } catch (error) {
        // Nếu bạn thêm logic kiểm tra nhãn đang sử dụng trong model và ném lỗi
        // if (error.code === 'LABEL_IN_USE') {
        //     return res.status(400).json({ message: error.message });
        // }
        res.status(500).json({ message: "Lỗi khi xóa nhãn: " + error.message });
    }
}

module.exports = { getAllLabels, createLabel, updateLabel, deleteLabel };