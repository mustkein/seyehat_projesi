const mysql = require('mysql2');

// Veritabanı bağlantısını yapıyoruz
const db = mysql.createConnection({
  host: 'localhost',        // MySQL sunucusunun adresi
  user: 'root',             // Veritabanı kullanıcısı
  password: 'AlpereN3551!',        // Veritabanı şifresi
  database: 'seyehat'    // Kullanacağımız veritabanı adı
});

// Bağlantıyı test edelim
db.connect((err) => {
  if (err) {
    console.error('Veritabanı bağlantısı hatası: ' + err.stack);
    return;
  }
  console.log('Veritabanına başarıyla bağlanıldı!');
});

module.exports = db;  // Veritabanı bağlantısını dışa aktarıyoruz
