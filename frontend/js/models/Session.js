/**
 * Utente corrente, conservato nel localStorage del browser.
 * Non c'è login: il profilo si sceglie nella home.
 */
class Session {
    static salva(utente) {
        localStorage.setItem('utente', JSON.stringify(utente));
    }

    static utente() {
        return JSON.parse(localStorage.getItem('utente'));
    }

    static esci() {
        localStorage.removeItem('utente');
        location.href = 'index.html';
    }

    /** Restituisce l'utente se ha il ruolo richiesto, altrimenti torna alla home. */
    static richiedi(ruolo) {
        const utente = Session.utente();
        if (utente?.ruolo !== ruolo) {
            location.href = 'index.html';
            return null;
        }
        return utente;
    }
}
