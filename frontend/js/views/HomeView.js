/**
 * View della home: elenco dei profili divisi per ruolo e creazione di un nuovo profilo.
 */
class HomeView extends Osservabile {
    constructor() {
        super();
        this.elencoDocenti = document.getElementById('elenco-docenti');
        this.elencoStudenti = document.getElementById('elenco-studenti');
        this.form = document.getElementById('form-utente');
        this.nome = document.getElementById('nuovo-nome');

        this.form.addEventListener('submit', (evento) => {
            evento.preventDefault();
            this.notifica('crea');
        });
    }

    mostraUtenti(utenti) {
        this.riempi(this.elencoDocenti, utenti.filter((u) => u.ruolo === 'docente'), 'Nessun docente');
        this.riempi(this.elencoStudenti, utenti.filter((u) => u.ruolo === 'studente'), 'Nessuno studente');
    }

    riempi(contenitore, utenti, messaggioVuoto) {
        if (utenti.length === 0) {
            Dom.vuoto(contenitore, messaggioVuoto);
            return;
        }
        contenitore.replaceChildren(...utenti.map((utente) => {
            const entra = document.createElement('button');
            entra.type = 'button';
            entra.className = 'utente';
            entra.append(Dom.avatar(utente), Dom.testo('span', 'flex-grow-1', utente.nome), Dom.testo('span', 'freccia', '→'));
            entra.addEventListener('click', () => this.notifica('entra', utente));

            const elimina = Dom.bottone('✕', 'btn-sm btn-link text-secondary', () => this.notifica('elimina', utente));
            elimina.title = 'Elimina ' + utente.nome;

            const riga = document.createElement('div');
            riga.className = 'list-group-item d-flex align-items-center p-0 pe-2';
            riga.append(entra, elimina);
            return riga;
        }));
    }

    datiNuovoUtente() {
        return {
            nome: this.nome.value.trim(),
            ruolo: this.form.querySelector('input[name="ruolo"]:checked').value
        };
    }

    pulisciForm() {
        this.nome.value = '';
        this.nome.focus();
    }

    mostraErrore(messaggio)  { Dom.avviso(messaggio, 'danger'); }
    mostraConferma(messaggio) { Dom.avviso(messaggio, 'success'); }
}
