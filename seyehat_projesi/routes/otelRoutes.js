const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const otelController = require('../controllers/otelController');
const db = require('../config/db');
const upload = require('../middleware/upload');

// === Oteller ===

// Otelleri listeleme
router.get('/', otelController.listele);

// Tek bir otel detayını gösterme
router.get('/oteller/:id', otelController.detay);

// Otel düzenleme sayfası
router.get('/oteller/duzenle/:id', otelController.duzenleSayfa);

// Otel güncelleme
router.post('/oteller/guncelle/:id', upload.single('foto'), otelController.guncelle);

// Otel silme
router.post('/oteller/sil/:id', otelController.sil);

// Yeni otel ekleme sayfası
router.get('/otelEkle', (req, res) => {
  db.query('SELECT * FROM Sehirler', (err, sehirler) => {
    if (err) {
      console.error('Şehirler alınırken hata:', err);
      return res.status(500).send('Veritabanı hatası');
    }
    res.render('otelEkle', { sehirler });
  });
});

// Yeni otel ekleme işlemi
router.post('/oteller', upload.single('foto'), otelController.ekle);

// === Odalar ===

// Oda ekleme sayfası (otel_id query ile alınır)
router.get('/odalar/yeni', (req, res) => {
  const otel_id = req.query.otel_id;

  // Oda türlerini getir
  db.query('SELECT * FROM OdaTurleri', (err, odaTurleri) => {
    if (err) {
      console.error('Oda türleri alınamadı:', err);
      return res.status(500).send('Veritabanı hatası');
    }
    res.render('odaEkle', { otel_id, odaTurleri });
  });
});

// Oda ekleme işlemi
router.post('/odalar', (req, res) => {
  const { otel_id, oda_numarasi, kapasite, oda_turu_id } = req.body;

  db.query(
    'INSERT INTO Odalar (otel_id, oda_numarasi, kapasite, oda_turu_id) VALUES (?, ?, ?, ?)',
    [otel_id, oda_numarasi, kapasite, oda_turu_id],
    (err, result) => {
      if (err) {
        console.error('Oda eklenemedi:', err);
        return res.status(500).send('Veritabanı hatası');
      }
      res.redirect(`/oteller/${otel_id}`); // Otele geri dön
    }
  );
});

module.exports = router;
