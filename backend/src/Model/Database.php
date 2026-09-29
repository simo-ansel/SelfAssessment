<?php

/**
 * Connessione PDO condivisa, aperta alla prima richiesta.
 * I parametri arrivano dalle variabili d'ambiente definite in docker-compose.yml.
 */
final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4',
                getenv('DB_HOST') ?: 'db',
                getenv('DB_NAME') ?: 'quizdb');

            self::$pdo = new PDO($dsn, getenv('DB_USER') ?: 'quiz', getenv('DB_PASS') ?: 'quiz', [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            // Date sempre in UTC: il browser le converte nel fuso orario dell'utente.
            self::$pdo->exec("SET time_zone = '+00:00'");
        }
        return self::$pdo;
    }
}
