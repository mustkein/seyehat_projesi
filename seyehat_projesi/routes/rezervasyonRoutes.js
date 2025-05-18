const express = require('express');
const router = express.Router();
const rezervasyonController = require('../controllers/rezervasyonController');

// Rezervasyon ekleme sayfasını göster
router.get('/ekle', rezervasyonController.rezervasyonEkleGet);  // /rezervasyon/ekle

// Rezervasyon formundan gelen veriyi kaydet
router.post('/ekle', rezervasyonController.rezervasyonEklePost);  // /rezervasyon/ekle (POST)

// Rezervasyonları listele
router.get('/liste', rezervasyonController.rezervasyonListesi);  // /rezervasyon/liste

// Rezervasyon sil
router.get('/sil/:id', rezervasyonController.sil);  // /rezervasyon/sil/:id

module.exports = router;
