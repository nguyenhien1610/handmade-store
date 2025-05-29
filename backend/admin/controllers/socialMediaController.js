// backend/admin/controllers/socialMediaController.js

// Giả sử model ở backend/models/socialMediaModel.js
// Thêm try-catch cho cả require này
let socialMediaModel;
try {
    socialMediaModel = require('../models/socialMediaModel'); // KIỂM TRA KỸ ĐƯỜNG DẪN NÀY
    console.log("CONTROLLER SUCCESS: socialMediaModel required.");
} catch(e) {
    console.error("CONTROLLER FATAL ERROR: Could not require socialMediaModel:", e);
}


async function getSocialMediaConfig(req, res) {
    console.log("CONTROLLER: getSocialMediaConfig - Function REACHED!");
    try {
        if (!socialMediaModel || typeof socialMediaModel.getAllSocialMediaLinks !== 'function') {
            console.error("CONTROLLER ERROR: socialMediaModel is not loaded correctly or getAllSocialMediaLinks is not a function.");
            return res.status(500).json({ message: "Lỗi cấu hình server: Model không hợp lệ." });
        }

        console.log("CONTROLLER: Calling socialMediaModel.getAllSocialMediaLinks()...");
        const links = socialMediaModel.getAllSocialMediaLinks(); // Hoặc await nếu là async

        console.log("CONTROLLER: Data from model:", links);
        res.status(200).json(links);
    } catch (error) {
        console.error("CONTROLLER ERROR in getSocialMediaConfig:", error.message, error.stack);
        res.status(500).json({ message: "Lỗi máy chủ khi lấy cấu hình mạng xã hội.", error: error.message });
    }
}

async function updateSocialMediaConfig(req, res) {
    // ... thêm log tương tự ...
    console.log("CONTROLLER: updateSocialMediaConfig - Function REACHED!");
    console.log("CONTROLLER: Request body:", req.body); // Log dữ liệu nhận được

    try {
        const payload = req.body;
        // Kiểm tra xem payload có đúng như mong đợi không
        if (!payload || typeof payload.facebook === 'undefined') { // Thêm các kiểm tra khác nếu cần
            console.error("CONTROLLER ERROR: Invalid payload received:", payload);
            return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
        }

        // Kiểm tra model
        if (!socialMediaModel || typeof socialMediaModel.updateSocialMediaLinks !== 'function') {
            console.error("CONTROLLER ERROR: Model for update not loaded correctly.");
            return res.status(500).json({ message: "Lỗi cấu hình server: Model cập nhật không hợp lệ." });
        }

        console.log("CONTROLLER: Calling socialMediaModel.updateSocialMediaLinks with payload:", payload);
        // QUAN TRỌNG: Nếu updateSocialMediaLinks là async, bạn CẦN await
        const result = await socialMediaModel.updateSocialMediaLinks(payload);
        console.log("CONTROLLER: Result from model updateSocialMediaLinks:", result);

        console.log("CONTROLLER: Sending success response.");
        res.status(200).json({ message: "Cấu hình đã được cập nhật thành công!", data: result }); // Gửi response thành công

    } catch (error) {
        console.error("CONTROLLER ERROR in updateSocialMediaConfig:", error.message, error.stack);
        if (!res.headersSent) { // Chỉ gửi response nếu chưa có response nào được gửi
            console.log("CONTROLLER: Sending error response.");
            res.status(500).json({ message: "Lưu cấu hình thất bại do lỗi máy chủ.", error: error.message });
        }
    }
    // ...
}

console.log("CONTROLLER: Attempting to export getSocialMediaConfig and updateSocialMediaConfig");
module.exports = {
    getSocialMediaConfig,
    updateSocialMediaConfig,
};
console.log("CONTROLLER: Exports defined.");