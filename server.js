function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TIDAL-PL25-QOKI360-${result}`;
}

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

app.post('/api/zgloszenie', async (req, res) => {
  const {
    imie, nazwisko, email, login_tidal,
    koncerty, odpowiedz_1, odpowiedz_2, odpowiedz_3
  } = req.body;

  const identyfikator = generateId();

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM zgloszenia WHERE email = ? OR login_tidal = ?',
      [email, login_tidal]
    );

    if (rows.length > 0) {
      return res.status(400).send('Zgłoszenie już istnieje.');
    }

    await db.promise().query(
      'INSERT INTO zgloszenia (imie, nazwisko, email, login_tidal, koncerty, odpowiedz_1, odpowiedz_2, odpowiedz_3, identyfikator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [imie, nazwisko, email, login_tidal, koncerty, odpowiedz_1, odpowiedz_2, odpowiedz_3, identyfikator]
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
      .replace('{{IDENTYFIKATOR}}', identyfikator);

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
    console.error(err);
    res.status(500).send('Błąd serwera');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
