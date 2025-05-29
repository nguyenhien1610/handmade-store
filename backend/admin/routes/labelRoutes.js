// backend/routes/labelRoutes.js
const express = require('express');
const router = express.Router();
const labelController = require('../controllers/labelController'); // Đường dẫn tới controller

router.get('/', labelController.getAllLabels);
router.post('/', labelController.createLabel);
router.put('/:id', labelController.updateLabel);
router.delete('/:id', labelController.deleteLabel);

module.exports = router;