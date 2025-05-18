const db = require('../config/db');

// Şehirleri listeleyen işlev
exports.listele = (req, res) => {
  db.query('SELECT * FROM Sehirler', (err, results) => {
    if (err) throw err;
    res.render('sehirler', { sehirler: results });
  });
};
