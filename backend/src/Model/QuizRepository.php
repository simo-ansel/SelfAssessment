<?php

/**
 * Accesso ai dati di quiz, domande e opzioni, piu' le statistiche di un quiz.
 * Le opzioni non hanno un repository proprio: esistono solo dentro una domanda.
 */
final class QuizRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::pdo();
    }

    /** Elenco dei quiz, eventualmente filtrato per docente, con il numero di domande. */
    public function all(?int $docenteId = null): array
    {
        $sql = 'SELECT q.id, q.titolo, q.descrizione, q.docente_id, u.nome AS docente,
                       (SELECT COUNT(*) FROM questions d WHERE d.quiz_id = q.id) AS numero_domande
                FROM quizzes q JOIN users u ON u.id = q.docente_id';
        $parametri = [];
        if ($docenteId !== null) {
            $sql .= ' WHERE q.docente_id = ?';
            $parametri[] = $docenteId;
        }
        $st = $this->db->prepare($sql . ' ORDER BY q.id');
        $st->execute($parametri);
        return $st->fetchAll();
    }

    /**
     * Quiz completo di domande e opzioni.
     * Con $perStudente = true non viene inviato quale opzione e' corretta.
     */
    public function find(int $id, bool $perStudente = false): ?array
    {
        $st = $this->db->prepare('SELECT * FROM quizzes WHERE id = ?');
        $st->execute([$id]);
        $quiz = $st->fetch();
        if (!$quiz) {
            return null;
        }
        $quiz['domande'] = $this->domande($id, $perStudente);
        return $quiz;
    }

    public function create(string $titolo, string $descrizione, int $docenteId): int
    {
        $this->db->prepare('INSERT INTO quizzes (titolo, descrizione, docente_id) VALUES (?, ?, ?)')
            ->execute([$titolo, $descrizione, $docenteId]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $titolo, string $descrizione): void
    {
        $this->db->prepare('UPDATE quizzes SET titolo = ?, descrizione = ? WHERE id = ?')
            ->execute([$titolo, $descrizione, $id]);
    }

    /** Domande, opzioni e tentativi del quiz vengono eliminati in cascata. */
    public function delete(int $id): void
    {
        $this->db->prepare('DELETE FROM quizzes WHERE id = ?')->execute([$id]);
    }

    // ---------------- domande ----------------

    public function findQuestion(int $id): ?array
    {
        $st = $this->db->prepare('SELECT * FROM questions WHERE id = ?');
        $st->execute([$id]);
        return $st->fetch() ?: null;
    }

    public function addQuestion(int $quizId, array $dati): void
    {
        $this->db->prepare('INSERT INTO questions (quiz_id, testo, tipo, risposta_attesa) VALUES (?, ?, ?, ?)')
            ->execute([$quizId, trim($dati['testo']), $dati['tipo'], $this->rispostaAttesa($dati)]);
        $this->salvaOpzioni((int) $this->db->lastInsertId(), $dati);
    }

    public function updateQuestion(int $id, array $dati): void
    {
        $this->db->prepare('UPDATE questions SET testo = ?, tipo = ?, risposta_attesa = ? WHERE id = ?')
            ->execute([trim($dati['testo']), $dati['tipo'], $this->rispostaAttesa($dati), $id]);
        $this->salvaOpzioni($id, $dati);
    }

    public function deleteQuestion(int $id): void
    {
        $this->db->prepare('DELETE FROM questions WHERE id = ?')->execute([$id]);
    }

    // ---------------- statistiche ----------------

    /** Numero di tentativi, punteggio medio e risposte corrette per domanda. */
    public function statistics(int $quizId): array
    {
        $st = $this->db->prepare('SELECT COUNT(*) AS tentativi, AVG(punteggio) AS media
                                  FROM attempts WHERE quiz_id = ?');
        $st->execute([$quizId]);
        $totali = $st->fetch();

        $st = $this->db->prepare('SELECT d.id, d.testo, COUNT(a.id) AS risposte,
                                         COALESCE(SUM(a.corretta), 0) AS corrette
                                  FROM questions d
                                  LEFT JOIN answers a ON a.question_id = d.id
                                  WHERE d.quiz_id = ?
                                  GROUP BY d.id, d.testo
                                  ORDER BY d.id');
        $st->execute([$quizId]);

        return [
            'tentativi'       => (int) $totali['tentativi'],
            'punteggio_medio' => $totali['media'] === null ? null : round((float) $totali['media'], 2),
            'per_domanda'     => $st->fetchAll(),
        ];
    }

    // ---------------- supporto ----------------

    private function domande(int $quizId, bool $perStudente): array
    {
        $st = $this->db->prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY id');
        $st->execute([$quizId]);
        $domande = $st->fetchAll();

        // Per lo studente la colonna "corretta" non viene nemmeno letta.
        $colonne = $perStudente ? 'id, testo' : 'id, testo, corretta';
        $stOpzioni = $this->db->prepare("SELECT $colonne FROM options WHERE question_id = ? ORDER BY id");

        foreach ($domande as $i => $domanda) {
            $stOpzioni->execute([$domanda['id']]);
            $domande[$i]['opzioni'] = $stOpzioni->fetchAll();
        }
        return $domande;
    }

    private function rispostaAttesa(array $dati): ?string
    {
        return $dati['tipo'] === 'risposta_aperta' ? trim((string) $dati['risposta_attesa']) : null;
    }

    /** Riscrive le opzioni della domanda: piu' semplice che calcolare le differenze. */
    private function salvaOpzioni(int $questionId, array $dati): void
    {
        $this->db->prepare('DELETE FROM options WHERE question_id = ?')->execute([$questionId]);
        if ($dati['tipo'] !== 'scelta_multipla') {
            return;
        }
        $st = $this->db->prepare('INSERT INTO options (question_id, testo, corretta) VALUES (?, ?, ?)');
        foreach ($dati['opzioni'] as $opzione) {
            $st->execute([$questionId, trim((string) $opzione['testo']), empty($opzione['corretta']) ? 0 : 1]);
        }
    }
}
