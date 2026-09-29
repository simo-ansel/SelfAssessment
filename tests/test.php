<?php
/**
 * Test automatici: unità (strategie di correzione) e integrazione (API REST).
 * I codici U* e T* corrispondono alle tabelle di docs/06-test.md.
 *
 * Esecuzione, con i container avviati:
 *     docker compose exec web php tests/test.php
 *
 * I test di integrazione usano il database reale: creano dati di prova e li eliminano alla fine.
 */
declare(strict_types=1);

require_once __DIR__ . '/../backend/src/Model/Correzione.php';
require_once __DIR__ . '/../backend/src/Model/CorrezioneAutomatica.php';
require_once __DIR__ . '/../backend/src/Model/Autovalutazione.php';

const API = 'http://localhost/api';
$passati = 0;
$falliti = 0;

/** Registra e stampa l'esito di un caso di test. */
function caso(string $codice, string $descrizione, bool $ok): void
{
    global $passati, $falliti;
    $ok ? $passati++ : $falliti++;
    echo ($ok ? '  OK    ' : '  FAIL  ') . "$codice  $descrizione\n";
}

/** Richiesta HTTP all'API: restituisce [codice di stato, corpo decodificato]. */
function http(string $metodo, string $percorso, ?array $body = null, ?int $utente = null): array
{
    $contesto = stream_context_create(['http' => [
        'method'        => $metodo,
        'header'        => "Content-Type: application/json\r\nX-User-Id: " . ($utente ?? ''),
        'content'       => $body === null ? '' : json_encode($body),
        'ignore_errors' => true,   // legge il corpo anche delle risposte 4xx/5xx
    ]]);
    $corpo = @file_get_contents((getenv('API_URL') ?: API) . $percorso, false, $contesto);
    if ($corpo === false) {
        exit("API non raggiungibile: i container sono avviati?\n");
    }
    $stato = (int) explode(' ', $http_response_header[0])[1];
    return [$stato, json_decode($corpo, true)];
}

// ============================================================================
echo "\nTest di unità — strategie di correzione\n";
// ============================================================================

$automatica = new CorrezioneAutomatica([10, 20]);
caso('U1', 'scelta multipla: opzione corretta', $automatica->valuta(['option_id' => 20]) === true);
caso('U2', 'scelta multipla: opzione sbagliata', $automatica->valuta(['option_id' => 11]) === false);
caso('U3', 'scelta multipla: nessuna opzione scelta', $automatica->valuta([]) === false);

$auto = new Autovalutazione();
caso('U4', 'aperta: lo studente si dichiara corretto', $auto->valuta(['corretta' => true]) === true);
caso('U5', 'aperta: si dichiara sbagliato o non si esprime',
    $auto->valuta(['corretta' => false]) === false && $auto->valuta([]) === false);

// ============================================================================
echo "\nTest di integrazione — API REST\n";
// ============================================================================

// --- RF1 profili
[$s1, $docente] = http('POST', '/users', ['nome' => 'Test Docente', 'ruolo' => 'docente']);
[$s2, $studente] = http('POST', '/users', ['nome' => 'Test Studente', 'ruolo' => 'studente']);
caso('T01', 'creazione di un docente e di uno studente', $s1 === 201 && $s2 === 201);
$d = (int) $docente['id'];
$s = (int) $studente['id'];

[$s1] = http('POST', '/users', ['nome' => '', 'ruolo' => 'docente']);
[$s2] = http('POST', '/users', ['nome' => 'Tizio', 'ruolo' => 'preside']);
caso('T02', 'nome vuoto o ruolo inesistente rifiutati', $s1 === 400 && $s2 === 400);

// --- RF2 quiz
[$st] = http('POST', '/quizzes', ['titolo' => 'Non autorizzato'], $s);
caso('T03', 'uno studente non può creare quiz', $st === 403);

[$s1] = http('POST', '/quizzes', ['titolo' => '  '], $d);
[$s2, $quiz] = http('POST', '/quizzes', ['titolo' => 'Quiz di prova'], $d);
caso('T04', 'titolo vuoto rifiutato, quiz valido creato', $s1 === 400 && $s2 === 201);
$q = (int) $quiz['id'];

[, $quiz] = http('PUT', "/quizzes/$q", ['titolo' => 'Quiz rinominato'], $d);
caso('T05', 'modifica del titolo', $quiz['titolo'] === 'Quiz rinominato');

[, $altro] = http('POST', '/users', ['nome' => 'Altro Docente', 'ruolo' => 'docente']);
$d2 = (int) $altro['id'];
[$s1] = http('PUT', "/quizzes/$q", ['titolo' => 'Non mio'], $d2);
[$s2] = http('DELETE', "/quizzes/$q", null, $d2);
[$s3] = http('GET', "/quizzes/$q/statistics", null, $d2);
caso('T06', 'un docente non modifica, elimina né analizza il quiz di un altro', $s1 === 403 && $s2 === 403 && $s3 === 403);
http('DELETE', "/users/$d2");

// --- RF3 domande
$sceltaMultipla = fn(array $opzioni) => ['testo' => 'Quanto fa 2+2?', 'tipo' => 'scelta_multipla', 'opzioni' => $opzioni];
[$a] = http('POST', "/quizzes/$q/questions", $sceltaMultipla([['testo' => '4', 'corretta' => true]]), $d);
[$b] = http('POST', "/quizzes/$q/questions", $sceltaMultipla([['testo' => '4'], ['testo' => '5']]), $d);
[$c] = http('POST', "/quizzes/$q/questions", $sceltaMultipla([['testo' => '4', 'corretta' => true], ['testo' => '5', 'corretta' => true]]), $d);
caso('T07', 'scelta multipla non valida: 1 opzione, 0 o 2 corrette', $a === 400 && $b === 400 && $c === 400);

[$st] = http('POST', "/quizzes/$q/questions", ['testo' => 'Spiega', 'tipo' => 'risposta_aperta'], $d);
caso('T08', 'domanda aperta senza risposta attesa rifiutata', $st === 400);

[$a] = http('POST', "/quizzes/$q/questions", $sceltaMultipla([['testo' => '4', 'corretta' => true], ['testo' => '5']]), $d);
[$b, $quiz] = http('POST', "/quizzes/$q/questions",
    ['testo' => 'Cos\'è una chiave primaria?', 'tipo' => 'risposta_aperta', 'risposta_attesa' => 'Identifica una riga'], $d);
caso('T09', 'domande valide dei due tipi create', $a === 201 && $b === 201 && count($quiz['domande']) === 2);

[$chiusa, $aperta] = $quiz['domande'];
$giusta = (int) $chiusa['opzioni'][0]['id'];
$sbagliata = (int) $chiusa['opzioni'][1]['id'];

// --- RF4 / RNF5 le soluzioni non arrivano allo studente
[, $perStudente] = http('GET', "/quizzes/$q?perStudente=1");
caso('T10', 'allo studente non arriva quale opzione è corretta',
    !array_key_exists('corretta', $perStudente['domande'][0]['opzioni'][0]));

// --- RF4 / RF6 svolgimento, correzione e punteggio
$consegna = fn(array $risposte, int $utente) => http('POST', "/quizzes/$q/attempts", ['risposte' => $risposte], $utente);

[$st, $t] = $consegna([
    ['question_id' => $chiusa['id'], 'option_id' => $giusta],
    ['question_id' => $aperta['id'], 'testo_libero' => 'Una riga', 'corretta' => true],
], $s);
caso('T11', 'tutto corretto: punteggio 2 su 2', $st === 201 && $t['punteggio'] === 2 && $t['totale'] === 2);

[, $t] = $consegna([
    ['question_id' => $chiusa['id'], 'option_id' => $sbagliata],
    ['question_id' => $aperta['id'], 'testo_libero' => 'Boh', 'corretta' => false],
], $s);
caso('T12', 'tutto sbagliato: punteggio 0 su 2', $t['punteggio'] === 0);

[, $t] = $consegna([['question_id' => $chiusa['id'], 'option_id' => $giusta]], $s);
caso('T13', 'domanda non inviata conta come sbagliata', $t['punteggio'] === 1 && $t['totale'] === 2);

[$st] = $consegna([['question_id' => $chiusa['id'], 'option_id' => $giusta]], $d);
caso('T14', 'un docente non può svolgere un quiz', $st === 403);

// --- RF7 risultati
[, $storico] = http('GET', "/users/$s/attempts");
[, $dettaglio] = http('GET', '/attempts/' . $storico[0]['id']);
caso('T15', 'storico con 3 tentativi e dettaglio delle risposte',
    count($storico) === 3 && count($dettaglio['risposte']) === 2);

// --- RF8 statistiche   (punteggi 2, 0, 1 -> media 1)
[, $stat] = http('GET', "/quizzes/$q/statistics", null, $d);
caso('T16', 'statistiche: 3 tentativi, media 1', $stat['tentativi'] === 3 && $stat['punteggio_medio'] == 1);

[$st] = http('GET', "/quizzes/$q/statistics", null, $s);
caso('T17', 'uno studente non vede le statistiche', $st === 403);

// --- RF2 / RF1 cancellazioni
[$s1] = http('DELETE', "/quizzes/$q", null, $d);
[$s2] = http('GET', "/quizzes/$q");
caso('T18', 'quiz eliminato e non più raggiungibile', $s1 === 204 && $s2 === 404);

http('DELETE', "/users/$d");
[$st] = http('DELETE', "/users/$s");
[, $storico] = http('GET', "/users/$s/attempts");
caso('T19', 'eliminando lo studente spariscono i suoi tentativi', $st === 204 && $storico === []);

[$s1] = http('GET', '/quizzes/abc');
[$s2] = http('GET', '/inesistente');
caso('T20', 'rotte o id non validi restituiscono 404', $s1 === 404 && $s2 === 404);

echo "\n$passati test passati, $falliti falliti\n";
exit($falliti === 0 ? 0 : 1);
