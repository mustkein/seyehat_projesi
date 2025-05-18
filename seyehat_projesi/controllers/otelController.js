const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// 📦 Fotoğrafın kaydedileceği dizin ve isimlendirme
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ✅ Otelleri listeleme
exports.listele = (req, res) => {
  const { sehir, fiyatMin, fiyatMax } = req.query;

  db.query('SELECT * FROM Sehirler', (err, sehirler) => {
    if (err) throw err;

    let query = `
      SELECT 
        Oteller.*, 
        Sehirler.isim AS sehirIsmi,
        MIN(OtelOdaTurleri.fiyat) AS minFiyat
      FROM Oteller
      LEFT JOIN Sehirler ON Oteller.sehir_id = Sehirler.id
      LEFT JOIN OtelOdaTurleri ON Oteller.id = OtelOdaTurleri.otel_id
    `;
    let queryParams = [];

    // Filtreleme
    const conditions = [];

    if (sehir) {
      conditions.push('Sehirler.isim LIKE ?');
      queryParams.push('%' + sehir + '%');
    }

    if (fiyatMin) {
      conditions.push('OtelOdaTurleri.fiyat >= ?');
      queryParams.push(fiyatMin);
    }

    if (fiyatMax) {
      conditions.push('OtelOdaTurleri.fiyat <= ?');
      queryParams.push(fiyatMax);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY Oteller.id';

    db.query(query, queryParams, (err, oteller) => {
      if (err) throw err;
      res.render('oteller', { oteller, sehirler });
    });
  });
};

// ✅ Otel detay sayfası (Odalar dahil)
exports.detay = (req, res) => {
  const otelId = req.params.id;

  // Önce otel bilgileri alınır
  db.query(`
    SELECT Oteller.*, Sehirler.isim AS sehirIsmi 
    FROM Oteller 
    LEFT JOIN Sehirler ON Oteller.sehir_id = Sehirler.id 
    WHERE Oteller.id = ?
  `, [otelId], (err, otelSonuc) => {
    if (err) return res.status(500).send('Veritabanı hatası');

    if (otelSonuc.length === 0) {
      return res.status(404).send('Otel bulunamadı');
    }

    const otel = otelSonuc[0];

    // Şimdi odaları da al
    db.query(`
      SELECT Odalar.*, OdaTurleri.tur_adi, OdaTurleri.fiyat AS tur_fiyati 
      FROM Odalar 
      LEFT JOIN OdaTurleri ON Odalar.oda_turu_id = OdaTurleri.id 
      WHERE Odalar.otel_id = ?
    `, [otelId], (err, odalar) => {
      if (err) return res.status(500).send('Odalar alınırken hata oluştu');

      res.render('otelDetay', { otel, odalar });
    });
  });
};

// --- Otel Ekleme Sayfasını Render Etme ---
exports.otelEkleSayfa = (req, res) => {
  db.query('SELECT * FROM Sehirler', (err, sehirler) => {
    if (err) return res.status(500).send('Veritabanı hatası');
    
    // Otel isimlerini al
    db.query('SELECT DISTINCT isim FROM Oteller', (err2, otelIsimleri) => {
      if (err2) return res.status(500).send('Otel isimleri alınamadı');
      
      // EJS'e hem şehirler hem otel isimleri gönder
      res.render('otelEkle', { sehirler, otelIsimleri });
    });
  });
};

exports.ekle = (req, res) => {
  const { isim, sehir_id, oda_turu, oda_fiyat } = req.body;
  const foto = req.file ? req.file.filename : null;

  // Önce oteli ekle
  db.query(
    'INSERT INTO Oteller (isim, foto, sehir_id) VALUES (?, ?, ?)',
    [isim, foto, sehir_id],
    (err, result) => {
      if (err) return res.status(500).send('Otel eklenirken bir hata oluştu.');

      const otelId = result.insertId;

      // Oda türlerini OtelOdaTurleri tablosuna ekle
      if (Array.isArray(oda_turu) && Array.isArray(oda_fiyat)) {
        const odaTurleriEkleme = oda_turu.map((tur, index) => {
          return new Promise((resolve, reject) => {
            const fiyat = oda_fiyat[index];
            db.query(
              'INSERT INTO OtelOdaTurleri (otel_id, tur_adi, fiyat) VALUES (?, ?, ?)',
              [otelId, tur, fiyat],
              (err2) => {
                if (err2) return reject(err2);
                resolve();
              }
            );
          });
        });

        Promise.all(odaTurleriEkleme)
          .then(() => res.redirect('/oteller'))
          .catch(err => res.status(500).send('Oda türleri eklenirken hata oluştu.'));
      } else {
        res.redirect('/oteller');
      }
    }
  );
};


// --- Otel Düzenleme Sayfası ---
exports.duzenleSayfa = (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM Oteller WHERE id = ?', [id], (err, otelSonuc) => {
    if (err) return res.status(500).send('Veritabanı hatası');
    if (otelSonuc.length === 0) return res.status(404).send('Otel bulunamadı');

    const otel = otelSonuc[0];

    // Oda türlerini al
    db.query('SELECT * FROM OtelOdaTurleri WHERE otel_id = ?', [id], (err, odaTurleri) => {
      if (err) return res.status(500).send('Oda türleri alınırken hata oluştu');

      db.query('SELECT * FROM Sehirler', (err, sehirler) => {
        if (err) return res.status(500).send('Veritabanı hatası');
        res.render('otelDuzenle', { otel, sehirler, odaTurleri });
      });
    });
  });
};
// --- Otel Güncelleme ---
exports.guncelle = (req, res) => {
  const { id } = req.params;
  const { isim, sehir_id, oda_turu, oda_fiyat } = req.body;  // Fiyat artık kullanılmıyor
  const foto = req.file ? req.file.filename : null;

  // Otel bilgilerini güncelle
  let query = foto
    ? 'UPDATE Oteller SET isim = ?, sehir_id = ?, foto = ? WHERE id = ?'
    : 'UPDATE Oteller SET isim = ?, sehir_id = ? WHERE id = ?';

  let params = foto
    ? [isim, sehir_id, foto, id]
    : [isim, sehir_id, id];

  db.query(query, params, (err) => {
    if (err) return res.status(500).send('Otel bilgileri güncellenirken hata oluştu');

    // Oda türlerini güncelle
    // Önce mevcut oda türlerini sil
    db.query('DELETE FROM OtelOdaTurleri WHERE otel_id = ?', [id], (err2) => {
      if (err2) return res.status(500).send('Oda türleri silinirken hata oluştu');

      // Yeni oda türlerini ekle
      if (Array.isArray(oda_turu) && Array.isArray(oda_fiyat)) {
        const odaTurleriEkleme = oda_turu.map((tur, index) => {
          return new Promise((resolve, reject) => {
            const fiyat = oda_fiyat[index];
            db.query(
              'INSERT INTO OtelOdaTurleri (otel_id, tur_adi, fiyat) VALUES (?, ?, ?)',
              [id, tur, fiyat],
              (err3) => {
                if (err3) return reject(err3);
                resolve();
              }
            );
          });
        });

        Promise.all(odaTurleriEkleme)
          .then(() => res.redirect('/oteller'))
          .catch(err => res.status(500).send('Oda türleri eklenirken hata oluştu.'));
      } else {
        res.redirect('/oteller');
      }
    });
  });
};


//Otel Silme
exports.sil = (req, res) => {
  const { id } = req.params;

  // 1. Önce oda türlerini sil
  db.query('DELETE FROM OtelOdaTurleri WHERE otel_id = ?', [id], (err1) => {
    if (err1) return res.status(500).send('Oda türleri silinirken hata oluştu');

    // 2. Sonra odaları sil (eğer varsa)
    db.query('DELETE FROM Odalar WHERE otel_id = ?', [id], (err2) => {
      if (err2) return res.status(500).send('Odalar silinirken hata oluştu');

      // 3. En son oteli sil
      db.query('DELETE FROM Oteller WHERE id = ?', [id], (err3) => {
        if (err3) return res.status(500).send('Otel silinirken hata oluştu');
        res.redirect('/oteller');
      });
    });
  });
};
