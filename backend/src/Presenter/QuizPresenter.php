<?php

/**
 * Presenter di quiz, domande e statistiche: le operazioni del docente.
 */
final class QuizPresenter
{
    private QuizRepository $quiz;

    public function __construct(private ?array $utente)
    {
        $this->quiz = new QuizRepository();
    }

    /** GET /quizzes[?docente_id=] */
    public function index(): never
    {
        $docenteId = isset($_GET['docente_id']) ? (int) $_GET['docente_id'] : null;
        JsonView::send($this->quiz->all($docenteId));
    }

    /** GET /quizzes/{id}[?perStudente=1] */
    public function show(int $id): never
    {
        JsonView::send($this->trova($id, isset($_GET['perStudente'])));
    }

    /** POST /quizzes */
    public function create(array $body): never
    {
        $this->soloDocente();
        $id = $this->quiz->create($this->titolo($body), trim((string) ($body['descrizione'] ?? '')), (int) $this->utente['id']);
        JsonView::send($this->quiz->find($id), 201);
    }

    /** PUT /quizzes/{id} */
    public function update(int $id, array $body): never
    {
        $this->quizDelDocente($id);
        $this->quiz->update($id, $this->titolo($body), trim((string) ($body['descrizione'] ?? '')));
        JsonView::send($this->quiz->find($id));
    }

    /** DELETE /quizzes/{id} */
    public function delete(int $id): never
    {
        $this->quizDelDocente($id);
        $this->quiz->delete($id);
        JsonView::send(null, 204);
    }

    /** POST /quizzes/{id}/questions */
    public function creaDomanda(int $quizId, array $body): never
    {
        $this->quizDelDocente($quizId);
        $this->validaDomanda($body);
        $this->quiz->addQuestion($quizId, $body);
        JsonView::send($this->quiz->find($quizId), 201);
    }

    /** PUT /questions/{id} */
    public function modificaDomanda(int $id, array $body): never
    {
        $domanda = $this->quiz->findQuestion($id) ?? JsonView::error('Domanda non trovata', 404);
        $this->quizDelDocente((int) $domanda['quiz_id']);
        $this->validaDomanda($body);
        $this->quiz->updateQuestion($id, $body);
        JsonView::send($this->quiz->find((int) $domanda['quiz_id']));
    }

    /** DELETE /questions/{id} */
    public function eliminaDomanda(int $id): never
    {
        $domanda = $this->quiz->findQuestion($id) ?? JsonView::error('Domanda non trovata', 404);
        $this->quizDelDocente((int) $domanda['quiz_id']);
        $this->quiz->deleteQuestion($id);
        JsonView::send(null, 204);
    }

    /** GET /quizzes/{id}/statistics */
    public function statistiche(int $quizId): never
    {
        $this->quizDelDocente($quizId);
        JsonView::send($this->quiz->statistics($quizId));
    }

    // ---------------- supporto ----------------

    private function trova(int $id, bool $perStudente = false): array
    {
        return $this->quiz->find($id, $perStudente) ?? JsonView::error('Quiz non trovato', 404);
    }

    /**
     * Senza login, il ruolo arriva da un header che il client potrebbe alterare:
     * il controllo evita usi scorretti dell'interfaccia, non attacchi deliberati.
     */
    private function soloDocente(): void
    {
        if (($this->utente['ruolo'] ?? null) !== 'docente') {
            JsonView::error('Operazione riservata ai docenti', 403);
        }
    }

    /** Il quiz deve esistere (404) e appartenere al docente che fa la richiesta (403). */
    private function quizDelDocente(int $id): array
    {
        $this->soloDocente();
        $quiz = $this->trova($id);
        if ((int) $quiz['docente_id'] !== (int) $this->utente['id']) {
            JsonView::error('Il quiz appartiene a un altro docente', 403);
        }
        return $quiz;
    }

    private function titolo(array $body): string
    {
        $titolo = trim((string) ($body['titolo'] ?? ''));
        return $titolo !== '' ? $titolo : JsonView::error('Il titolo è obbligatorio', 400);
    }

    private function validaDomanda(array $body): void
    {
        if (trim((string) ($body['testo'] ?? '')) === '') {
            JsonView::error('Il testo della domanda è obbligatorio', 400);
        }

        $tipo = $body['tipo'] ?? '';
        if ($tipo === 'risposta_aperta') {
            if (trim((string) ($body['risposta_attesa'] ?? '')) === '') {
                JsonView::error('Indica la risposta attesa: serve allo studente per autovalutarsi', 400);
            }
            return;
        }
        if ($tipo !== 'scelta_multipla') {
            JsonView::error('Tipo di domanda non valido', 400);
        }

        $opzioni = is_array($body['opzioni'] ?? null) ? $body['opzioni'] : [];
        if (count($opzioni) < 2) {
            JsonView::error('Servono almeno due opzioni', 400);
        }
        foreach ($opzioni as $opzione) {
            if (trim((string) ($opzione['testo'] ?? '')) === '') {
                JsonView::error('Le opzioni non possono essere vuote', 400);
            }
        }
        if (count(array_filter($opzioni, fn($o) => !empty($o['corretta']))) !== 1) {
            JsonView::error('Indica una sola opzione corretta', 400);
        }
    }
}
