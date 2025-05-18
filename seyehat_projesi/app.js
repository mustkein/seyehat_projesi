const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const path = require('path');
const otelRoutes = require('./routes/otelRoutes'); // Otellerle ilgili route'lar
const rezervasyonRoutes = require('./routes/rezervasyonRoutes'); // Rezervasyonlarla ilgili route'lar
const sehirRoutes = require('./routes/sehirRoutes'); // Şehirlerle ilgili route'lar
const otelController = require('./controllers/otelController');
const multer = require('multer');
const rezervasyonController = require('./controllers/rezervasyonController');



// Veritabanı bağlantısını yapıyoruz
const db = require('./config/db');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// EJS şablon motorunu kullanmak için
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Views dizinini ayarlıyoruz
app.use('/uploads', express.static('uploads'));


// Statik dosyalar için public klasörünü kullanacağız
app.use(express.static(path.join(__dirname, 'public')));
// Form verilerini işlemek için
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));  // Form verilerini çözümlemek için
app.use(bodyParser.json());  // JSON verilerini çözümlemek için

// Routes işlemleri
app.get('/otelEkle', otelController.otelEkleSayfa);
app.use('/oteller', otelRoutes);       // Otellerle ilgili işlemler
app.use('/sehirler', sehirRoutes);     // Şehirlerle ilgili işlemler
app.use('/', otelRoutes);
app.get('/rezervasyonEkle', rezervasyonController.rezervasyonEkleGet);  // GET request
app.post('/rezervasyonEkle', rezervasyonController.rezervasyonEklePost);  // POST request
app.get('/rezervasyonlar', rezervasyonController.rezervasyonListesi);
// GET isteği ile silme (silme işlemi için genelde POST veya DELETE önerilir)
app.get('/rezervasyonlar/sil/:id', rezervasyonController.sil);
// Oda türlerini getir (GET)
app.get('/odaTurleri/:otelId', (req, res) => {
  const otelId = req.params.otelId;
  const query = 'SELECT * FROM OtelOdaTurleri WHERE otel_id = ?';
  
  db.query(query, [otelId], (err, odaTurleri) => {
    if (err) return res.status(500).send(err);
    res.json(odaTurleri); // Oda türlerini JSON formatında gönderiyoruz
  });
});


// Ana sayfa yönlendirmesi
app.get('/', (req, res) => {
  res.redirect('/oteller');  // Ana sayfa olarak oteller sayfasını gösteriyoruz
});
app.get('/sehirler', (req, res) => {
  const query = 'SELECT * FROM Sehirler'; // Şehirleri veritabanından çekiyoruz

  db.query(query, (err, results) => {
    if (err) {
      console.error('Veriler alınırken hata:', err);
      return res.status(500).send('Veriler alınırken hata oluştu');
    }

    res.render('sehirler', { cities: results }); // Şehirleri EJS sayfasına gönderiyoruz
  });
});


// Sunucu başlatma
app.listen(3000, () => {
  console.log('Sunucu çalışıyor: http://localhost:3000');
});
