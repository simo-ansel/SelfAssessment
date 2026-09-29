<?php

/**
 * Presenter delle rotte /users.
 */
final class UserPresenter
{
    private UserRepository $utenti;
    private AttemptRepository $tentativi;

    public function __construct()
    {
        $this->utenti = new UserRepository();
        $this->tentativi = new AttemptRepository();
    }

    /** GET /users */
    public function index(): never
    {
        JsonView::send($this->utenti->all());
    }

    /** POST /users */
    public function create(array $body): never
    {
        $nome = trim((string) ($body['nome'] ?? ''));
        $ruolo = $body['ruolo'] ?? '';
        if ($nome === '') {
            JsonView::error('Il nome è obbligatorio', 400);
        }
        if (!in_array($ruolo, ['docente', 'studente'], true)) {
            JsonView::error('Ruolo non valido', 400);
        }
        $id = $this->utenti->create($nome, $ruolo);
        JsonView::send($this->utenti->find($id), 201);
    }

    /** DELETE /users/{id} */
    public function delete(int $id): never
    {
        if (!$this->utenti->find($id)) {
            JsonView::error('Utente non trovato', 404);
        }
        $this->utenti->delete($id);
        JsonView::send(null, 204);
    }

    /** GET /users/{id}/attempts */
    public function attempts(int $id): never
    {
        JsonView::send($this->tentativi->byStudente($id));
    }
}
