<?php

/**
 * Domande a risposta aperta: nessuna correzione automatica,
 * vale il giudizio espresso dallo studente nel campo "corretta".
 */
final class Autovalutazione implements Correzione
{
    public function valuta(array $risposta): bool
    {
        return !empty($risposta['corretta']);
    }
}
