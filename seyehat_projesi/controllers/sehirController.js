const db = require('../config/db');

exports.listele = (req, res) => {
  db.query('SELECT * FROM Sehirler', (err, results) => {
    if (err) throw err;
    res.render('sehirler', { sehirler: results });
  });
};

exports.ekle = (req, res) => {
  const { isim } = req.body;
  db.query('INSERT INTO Sehirler (isim) VALUES (?)', [isim], (err) => {
    if (err) {
      console.error('Şehir eklenirken hata:', err);
      return res.status(500).send('Veri eklenirken hata oluştu');
    }
    console.log('Şehir başarıyla eklendi');
    res.redirect('/sehirler');
  });
};

exports.sil = (req, res) => {
  const sehirId = req.params.id;
  db.query('DELETE FROM Sehirler WHERE id = ?', [sehirId], (err) => {
    if (err) throw err;
    res.redirect('/sehirler');
  });
};
