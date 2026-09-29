/**
 * Presenter della home: gestione dei profili e ingresso nell'area del ruolo scelto.
 */
class HomePresenter {
    constructor(view) {
        this.view = view;
    }

    async init() {
        this.view.on('entra', (utente) => this.entra(utente));
        this.view.on('crea', () => this.crea());
        this.view.on('elimina', (utente) => this.elimina(utente));
        await this.esegui(() => this.carica());
    }

    async carica() {
        this.view.mostraUtenti(await ApiService.utenti());
    }

    async crea() {
        const dati = this.view.datiNuovoUtente();
        if (!dati.nome) {
            this.view.mostraErrore('Inserisci un nome');
            return;
        }
        await this.esegui(async () => {
            await ApiService.creaUtente(dati);
            this.view.pulisciForm();
            await this.carica();
            this.view.mostraConferma('Profilo creato');
        });
    }

    async elimina(utente) {
        if (!confirm(`Eliminare ${utente.nome}? Verranno cancellati anche i suoi quiz o risultati.`)) {
            return;
        }
        await this.esegui(async () => {
            await ApiService.eliminaUtente(utente.id);
            await this.carica();
        });
    }

    entra(utente) {
        Session.salva(utente);
        location.href = utente.ruolo === 'docente' ? 'docente.html' : 'studente.html';
    }

    /** Esegue un'operazione mostrando all'utente l'eventuale errore dell'API. */
    async esegui(operazione) {
        try {
            await operazione();
        } catch (errore) {
            this.view.mostraErrore(errore.message);
        }
    }
}
