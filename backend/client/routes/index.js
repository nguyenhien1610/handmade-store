const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Client API đang hoạt động' });
});

module.exports = router;
