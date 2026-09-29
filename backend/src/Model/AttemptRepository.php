<?php

/**
 * Tentativi di svolgimento e relative risposte.
 * Il calcolo del punteggio delega la correzione alle strategie (Correzione).
 */
final class AttemptRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::pdo();
    }

    /**
     * Corregge e salva un tentativo; restituisce il suo id.
     * Si scorrono le domande del database, non quelle ricevute: una domanda
     * non inviata conta come sbagliata. Ogni domanda vale un punto.
     *
     * @param array $risposte elenco di {question_id, option_id?, testo_libero?, corretta?}
     */
    public function create(int $quizId, int $studenteId, array $risposte): int
    {
        $st = $this->db->prepare('SELECT id, tipo FROM questions WHERE quiz_id = ?');
        $st->execute([$quizId]);
        $domande = array_column($st->fetchAll(), 'tipo', 'id');   // [id => tipo]
        if (!$domande) {
            throw new InvalidArgumentException('Il quiz non esiste o non ha domande');
        }

        // Una strategia di correzione per ogni tipo di domanda.
        $correzioni = [
            'scelta_multipla' => new CorrezioneAutomatica($this->opzioniCorrette($quizId)),
            'risposta_aperta' => new Autovalutazione(),
        ];

        $ricevute = array_column($risposte, null, 'question_id');     // [question_id => risposta]

        $this->db->beginTransaction();
        try {
            $this->db->prepare('INSERT INTO attempts (quiz_id, studente_id, data_svolgimento, punteggio, totale)
                                VALUES (?, ?, NOW(), 0, ?)')
                ->execute([$quizId, $studenteId, count($domande)]);
            $attemptId = (int) $this->db->lastInsertId();

            $inserisci = $this->db->prepare('INSERT INTO answers (attempt_id, question_id, option_id, testo_libero, corretta)
                                             VALUES (?, ?, ?, ?, ?)');
            $punteggio = 0;

            foreach ($domande as $questionId => $tipo) {
                $risposta = $ricevute[$questionId] ?? [];
                $corretta = $correzioni[$tipo]->valuta($risposta);
                $punteggio += (int) $corretta;

                $inserisci->execute([
                    $attemptId,
                    $questionId,
                    $tipo === 'scelta_multipla' && isset($risposta['option_id']) ? (int) $risposta['option_id'] : null,
                    $tipo === 'risposta_aperta' ? trim((string) ($risposta['testo_libero'] ?? '')) : null,
                    (int) $corretta,
                ]);
            }

            $this->db->prepare('UPDATE attempts SET punteggio = ? WHERE id = ?')->execute([$punteggio, $attemptId]);
            $this->db->commit();
            return $attemptId;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /** Tentativo con il dettaglio di ogni risposta. */
    public function find(int $id): ?array
    {
        $st = $this->db->prepare('SELECT t.*, q.titolo AS quiz_titolo
                                  FROM attempts t JOIN quizzes q ON q.id = t.quiz_id
                                  WHERE t.id = ?');
        $st->execute([$id]);
        $tentativo = $st->fetch();
        if (!$tentativo) {
            return null;
        }

        $st = $this->db->prepare('SELECT a.corretta, a.testo_libero, d.testo AS domanda, d.tipo,
                                         d.risposta_attesa, o.testo AS opzione_scelta
                                  FROM answers a
                                  JOIN questions d ON d.id = a.question_id
                                  LEFT JOIN options o ON o.id = a.option_id
                                  WHERE a.attempt_id = ?
                                  ORDER BY a.id');
        $st->execute([$id]);
        $tentativo['risposte'] = $st->fetchAll();
        return $tentativo;
    }

    /** Storico di uno studente, dal tentativo piu' recente. */
    public function byStudente(int $studenteId): array
    {
        $st = $this->db->prepare('SELECT t.id, t.data_svolgimento, t.punteggio, t.totale, q.titolo AS quiz_titolo
                                  FROM attempts t JOIN quizzes q ON q.id = t.quiz_id
                                  WHERE t.studente_id = ?
                                  ORDER BY t.data_svolgimento DESC, t.id DESC');
        $st->execute([$studenteId]);
        return $st->fetchAll();
    }

    /** @return int[] */
    private function opzioniCorrette(int $quizId): array
    {
        $st = $this->db->prepare('SELECT o.id FROM options o
                                  JOIN questions d ON d.id = o.question_id
                                  WHERE d.quiz_id = ? AND o.corretta = 1');
        $st->execute([$quizId]);
        return array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
    }
}
