require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TIDAL-PL25-QOKI360-${result}`;
}

function formatDate(date) {
  const pad = n => (n < 10 ? '0' + n : n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

app.post('/api/zgloszenie', async (req, res) => {
  const {
    imie, nazwisko, email, login_tidal,
    koncerty, odpowiedz_1, odpowiedz_2, odpowiedz_3
  } = req.body;

  const identyfikator = generateId();
  const data_zgloszenia = formatDate(new Date());

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM zgloszenia WHERE email = ? OR login_tidal = ?',
      [email, login_tidal]
    );

    if (rows.length > 0) {
      return res.status(400).send('Zgłoszenie już istnieje.');
    }

    await db.promise().query(
      'INSERT INTO zgloszenia (imie, nazwisko, email, login_tidal, koncerty, odpowiedz_1, odpowiedz_2, odpowiedz_3, identyfikator, data_zgloszenia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [imie, nazwisko, email, login_tidal, koncerty, odpowiedz_1, odpowiedz_2, odpowiedz_3, identyfikator, data_zgloszenia]
    );

    let html = fs.readFileSync('./mail1_template.html', 'utf8')
      .replace('{{IMIE}}', imie)
      .replace('{{NAZWISKO}}', nazwisko)
      .replace('{{EMAIL}}', email)
      .replace('{{TIDAL}}', login_tidal)
      .replace('{{KONCERTY}}', koncerty)
      .replace('{{ODPOWIEDZ1}}', odpowiedz_1)
      .replace('{{ODPOWIEDZ2}}', odpowiedz_2)
      .replace('{{ODPOWIEDZ3}}', odpowiedz_3)
      .replace('{{IDENTYFIKATOR}}', identyfikator)
      .replace('{{DATA_ZGLOSZENIA}}', data_zgloszenia);

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"TIDAL x 47" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'TIDAL x 47 – Potwierdzenie zgłoszenia ✅',
      html: html
    });

    res.send('Zgłoszenie przyjęte');
  } catch (err) {
    console.error('Błąd backendu:', err);
    res.status(500).send('Błąd serwera');
  }
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
