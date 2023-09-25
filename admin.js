const validator = require('validator');
const readline = require("readline");
const fs = require('fs');
const conn = require('./configdb');



// Fungsi untuk meng-hash password pengguna dan menyimpannya ke database
// async function hashPasswords() {
//   const query = 'SELECT id, password FROM admin WHERE password IS NOT NULL'; // Sesuaikan dengan query Anda
//   try {
//     const usersToUpdate = await runQuery(query);

//     for (const user of usersToUpdate) {
//       // Memeriksa apakah password sudah di-hash
//       if (!bcrypt.getRounds(user.password)) {
//         const salt = bcrypt.genSaltSync(saltRounds); // Generate salt baru untuk setiap pengguna
//         const hashedPassword = await bcrypt.hash(user.password, salt);

//         const updateQuery = 'UPDATE admin SET password = ? WHERE id = ?'; // Sesuaikan dengan query Anda
//         await runQuery(updateQuery, [hashedPassword, user.id]);

//         console.log(`Password hashed for user with ID ${user.id} (automatically)`);
//       } else {
//         console.log(`Password for user with ID ${user.id} is already hashed`);
//       }
//     }

//     console.log('Password hashing complete.');
//   } catch (error) {
//     console.error('Error hashing passwords:', error);
//   }
// }

// Fungsi untuk menjalankan query ke database
async function runQuery(query, values = []) {
  return new Promise((resolve, reject) => {
    conn.query(query, values, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// Fungsi untuk memeriksa login
async function loginAdmin(username, inputPassword) {
  const query = 'SELECT password FROM admin WHERE username = ?';
  try {
    const [admin] = await runQuery(query, [username]);

    if (!admin) {
      console.log('User not found');
      return false;
    }

    // Membandingkan password input pengguna dengan password di database secara langsung
    const isPasswordValid = inputPassword === admin.password;

    console.log('Is Password Valid?', isPasswordValid);

    if (isPasswordValid) {
      console.log('Login berhasil');
      return true;
    } else {
      console.log('Password salah');
      return false;
    }
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

async function loadBook(){
  try{
      const query = 'SELECT kode_buku, judul, no_isbn, penulis, penerbit, tahun, stok, hrg_pokok, hrg_jual FROM buku';

      const result = await runQuery(query);
      return result;
  } catch (error) {
      console.error(error.message);
      throw error;
  }
}

async function loadTransaksi(){
  try {
    const query = 'SELECT kode_transaksi, tgl_transaksi, jumlah_beli FROM transaksi';

    const result = await runQuery(query);
    return result;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

async function cariDataBuku(kataKunci) {
  const query = 'SELECT kode_buku, judul, no_isbn, penulis, penerbit, tahun, stok, hrg_pokok, hrg_jual FROM buku WHERE kode_buku LIKE ? OR judul LIKE ?';
  const values = [`%${kataKunci}%`, `%${kataKunci}%`];

  const hasilPencarian = await runQuery(query, values);
  return hasilPencarian;
}

async function tambahDataBuku(kodeBuku, judul, noISBN, penulis, penerbit, tahun, hargaPokok, hargaJual) {
  try {
    const query = `INSERT INTO buku (kode_buku, judul, no_isbn, penulis, penerbit, tahun, stok, hrg_pokok, hrg_jual)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [kodeBuku, judul, noISBN, penulis, penerbit, tahun, 0, hargaPokok, hargaJual];

    await runQuery(query, values);

    console.log('hargaPokok:', hargaPokok);
    console.log(`Buku dengan kode ${kodeBuku} berhasil ditambahkan.`);
  } catch (error) {
    console.error('Error saat menambahkan data buku:', error);
    throw error;
    }
}

async function tambahStokBuku(kodeBuku, jumlahMasuk) {
  try {
    const query = 'UPDATE buku SET stok = stok + ? WHERE kode_buku = ?';
    const values = [jumlahMasuk, kodeBuku];

    await runQuery(query, values);

    console.log(`Stok buku dengan kode ${kodeBuku} telah ditambahkan sebanyak ${jumlahMasuk}.`);
  } catch (error) {
    console.error('Error saat menambah stok buku:', error);
    throw error;
  }
}



async function getBookByCode(kodeBuku) {
  try {
    const query = 'SELECT * FROM buku WHERE kode_buku = ?';
  
    const result = await runQuery(query, [kodeBuku]);

    if (result.length > 0) {
      return result[0];
    } else {
      throw new Error(`Book with code ${kodeBuku} not found`);
    }
  } catch (error) {
    console.error(`Error fetching book by code ${kodeBuku}:`, error);
    throw error;
  }
}


async function deleteDataBuku(kodeBuku) {
  try {
      // Periksa apakah data buku dengan kodeBuku yang ingin dihapus ada
      const query = 'DELETE FROM buku WHERE kode_buku = ?';
      const values = [kodeBuku];
      await runQuery(query, values);
      console.log(`Kontak dengan kode buku ${kodeBuku} berhasil dihapus.`);
  } catch (err) {
      console.error('Error saat menghapus data buku:', err);
      throw error;
  }
}


async function updateDataBuku(kodeBuku, updatedData) {
  try {
    const query = 'UPDATE buku SET kode_buku = ?, judul = ?, no_isbn = ?, penulis = ?, penerbit = ?, tahun = ?, stok = ?, hrg_pokok = ?, hrg_jual = ? WHERE kode_buku = ?';

    const values = [updatedData.kodeBuku, updatedData.judul, updatedData.noISBN, updatedData.penulis, updatedData.penerbit, updatedData.tahun, updatedData.stok, updatedData.hargaPokok, updatedData.hargaJual, kodeBuku];
    
    const result = await runQuery(query, values);

    // Pastikan hasil update berhasil (gunakan affectedRows jika Anda menggunakan MySQL)
    if (result.affectedRows > 0) {
        console.log('Data buku berhasil diperbarui.');
        return true;
    } else {
        console.log('Data buku gagal diperbarui.');
        return false;
    }
  } catch (err) {
    console.error('Error:', err);
      return false; // Terjadi kesalahan
  }
}


async function loadUser(){
  try{
      const query = 'SELECT name, username, password FROM users';
      const result = await runQuery(query);
      return result;
  } catch (error) {
      console.error(error.message);
      throw error;
  }
}

async function findUserByUsername(username) {
  const query = 'SELECT name, username, password FROM users WHERE username = ?';
  const values = [username];
  const result = await runQuery(query, values);
  return result[0];
}


async function isUserAlreadyExists(newContact) {
  const query = 'SELECT * FROM users WHERE name = ? OR username = ? OR password = ?';
  const values = [newContact.name, newContact.username, newContact.password];
  const result = await runQuery(query, values);
  return result.length > 0;
}

async function saveUser(name, username, password) {
  try {
    // Periksa apakah pengguna dengan username yang sama sudah ada dalam database
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      console.log('User sudah ada dalam daftar.');
      return;
    }

    const query = 'INSERT INTO users (name, username, password) VALUES (?, ?, ?)';
    const values = [name, username, password];

    // Jalankan query SQL untuk menyimpan data ke dalam database
    await runQuery(query, values);

    console.log('User berhasil ditambahkan.');
  } catch (error) {
    console.error('Error saat menambahkan data user:', error);
    throw error;
  }
}

async function resetPassword(username, newPassword) {
  try {
    // Periksa apakah pengguna dengan username yang diberikan ada dalam database
    const user = await findUserByUsername(username);

    if (!user) {
      console.log('Pengguna tidak ditemukan.');
      return false;
    }

    const query = 'UPDATE users SET password = ? WHERE username = ?';
    const values = [newPassword, username];

    const result = await runQuery(query, values);

    if (result.affectedRows > 0) {
      console.log('Password pengguna berhasil diperbarui.');
      return true;
    } else {
      console.log('Password pengguna gagal diperbarui.');
      return false;
    }
  } catch (error) {
    console.error('Error saat memperbarui password pengguna:', error);
    throw error;
  }
}


async function updateUser(username, updatedUser) {
  try {
    // Periksa apakah kontak dengan username yang sama sudah ada dalam database
    const existingUser = await findUserByUsername(username);
    if (!existingUser) {
      console.log('User tidak ditemukan.');
      return false;
    }

    // Validasi password jika diperlukan

    const query = 'UPDATE users SET name = ?, username = ?, password = ? WHERE username = ?';
    const values = [updatedUser.name, updatedUser.username, updatedUser.password, username];
    const result = await runQuery(query, values);

    if (result.affectedRows > 0) {
      console.log('User berhasil diperbarui.');
      return true;
    } else {
      console.log('User gagal diperbarui.');
      return false;
    }
  } catch (err) {
    console.error('Error saat memperbarui data pengguna:', err);
    throw err;
  }
}


async function deleteUser(username) {
  try {
    // Periksa apakah kontak dengan username yang ingin dihapus ada
    const existingUser = await findUserByUsername(username);
    if (!existingUser) {
      console.log('User tidak ditemukan.');
      return false;
    }
    const query = 'DELETE FROM users WHERE username = ?';
    const values = [username];
    await runQuery(query, values);
    console.log(`User dengan username ${username} berhasil dihapus.`);
  } catch (err) {
    console.error('Error:', err);
  }
}


// Fungsi untuk menghasilkan kode transaksi baru
async function generateKodeTransaksi() {
  try {
    // Query untuk mendapatkan kode transaksi terakhir
    const lastIDQuery = 'SELECT MAX(kode_transaksi) AS lastID FROM transaksi';
    const lastIDResult = await runQuery(lastIDQuery);

    const lastID = lastIDResult[0].lastID || 0; // Mengambil ID terakhir atau default 0 jika belum ada data
    const nextID = lastID + 1;
    const kodeTransaksi = `PJ-${String(nextID).padStart(4, '0')}`; // Misalnya, PJ-0001

    return kodeTransaksi;
  } catch (error) {
    console.error('Error saat menghasilkan kode penjualan:', error);
    throw error;
  }
}

// Fungsi untuk mengambil informasi buku berdasarkan kode buku
async function getBookInfo(kodeBuku) {
  const query = 'SELECT kode_buku, judul, stok, hrg_pokok, hrg_jual FROM buku WHERE kode_buku = ?';

  try {
    const result = await runQuery(query, [kodeBuku]);

    if (result.length === 0) {
      console.log(`Buku dengan kode ${kodeBuku} tidak ditemukan.`);
      return { error: `Buku dengan kode ${kodeBuku} tidak ditemukan.` };
    } else {
      const bookInfo = result[0];
      console.log('Data buku yang ditemukan:', bookInfo); 
      return bookInfo;
    }
  } catch (error) {
    console.error('Terjadi kesalahan dalam mengambil informasi buku:', error);
    throw { error: 'Terjadi kesalahan dalam mengambil informasi buku' };
  }
}

// Deklarasikan keranjang sebagai array kosong
const keranjang = [];
async function tambahTransaksi(kodeTransaksi, kodeBuku, jumlahBeli) {
  try {
    const getBookQuery = 'SELECT kode_buku, judul, stok, hrg_pokok, hrg_jual FROM buku WHERE kode_buku = ?';
    const getBookValues = [kodeBuku];
    const bookResult = await runQuery(getBookQuery, getBookValues);

    if (bookResult.length === 0) {
      console.error(`Buku dengan kode ${kodeBuku} tidak ditemukan.`);
      return null;
    }

    const { stok, hrg_pokok, hrg_jual, judul } = bookResult[0];

    if (jumlahBeli <= 0) {
      console.error('Jumlah beli harus lebih dari 0.');
      return null;
    }

    if (jumlahBeli > stok) {
      console.error('Jumlah beli melebihi stok yang tersedia.');
      return null;
    }
    // Hitung total berdasarkan harga beli
    const subTotal = jumlahBeli * hrg_jual;

    // Tambahkan data transaksi ke dalam keranjang
    keranjang.push({
      kodeTransaksi,
      kodeBuku,
      judul,
      jumlahBeli,
      hargaPokok: hrg_pokok,
      hargaJual: hrg_jual,
      subTotal,
      stok,
      
    });

    console.log('Buku berhasil ditambahkan ke keranjang.');
  } catch (error) {
    console.error('Error saat menambahkan transaksi:', error);
    throw error;
  }
}


function hitungTotal() {
  let total = 0;
  for (const item of keranjang) {
    total += item.subTotal;
  }
  return total;
}

// Fungsi untuk menyimpan data transaksi utama ke dalam tabel 'transaksi'
async function simpanTransaksiUtama(kodeTransaksi, totalPembelian, jumlahPembayaran, kembalian) {
  try {
    const insertQuery = `
      INSERT INTO transaksi 
      (kode_transaksi, tgl_transaksi, total_pembelian, jumlah_pembayaran, kembalian)
      VALUES (?, NOW(), ?, ?, ?)`;

    const values = [kodeTransaksi, totalPembelian, jumlahPembayaran, kembalian];

    await runQuery(insertQuery, values); // Menggun akan fungsi runQuery yang sudah ada
    console.log('Data transaksi utama berhasil disimpan.');
  } catch (error) {
    console.error('Error saat menyimpan data transaksi utama:', error);
  }
}

// Fungsi untuk menyimpan data detail transaksi ke dalam tabel 'transaksi_detail'
async function simpanDetailTransaksi(kodeTransaksi, kodeBuku, judul, jumlahBeli, hrgPokok, hrgJual) {
  try {
    const insertQuery = `
      INSERT INTO transaksi_detail 
      (kode_transaksi, kode_buku, judul, jumlah_beli, hrg_pokok, hrg_jual)
      VALUES (?, ?, ?, ?, ?, ?)`;

    const values = [kodeTransaksi, kodeBuku, judul, jumlahBeli, hrgPokok, hrgJual];

    await runQuery(insertQuery, values); // Menggunakan fungsi runQuery yang sudah ada
    console.log('Data detail transaksi berhasil disimpan.');
  } catch (error) {
    console.error('Error saat menyimpan data detail transaksi:', error);
  }
}

// Fungsi untuk proses pembayaran (menggunakan transaksi utama)
async function prosesPembayaran(kodeTransaksi, jumlahPembayaran) {
  try {
    console.log('Memulai proses pembayaran...');

    // Memanggil fungsi generateKodeTransaksi() untuk mendapatkan kode transaksi yang sama
    const kodeTransaksi = await generateKodeTransaksi();

     // Memanggil fungsi hitungTotal() untuk menghitung total pembelian
     const totalPembelian = hitungTotal();

    // // Mengkonversi input menjadi angka (pastikan menggunakan angka desimal jika diperlukan)
    // console.log('Nilai totalPembelian sebelum parsing:', totalPembelian);
    // console.log('Nilai jumlahPembayaran sebelum parsing:', jumlahPembayaran);
    
    const totalPembelianAmount = parseFloat(totalPembelian);
    const jumlahPembayaranAmount = parseFloat(jumlahPembayaran);
    
    // console.log('Nilai totalPembelianAmount setelah parsing:', totalPembelianAmount);
    // console.log('Nilai jumlahPembayaranAmount setelah parsing:', jumlahPembayaranAmount);
    
    // Validasi input
    if (isNaN(totalPembelianAmount) || isNaN(jumlahPembayaranAmount) || jumlahPembayaranAmount < totalPembelianAmount) {
      throw new Error('Jumlah pembayaran tidak valid');
    }

    // Hitung kembalian
    const kembalian = jumlahPembayaranAmount - totalPembelianAmount;
    
    // Validasi stok sebelum menyimpan transaksi
    const isStokCukup = await validasiStokTransaksi(keranjang);

    if (!isStokCukup) {
      console.error('Stok buku tidak mencukupi.');
      return null;
    }

    // Simpan data transaksi utama
    await simpanTransaksiUtama(kodeTransaksi, totalPembelian, jumlahPembayaran, kembalian);
    // Kurangkan stok hanya setelah transaksi selesai
    await kurangiStokBuku(keranjang);

    // Simpan data detail transaksi jika ada item di keranjang
     for (const item of keranjang) {
      await simpanDetailTransaksi(
        kodeTransaksi,
        item.kodeBuku,
        item.judul,
        item.jumlahBeli,
        item.hargaPokok,
        item.hargaJual
      );
    }
    // Hapus keranjang setelah transaksi selesai
    keranjang.length = 0;

    console.log('Pembayaran berhasil.');
    return kembalian;
  } catch (error) {
    console.error('Error saat melakukan pembayaran:', error);
    throw error;
  }
}
// Fungsi untuk validasi stok sebelum transaksi
async function validasiStokTransaksi(transaksiItems) {
  for (const item of transaksiItems) {
    const { kodeBuku, jumlahBeli, stok } = item;

    if (jumlahBeli > stok) {
      return false; // Jika stok tidak mencukupi, kembalikan false
    }
  }
  return true; // Jika semua validasi stok berhasil, kembalikan true
}
async function kurangiStokBuku(kodeBuku, jumlahBeli) {
  try {
    for (const item of keranjang) {
      const { kodeBuku, jumlahBeli } = item;
    const query = 'UPDATE buku SET stok = stok - ? WHERE kode_buku = ?';
    const values = [jumlahBeli, kodeBuku];
    await runQuery(query, values);
    }
    console.log(`Stok buku dengan kode ${kodeBuku} telah dikurangkan sebanyak ${jumlahBeli}.`);
  } catch (error) {
    console.error('Error saat mengurangkan stok buku:', error);
    throw error;
  }
}





module.exports = { 
  loginAdmin,
  loadBook,
  getBookByCode,
  tambahDataBuku,
  tambahStokBuku,
  kurangiStokBuku,
  deleteDataBuku,
  cariDataBuku,
  updateDataBuku,
  loadUser,
  findUserByUsername,
  isUserAlreadyExists,
  saveUser,
  resetPassword,
  updateUser,
  deleteUser,
  generateKodeTransaksi,
  getBookInfo,
  loadTransaksi,
  tambahTransaksi,
  keranjang,
  hitungTotal,
  prosesPembayaran,
  simpanTransaksiUtama,
  simpanDetailTransaksi };



