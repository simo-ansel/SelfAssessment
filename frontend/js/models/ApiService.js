/**
 * Unico punto del frontend che comunica con l'API REST (usa fetch()).
 * Nasconde URL, header, serializzazione JSON e gestione degli errori HTTP
 * dietro metodi con il nome dell'operazione.
 */
class ApiService {
    static base = '/api';

    static async richiesta(metodo, percorso, corpo) {
        const risposta = await fetch(ApiService.base + percorso, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': Session.utente()?.id ?? ''
            },
            body: corpo ? JSON.stringify(corpo) : undefined
        });

        if (risposta.status === 204) {
            return null;
        }
        const dati = await risposta.json().catch(() => null);
        if (!risposta.ok) {
            throw new Error(dati?.errore ?? 'Errore ' + risposta.status);
        }
        return dati;
    }

    // utenti
    static utenti()             { return ApiService.richiesta('GET', '/users'); }
    static creaUtente(dati)     { return ApiService.richiesta('POST', '/users', dati); }
    static eliminaUtente(id)    { return ApiService.richiesta('DELETE', `/users/${id}`); }
    static storico(studenteId)  { return ApiService.richiesta('GET', `/users/${studenteId}/attempts`); }

    // quiz
    static quiz(docenteId)      { return ApiService.richiesta('GET', '/quizzes' + (docenteId ? `?docente_id=${docenteId}` : '')); }
    static dettaglioQuiz(id, perStudente = false) {
        return ApiService.richiesta('GET', `/quizzes/${id}` + (perStudente ? '?perStudente=1' : ''));
    }
    static creaQuiz(dati)       { return ApiService.richiesta('POST', '/quizzes', dati); }
    static modificaQuiz(id, dati) { return ApiService.richiesta('PUT', `/quizzes/${id}`, dati); }
    static eliminaQuiz(id)      { return ApiService.richiesta('DELETE', `/quizzes/${id}`); }
    static statistiche(id)      { return ApiService.richiesta('GET', `/quizzes/${id}/statistics`); }

    // domande
    static creaDomanda(quizId, dati) { return ApiService.richiesta('POST', `/quizzes/${quizId}/questions`, dati); }
    static modificaDomanda(id, dati) { return ApiService.richiesta('PUT', `/questions/${id}`, dati); }
    static eliminaDomanda(id)        { return ApiService.richiesta('DELETE', `/questions/${id}`); }

    // svolgimento
    static consegna(quizId, risposte) { return ApiService.richiesta('POST', `/quizzes/${quizId}/attempts`, { risposte }); }
    static tentativo(id)              { return ApiService.richiesta('GET', `/attempts/${id}`); }
}
