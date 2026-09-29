-- Schema del database. Eseguito da MySQL al primo avvio del container:
-- per rieseguirlo, docker compose down -v && docker compose up --build

CREATE TABLE users (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL,
  ruolo ENUM('docente', 'studente') NOT NULL
);

CREATE TABLE quizzes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  titolo      VARCHAR(200) NOT NULL,
  descrizione TEXT,
  docente_id  INT NOT NULL,
  FOREIGN KEY (docente_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE questions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id         INT NOT NULL,
  testo           TEXT NOT NULL,
  tipo            ENUM('scelta_multipla', 'risposta_aperta') NOT NULL,
  risposta_attesa TEXT NULL,                 -- solo per le domande aperte
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE options (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  testo       VARCHAR(255) NOT NULL,
  corretta    BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE attempts (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id          INT NOT NULL,
  studente_id      INT NOT NULL,
  data_svolgimento DATETIME NOT NULL,
  punteggio        INT NOT NULL,             -- salvato, non ricalcolato:
  totale           INT NOT NULL,             -- lo storico resta stabile
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (studente_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE answers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id   INT NOT NULL,
  question_id  INT NOT NULL,
  option_id    INT NULL,                     -- scelta multipla
  testo_libero TEXT NULL,                    -- risposta aperta
  corretta     BOOLEAN NOT NULL,             -- per le aperte: autovalutazione
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE SET NULL
);
