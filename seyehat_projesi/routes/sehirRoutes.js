const express = require('express');
const router = express.Router();
const sehirController = require('../controllers/sehirController');

// Şehirleri listeleme
router.get('/', sehirController.listele);

// Şehir ekleme
router.post('/ekle', sehirController.ekle);

// Şehir silme
router.get('/sil/:id', sehirController.sil);

module.exports = router;
