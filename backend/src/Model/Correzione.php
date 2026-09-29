<?php

/**
 * Strategy: regola con cui si decide se una risposta e' corretta.
 * Ogni tipo di domanda ha la propria implementazione.
 */
interface Correzione
{
    /** @param array $risposta risposta inviata dal client per una domanda */
    public function valuta(array $risposta): bool;
}
