const validator = require('validator');
const readline = require("readline");
const fs = require('fs');
const conn = require('./configdb');

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
async function loginKasir(username, inputPassword) {
    const query = 'SELECT password FROM users WHERE username = ?';
    try {
      const [kasir] = await runQuery(query, [username]);
  
      if (!kasir) {
        console.log('User not found');
        return false;
      }
  
      // Membandingkan password input pengguna dengan password di database secara langsung
      const isPasswordValid = inputPassword === kasir.password;
  
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


  module.exports = { 
      runQuery,
      loginKasir
    };