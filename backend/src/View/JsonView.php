<?php

/**
 * View del backend: unica classe che scrive la risposta HTTP, sempre in JSON.
 */
final class JsonView
{
    /** Invia i dati con il codice di stato indicato e termina la richiesta. */
    public static function send(mixed $dati, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        if ($status !== 204) {
            echo json_encode($dati, JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    /** Risposta di errore in formato uniforme: {"errore": "..."}. */
    public static function error(string $messaggio, int $status): never
    {
        self::send(['errore' => $messaggio], $status);
    }
}
