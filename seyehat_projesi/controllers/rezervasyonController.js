const db = require('../config/db');


exports.rezervasyonEkleGet = (req, res) => {
  db.query('SELECT * FROM Oteller', (err, oteller) => {
    if (err) return res.status(500).send(err);
    
    // Oda türlerini almak
    const otelId = req.query.otel_id; // Seçilen otel id'si
    let odaTurleriQuery = 'SELECT * FROM OtelOdaTurleri WHERE otel_id = ?';
    
    db.query(odaTurleriQuery, [otelId], (err, otelOdaTurleri) => {
      if (err) return res.status(500).send(err);

      res.render('rezervasyonEkle', { oteller, otelOdaTurleri });
    });
  });
};


// Rezervasyon ekleme (POST)
exports.rezervasyonEklePost = (req, res) => {
  const { ad, soyad, email, telefon, otel_id, oda_turu_id, giris_tarihi, cikis_tarihi } = req.body;

  // Müşteri kontrol/ekleme
  const musteriSorgu = 'SELECT id FROM Musteriler WHERE email = ?';
  db.query(musteriSorgu, [email], (err, musteriler) => {
    if (err) return res.status(500).send(err);

    if (musteriler.length > 0) {
      rezervasyonIslemleri(musteriler[0].id);
    } else {
      const musteriEkle = 'INSERT INTO Musteriler (ad, soyad, email, telefon) VALUES (?, ?, ?, ?)';
      db.query(musteriEkle, [ad, soyad, email, telefon], (err2, result) => {
        if (err2) return res.status(500).send(err2);
        rezervasyonIslemleri(result.insertId);
      });
    }
  });

  function rezervasyonIslemleri(musteriId) {
    // Seçilen otel id'sini ve oda türü id'sini kullanıyoruz
    const otelId = otel_id;
    const odaTuruId = oda_turu_id; // Oda türü ID'si

    rezervasyonEkle(musteriId, otelId, odaTuruId);
  }

  function rezervasyonEkle(musteriId, otelId, odaTuruId) {
    const sorgu = `
      INSERT INTO Rezervasyonlar (musteri_id, otel_id, oda_turu_id, giris_tarihi, cikis_tarihi, tarih)
      VALUES (?, ?, ?, ?, ?, CURDATE())
    `;
    db.query(sorgu, [musteriId, otelId, odaTuruId, giris_tarihi, cikis_tarihi], (err) => {
      if (err) return res.status(500).send(err);
      res.redirect('/rezervasyonlar');
    });
  }
};



// Rezervasyonları listeleme
exports.rezervasyonListesi = (req, res) => {
  const sql = `
    SELECT 
      R.id, R.giris_tarihi, R.cikis_tarihi, M.ad AS musteri_ad, M.soyad AS musteri_soyad, 
      O.isim AS otel_isim, OT.tur_adi AS oda_turu, OT.fiyat AS oda_fiyat
    FROM 
      Rezervasyonlar R
    JOIN 
      Musteriler M ON R.musteri_id = M.id
    JOIN 
      Oteller O ON R.otel_id = O.id
    JOIN 
      OtelOdaTurleri OT ON R.oda_turu_id = OT.id
    ORDER BY 
      R.id DESC;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Rezervasyonlar listelenirken hata:', err);
      return res.status(500).send('Rezervasyonlar listelenirken hata oluştu');
    }
    // Verilerin doğru şekilde geldiğinden emin olun
    console.log(results);  
    res.render('rezervasyonlar', { rezervasyonlar: results });
  });
};




exports.sil = (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM Rezervasyonlar WHERE id = ?';

  db.query(sql, [id], (err) => {
    if (err) {
      console.error('Silme hatası:', err);
      return res.status(500).send('Rezervasyon silinemedi.');
    }
    res.redirect('/rezervasyonlar');
  });
};
