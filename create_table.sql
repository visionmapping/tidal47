CREATE TABLE zgloszenia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  imie VARCHAR(100),
  nazwisko VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  login_tidal VARCHAR(100) UNIQUE,
  koncerty INT,
  odpowiedz_1 TEXT,
  odpowiedz_2 TEXT,
  odpowiedz_3 TEXT,
  identyfikator VARCHAR(50) UNIQUE,
  data_zgloszenia TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
