# 6. Test

## 6.1 Strategia

| Livello | Oggetto | Modalità |
|---------|---------|----------|
| Unità | Strategie di correzione (`CorrezioneAutomatica`, `Autovalutazione`) | automatica, senza database |
| Integrazione | API REST: Router, Presenter, Repository e database insieme | automatica, con richieste HTTP reali |
| Accettazione | Interfaccia utente | manuale, seguendo i casi d'uso |

Le strategie di correzione sono le uniche classi con logica pura, senza database: si provano in isolamento. Tutto il resto del backend si prova attraverso l'API, perché è così che viene usato dal frontend.

I test automatici sono in un unico script PHP senza librerie esterne. Un framework come PHPUnit avrebbe richiesto Composer e dipendenze aggiuntive; con questa quantità di logica un confronto fra valore atteso e ottenuto è sufficiente.

## 6.2 Esecuzione

Con i container avviati:

```bash
docker compose exec web php tests/test.php
```

Ogni caso stampa `OK` o `FAIL` con il proprio codice; lo script termina con codice di uscita `0` solo se tutti passano. I test di integrazione creano utenti e quiz di prova e li eliminano alla fine.

## 6.3 Test di unità

| Codice | Requisito | Caso | Esito atteso |
|--------|-----------|------|--------------|
| U1 | RF6 | scelta multipla, opzione corretta | corretta |
| U2 | RF6 | scelta multipla, opzione sbagliata | sbagliata |
| U3 | RF6 | scelta multipla, nessuna opzione | sbagliata |
| U4 | RF5 | aperta, lo studente si dichiara corretto | corretta |
| U5 | RF5 | aperta, si dichiara sbagliato o non si esprime | sbagliata |

## 6.4 Test di integrazione

| Codice | Requisito | Caso | Esito atteso |
|--------|-----------|------|--------------|
| T01 | RF1 | creazione di un docente e di uno studente | `201` |
| T02 | RF1 | nome vuoto o ruolo inesistente | `400` |
| T03 | RF2 | uno studente crea un quiz | `403` |
| T04 | RF2 | titolo vuoto; poi titolo valido | `400`; `201` |
| T05 | RF2 | modifica del titolo | titolo aggiornato |
| T06 | RF2, RF8 | un altro docente modifica, elimina o chiede le statistiche del quiz | `403` in tutti i casi |
| T07 | RF3 | scelta multipla con 1 opzione, con 0 corrette, con 2 corrette | `400` in tutti i casi |
| T08 | RF3 | domanda aperta senza risposta attesa | `400` |
| T09 | RF3 | una domanda valida per tipo | `201`, il quiz ha 2 domande |
| T10 | RF4, RNF5 | quiz richiesto con `?perStudente=1` | le opzioni non contengono `corretta` |
| T11 | RF6 | tutte le risposte giuste | punteggio 2 su 2 |
| T12 | RF6 | tutte le risposte sbagliate | punteggio 0 su 2 |
| T13 | RF6 | una domanda non inviata | punteggio 1, totale 2 |
| T14 | RF4 | un docente consegna un quiz | `403` |
| T15 | RF7 | storico e dettaglio dello studente | 3 tentativi, 2 risposte nel dettaglio |
| T16 | RF8 | statistiche del quiz | 3 tentativi, media 1 |
| T17 | RF8 | uno studente chiede le statistiche | `403` |
| T18 | RF2 | eliminazione del quiz, poi lettura | `204`, poi `404` |
| T19 | RF1 | eliminazione dello studente | `204`, storico vuoto |
| T20 | RNF1 | id non numerico o rotta inesistente | `404` in JSON |

T13 verifica una scelta di progetto: il punteggio si calcola sulle domande del database, non su quelle ricevute, quindi omettere una domanda non conviene.

## 6.5 Test di accettazione

Da eseguire nel browser, partendo da un database vuoto.

| Codice | Caso d'uso | Azione | Esito atteso |
|--------|------------|--------|--------------|
| A01 | UC1 | Aprire la home | riquadri "Docenti" e "Studenti" con messaggio di elenco vuoto |
| A02 | UC1 | Creare un profilo senza nome | avviso "Inserisci un nome" |
| A03 | UC1 | Creare un docente e uno studente, entrare come docente | profili nei rispettivi riquadri; apertura dell'area docente |
| A04 | UC2 | Creare un quiz | il quiz compare evidenziato nell'elenco e si apre il dettaglio |
| A05 | UC3 | Salvare una domanda a scelta multipla senza opzione corretta | avviso "Indica una sola opzione corretta" |
| A06 | UC3 | Aggiungere una domanda per tipo | elenco con 2 domande, opzione corretta in verde, risposta attesa visibile |
| A07 | UC3 | *Modifica* su una domanda, poi *Annulla*, poi salvare una nuova domanda | viene creata una terza domanda, la prima resta invariata |
| A08 | UC5 | Entrare come studente e aprire il quiz | avanzamento "0 di 2", nessuna soluzione visibile |
| A09 | UC5 | Consegnare senza rispondere | avviso "Mancano 2 risposte", domande evidenziate in rosso |
| A10 | UC6 | Rispondere, premere *Confronta*, autovalutarsi | risposta attesa visibile, avanzamento "2 di 2" |
| A11 | UC5 | Consegnare | esito con punteggio, barra e dettaglio delle risposte |
| A12 | UC7 | Aprire il risultato dallo storico | stesso esito |
| A13 | UC4 | Tornare docente e aprire le statistiche | tentativi, media e percentuale per domanda coerenti |
| A14 | UC2 | Eliminare il quiz | il quiz sparisce; torna il segnaposto |
| A15 | — | Aprire `studente.html` senza aver scelto un profilo | ritorno alla home |
| A16 | RNF6 | Restringere la finestra a larghezza da telefono | le colonne si impilano |

## 6.6 Risultati

Tutti i test di unità e di integrazione passano (25 su 25). I casi di accettazione A01–A15 sono stati eseguiti anche in modo automatizzato, pilotando le pagine con un DOM simulato, senza errori JavaScript. Per verificare che i test siano efficaci è stata introdotta volutamente un'anomalia nella correzione delle risposte a scelta multipla: quattro test (U2, U3, T12, T16) l'hanno rilevata.
