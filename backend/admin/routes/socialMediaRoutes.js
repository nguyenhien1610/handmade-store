// backend/admin/routes/socialMediaRoutes.js
const express = require('express');
const router = express.Router();

let socialMediaController;
try {
    socialMediaController = require('../controllers/socialMediaController');
    console.log("ROUTER FILE: SUCCESS: socialMediaController was required."); // Đổi tên log để phân biệt
    // ... (các log kiểm tra controller khác như bạn đã có) ...
} catch (e) {
    console.error("ROUTER FILE: FATAL ERROR: Could not require socialMediaController:", e);
}

if (socialMediaController && typeof socialMediaController.getSocialMediaConfig === 'function') {
    router.get('/', socialMediaController.getSocialMediaConfig); // Dòng này QUAN TRỌNG
    console.log("ROUTER FILE: ROUTE DEFINED: GET / using socialMediaController.getSocialMediaConfig");
} else {
    router.get('/', (req, res) => { // Fallback nếu controller không đúng
        console.error("ROUTER FILE: FALLBACK ROUTE: socialMediaController.getSocialMediaConfig was not available.");
        res.status(500).json({ error: "Server configuration error in Router: Controller for social media GET not found." });
    });
}
if (socialMediaController && typeof socialMediaController.updateSocialMediaConfig === 'function') {
    router.put('/', socialMediaController.updateSocialMediaConfig);
    console.log("ROUTER FILE: ROUTE DEFINED: PUT / using socialMediaController.updateSocialMediaConfig");
} else {
    router.put('/', (req, res) => {
        console.error("ROUTER FILE: FALLBACK ROUTE FOR PUT: socialMediaController.updateSocialMediaConfig was not available.");
        res.status(500).json({ error: "Server configuration error in Router: Controller for social media PUT not found." });
    });
}

module.exports = router;