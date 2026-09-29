<?php

/**
 * Domande a scelta multipla: corregge il server confrontando l'opzione scelta
 * con quelle marcate come corrette nel database.
 */
final class CorrezioneAutomatica implements Correzione
{
    /** @param int[] $opzioniCorrette id delle opzioni corrette */
    public function __construct(private array $opzioniCorrette)
    {
    }

    public function valuta(array $risposta): bool
    {
        return isset($risposta['option_id'])
            && in_array((int) $risposta['option_id'], $this->opzioniCorrette, true);
    }
}
