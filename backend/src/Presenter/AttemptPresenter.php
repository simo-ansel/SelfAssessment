<?php

/**
 * Presenter dello svolgimento dei quiz.
 */
final class AttemptPresenter
{
    private AttemptRepository $tentativi;

    public function __construct(private ?array $utente)
    {
        $this->tentativi = new AttemptRepository();
    }

    /** POST /quizzes/{id}/attempts — consegna, correzione e salvataggio. */
    public function create(int $quizId, array $body): never
    {
        if (($this->utente['ruolo'] ?? null) !== 'studente') {
            JsonView::error('Solo uno studente può svolgere un quiz', 403);
        }
        $risposte = $body['risposte'] ?? null;
        if (!is_array($risposte) || $risposte === []) {
            JsonView::error('Nessuna risposta inviata', 400);
        }
        $id = $this->tentativi->create($quizId, (int) $this->utente['id'], $risposte);
        JsonView::send($this->tentativi->find($id), 201);
    }

    /** GET /attempts/{id} */
    public function show(int $id): never
    {
        $tentativo = $this->tentativi->find($id) ?? JsonView::error('Tentativo non trovato', 404);
        JsonView::send($tentativo);
    }
}
