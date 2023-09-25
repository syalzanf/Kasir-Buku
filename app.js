const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const port = 3000;
const conn = require("./configdb");
const admin = require('./admin');
const kasir = require('./kasir');

// Konfigurasi session
app.use(session({
    secret: 'SY4L11', // Ganti dengan kunci rahasia yang kuat
    resave: false,
    saveUninitialized: true,
}));

// Pengaturan template engine
app.set('view engine', 'ejs');

// Middleware untuk parsing data yang dikirimkan melalui body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware untuk mengatur direktori tampilan statis
app.use(express.static('public'));

// Halaman utama untuk admin dan kasir
app.get('/', (req, res) => {
    res.render('login', { nama: 'syalza', title: 'Halaman Login' });
});

// Rute untuk penanganan login
app.post('/login', async (req, res) => {
  const { role, username, password } = req.body;
  console.log('Received POST request to /login');
  console.log('Role:', role);
  console.log('Username:', username);
  console.log('Password:', password);

  // Lakukan verifikasi login menggunakan fungsi loginAdmin dan loginKasir
  if (role === 'admin') {
      const isAdmin = await admin.loginAdmin(username, password);
      if (isAdmin) {
          // Setel sesi login sebagai admin jika login berhasil
          req.session.isLoggedIn = true;
          req.session.isAdmin = true;
          req.session.username = username;
          res.redirect('/homeAdmin');
          return;
      }
  } else if (role === 'kasir') {
      const isKasir = await kasir.loginKasir(username, password);
      if (isKasir) {
          // Setel sesi login sebagai kasir jika login berhasil
          req.session.isLoggedIn = true;
          req.session.isAdmin = false;
          req.session.username = username;
          res.redirect('/homeKasir');
          return;
      }
  }
  // Redirect kembali ke halaman login jika login gagal
  res.redirect('/');
});

// Halaman utama untuk admin
app.get('/homeAdmin', (req, res) => {
  if (req.session.isLoggedIn && req.session.isAdmin) {
      // Tampilkan halaman homeAdmin hanya jika pengguna sudah login dan adalah admin
      res.render('homeAdmin', { username: req.session.username, title: 'Halaman Admin' });
  } else {
      // Redirect ke halaman login jika belum login atau bukan admin
      res.redirect('/');
  }
});

// Halaman utama untuk kasir
app.get('/homeKasir', (req, res) => {
  if (req.session.isLoggedIn && !req.session.isAdmin) {
      // Tampilkan halaman homeKasir hanya jika pengguna sudah login dan bukan admin
      res.render('homeKasir', { username: req.session.username, title: 'Halaman Kasir' });
  } else {
      // Redirect ke halaman login jika belum login atau admin
      res.redirect('/');
  }
});

// Rute untuk menampilkan semua data buku
app.get('/dataBuku', async (req, res) => {
    const books = await admin.loadBook();
    console.log(books)
    res.render('dataBuku', { 
      title:`Book page`,
      cont : books,  updateSuccess: false
    });
  });

// Route untuk menambah data buku
app.post('/dataBuku/add', async (req, res) => {
  const { kodeBuku, judul, noISBN, penulis, penerbit, tahun, stok, hargaPokok, hargaJual } = req.body;

  // Lakukan tindakan penyimpanan data ke dalam database
  try {
      await admin.tambahDataBuku(kodeBuku, judul, noISBN, penulis, penerbit, tahun, hargaPokok, hargaJual);
      res.redirect('/dataBuku');
  } catch (error) {
      console.error('Gagal menambahkan data buku:', error);
      res.status(500).send('Terjadi kesalahan saat menambahkan data buku.');
  }
});

//Rute untuk ke halaman tambah stok
app.get('/dataBuku/tambahStok/:kodeBuku', async (req, res) => {
  const { kodeBuku } = req.params;
  console.log('Kode buku yang diterima:', kodeBuku);
  const buku = await admin.getBookByCode(kodeBuku);
  res.render('tambahStok',  { title: 'Tambah stok page', kodeBuku, buku }); 
});

// rute untuk menambah stok buku
app.post('/dataBuku/tambahStok/:kodeBuku', async (req, res) => {
  const { kodeBuku } = req.params; 
  const { jumlahMasuk } = req.body;

  await admin.tambahStokBuku(kodeBuku, jumlahMasuk)
  res.redirect('/dataBuku'); 
});


// Rute untuk menghapus buku berdasarkan kode buku
app.post('/dataBuku/delete/:kodeBuku', async (req, res) => {
  const kodeBuku = req.params.kodeBuku; 
  await admin.deleteDataBuku(kodeBuku); // Menggunakan deleteDataBuku dengan kodeBuku sebagai argumen
  console.log(`Menghapus buku dengan kode: ${kodeBuku}`);
  res.redirect('/dataBuku');
});

// Rute untuk mencari data buku berdasarkan kata kunci
app.post('/dataBuku/cari', async (req, res) => {
  const { kataKunci } = req.body;

  try {
      const bukuDicari = await admin.cariDataBuku(kataKunci); // Menggunakan fungsi cariDataBuku
      res.render('hasilPencarian', { hasilPencarian: bukuDicari, title: 'Search Book Page' }); // Menampilkan hasil pencarian di halaman hasilPencarian.ejs
  } catch (error) {
      console.error('Error saat mencari data buku:', error);
      res.status(500).send('Terjadi kesalahan saat mencari data buku.');
  }
});

app.get('/dataBuku/update/:kodeBuku', async (req, res) => {
  const kodeBuku = req.params.kodeBuku;
  const buku = await admin.getBookByCode(kodeBuku);

  if (!buku) {
    res.status(404).send('Buku tidak ditemukan');
    return;
  }

  res.render('hasilPencarian', { buku, title: 'Halaman Update Buku' });
});

// Rute untuk mengupdate data buku berdasarkan kode buku
app.post('/update-buku/:kodeBuku', async (req, res) => {
  const buku = req.params.kodeBuku;
  const { kodeBuku, judul, noISBN, penulis, penerbit, tahun, stok, hargaPokok, hargaJual } = req.body;
  const updatedBuku = { kodeBuku, judul, noISBN, penulis, penerbit, tahun, stok, hargaPokok, hargaJual}; 

  const success = await admin.updateDataBuku(buku, updatedBuku);
  if (success) {
    res.redirect('/dataBuku');
  } else {
    res.status(404).send('Book not found or update failed.');
  }
});



// Rute untuk menampilkan info buku berdasarkan kode
app.get('/buku/:kodeBuku', async (req, res) => {
  const { kodeBuku } = req.params.kode_buku;
  try {
    const buku = await admin.getBookByCode(kodeBuku);

    if (!buku) {
      res.status(404).send('Buku tidak tersedia');
      return;
    }
   res.render('transaksi', { contact: contact, title:`transaksi page` });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Rute untuk menampilkan semua data User
app.get('/dataUser', async (req, res) => {
  const users = await admin.loadUser();
  console.log(users)
  res.render('dataUser', { title:`data user page`, users : users});
});


// Rute untuk halaman tambah user
app.get('/dataUser/add', async (req, res) => {
  res.render('dataUser', { title: 'Data User' });
});
app.post('/dataUser/add', async (req, res) => {
  const { name, username, password } = req.body;
  await admin.saveUser( name, username, password);
  res.redirect('/dataUser');
});

// Rute untuk menghapus kontak berdasarkan nama
app.post('/dataUser/delete/:username', async (req, res) => {
  const username = req.params.username;
  await admin.deleteUser(username);
  console.log(`Menghapus kontak dengan username: ${username}`);
  res.redirect('/dataUser'); // Mengarahkan kembali ke halaman /dataUser
});

// Rute untuk menampilkan form reset password
app.get('/dataUser/reset-password/:username', async (req, res) => {
  const username = req.params.username;
  const user = await admin.findUserByUsername(username);
  if (!user) {
    res.status(404).send('Pengguna tidak ditemukan.');
    return;
  }
  res.render('resetPassword', { title: 'Reset password page', user });
});

// Rute untuk mengirimkan permintaan pengaturan ulang password
app.post('/dataUser/reset-pswd/:username', async (req, res) => {
  const username = req.params.username;
  const newPassword = req.body.newPassword;

  const success = await admin.resetPassword(username, newPassword);
  if (success) {
    res.redirect('/dataUser'); // Redirect ke halaman sukses reset password
  } else {
    res.status(500).send('Gagal mengatur ulang password pengguna.');
  }
});

// Rute untuk halaman update berdasarkan username  
app.get('/dataUser/update/:username', async (req, res) => {
  const username = req.params.username;
  console.log('Mengakses halaman updateUser.ejs dengan username:', username);

  const user = await admin.findUserByUsername(username);
  if (!user) {
    console.log('Pengguna tidak ditemukan.');
    res.status(404).send('User not found');
    return;
  }

  console.log('Data pengguna yang ditemukan:', user);
  res.render('updateUser', { user: user, title: 'Update user page' });
});


// Rute untuk melakukan update user
app.post('/update-user/:username', async (req, res) => {
  const username = req.params.username;
  const updatedUser = req.body;

  // Tambahkan pernyataan console.log() untuk melacak aliran eksekusi
  console.log('Mengirim permintaan pembaruan pengguna...');
  console.log('Username yang diperbarui:', username);
  console.log('Data yang diperbarui:', updatedUser);

  const result = await admin.updateUser(username, updatedUser);
  // Tambahkan pernyataan console.log() untuk melacak hasil dari pembaruan
  console.log('Hasil pembaruan:', result);

  if (result) {
    res.redirect('/dataUser'); // Redirect ke halaman sukses update user
  } else {
    res.status(404).send('Update failed.');
  }
});
  

// Rute untuk mengambil informasi buku berdasarkan kode buku
app.get('/getBookInfo/:kodeBuku', async (req, res) => {
  const kodeBuku = req.params.kodeBuku;

  try {
    const bookInfo = await admin.getBookInfo(kodeBuku);
    res.json(bookInfo);
  } catch (error) {
    console.error('Terjadi kesalahan dalam mengambil informasi buku:', error);
    res.status(500).json({ error: 'Terjadi kesalahan dalam mengambil informasi buku' });
  }
});

// Rute untuk menampilkan halaman tamabah transaksi
app.get('/transaksi', async (req, res) => {
  try {
    // Generate kode transaksi baru
    const kodeTransaksi = await admin.generateKodeTransaksi();
    console.log('Kode Transaksi:', kodeTransaksi);

    const total = admin.hitungTotal();
    // Tampilkan halaman penjualan dengan data kode transaksi dan keranjang
    res.render('transaksi', { kodeTransaksi, keranjang: admin.keranjang, total, title: 'Transaksi Page' });
  } catch (error) {
    console.error('Error saat menampilkan halaman penjualan:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menampilkan halaman penjualan' });
  }
});

// Route untuk menambahkan transaksi ke keranjang
app.post('/transaksi/add', async (req, res) => {
  const { kodeTransaksi, kodeBuku, jmlBeli } = req.body;

  if (!kodeBuku) {
    return res.status(400).json({ error: "Kode buku tidak valid." });
  }

  try {
    await admin.tambahTransaksi(kodeTransaksi, kodeBuku, jmlBeli);
    res.redirect('/transaksi');
  } catch (error) {
    console.error('Terjadi kesalahan saat menambah transaksi:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menambah transaksi' });
  }
});

app.post('/transaksi/bayar', async (req, res) => {
  const { totalPembelian, jumlahPembayaran, kodeTransaksi, kodeBuku, judul, jumlahBeli, hrgPokok, hrgJual } = req.body;

  try {
    // Panggil fungsi prosesPembayaran
    const kembalian = await admin.prosesPembayaran( kodeTransaksi, jumlahPembayaran);
    
    res.redirect('/transaksi');
  } catch (error) {
    console.error('Terjadi kesalahan dalam proses pembayaran:', error);
    res.status(500).json({ error: 'Terjadi kesalahan dalam proses pembayaran' });
  }
});



app.post('/transaksi/simpan', async (req, res) => {
  try {
    // Generate kode transaksi baru
    const kodeTransaksi = await admin.generateKodeTransaksi();
    console.log('Kode Transaksi:', kodeTransaksi);

    // Simpan data transaksi utama ke dalam tabel transaksi
    await admin.simpanTransaksiUtama(kodeTransaksi, admin.hitungTotal(), admin.totalBayar, admin.kembalian);

    // Loop melalui keranjang dan simpan detail transaksi untuk setiap item dalam keranjang
    for (const item of admin.keranjang) {
      const { kodeBuku, judul, jumlahBeli, hrgPokok, hrgJual } = item;
      await admin.simpanDetailTransaksi(kodeTransaksi, kodeBuku, judul, jumlahBeli, hrgPokok, hrgJual);

      // Update stok buku
      await admin.updateStokBuku(kodeBuku, jumlahBeli);
    }

    // Hapus keranjang setelah transaksi selesai
    admin.keranjang.length = 0;

    // Render halaman transaksi dan kirimkan pesan sukses
    const kodeTransaksiBaru = await admin.generateKodeTransaksi();
    res.render('transaksi', { kodeTransaksi: kodeTransaksiBaru, keranjang: admin.keranjang, total: admin.hitungTotal(), message: 'Data transaksi berhasil disimpan.', title: 'Transaksi Page' });
  } catch (error) {
    console.error('Terjadi kesalahan dalam menyimpan data transaksi:', error);
    res.status(500).json({ error: 'Terjadi kesalahan dalam menyimpan data transaksi' });
  }
});




// app.post('/transaksi/simpan', async (req, res) => {
//   const { dataTransaksi } = req.body;
//   const {kodeBuku, jumlahBeli} = req.body;
//   try {
//     // Panggil fungsi simpanTransaksi
//     await admin.simpanDataTransaksi(dataTransaksi);
//     await admin.updateStokBuku(kodeBuku, jumlahBeli);
//     // Render halaman transaksi dan kirimkan pesan sukses jika diperlukan
//     res.render('transaksi', { message: 'Data transaksi berhasil disimpan.' });
//   } catch (error) {
//     console.error('Terjadi kesalahan dalam menyimpan data transaksi:', error);
//     res.status(500).json({ error: 'Terjadi kesalahan dalam menyimpan data transaksi' });
//   }
// });


app.use('/', (req, res)=>{
  res.status(404)
  res.send('page not found :404')
});
app.listen(port, () =>{
  console.log(`Example app listening on port ${port}`)
});



// hashPasswords();
// Menggunakan app.use untuk penanganan 404


