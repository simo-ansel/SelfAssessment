/**
 * Funzioni di supporto comuni alle View per costruire elementi del DOM.
 * Il testo si inserisce sempre con textContent, mai con innerHTML: i dati
 * dell'utente non vengono mai interpretati come HTML (protezione da XSS).
 */
class Dom {
    static testo(tag, classe, contenuto) {
        const elemento = document.createElement(tag);
        elemento.className = classe;
        elemento.textContent = contenuto;
        return elemento;
    }

    static bottone(etichetta, classe, azione) {
        const bottone = Dom.testo('button', 'btn ' + classe, etichetta);
        bottone.type = 'button';
        bottone.addEventListener('click', azione);
        return bottone;
    }

    /** Cerchio con le iniziali, colorato in base al ruolo. */
    static avatar(utente) {
        const iniziali = utente.nome.split(/\s+/).slice(0, 2).map((parola) => parola[0].toUpperCase()).join('');
        return Dom.testo('span', 'avatar ' + utente.ruolo, iniziali);
    }

    /** Nome e avatar dell'utente nella barra in alto; il pulsante Esci notifica la View. */
    static barraUtente(utente, onEsci) {
        document.getElementById('avatar-utente').replaceChildren(Dom.avatar(utente));
        document.getElementById('nome-utente').textContent = utente.nome;
        document.getElementById('btn-esci').addEventListener('click', onEsci);
    }

    /** Notifica temporanea in basso a destra. tipo: 'success' oppure 'danger'. */
    static avviso(messaggio, tipo) {
        const avviso = Dom.testo('div', `alert alert-${tipo} shadow mb-0 py-2`, messaggio);
        document.getElementById('avvisi').append(avviso);
        setTimeout(() => avviso.remove(), 3500);
    }

    /** Svuota un contenitore mostrando un messaggio. */
    static vuoto(contenitore, messaggio) {
        contenitore.replaceChildren(Dom.testo('div', 'vuoto', messaggio));
    }

    /** Data UTC del database ("2026-09-28 12:05:00") nel fuso locale: "28/09/26, 14:05". */
    static data(valore) {
        return new Date(valore.replace(' ', 'T') + 'Z').toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
    }

    /** "1 domanda", "3 domande". */
    static conta(numero, singolare, plurale) {
        return `${numero} ${numero === 1 ? singolare : plurale}`;
    }
}
