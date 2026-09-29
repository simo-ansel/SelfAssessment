<?php

/**
 * Accesso ai dati della tabella users.
 */
final class UserRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::pdo();
    }

    public function all(): array
    {
        return $this->db->query('SELECT id, nome, ruolo FROM users ORDER BY nome')->fetchAll();
    }

    public function find(int $id): ?array
    {
        $st = $this->db->prepare('SELECT id, nome, ruolo FROM users WHERE id = ?');
        $st->execute([$id]);
        return $st->fetch() ?: null;
    }

    public function create(string $nome, string $ruolo): int
    {
        $this->db->prepare('INSERT INTO users (nome, ruolo) VALUES (?, ?)')->execute([$nome, $ruolo]);
        return (int) $this->db->lastInsertId();
    }

    /** Quiz e tentativi dell'utente vengono eliminati in cascata dal database. */
    public function delete(int $id): void
    {
        $this->db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    }
}
