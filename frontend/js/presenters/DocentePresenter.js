/**
 * Presenter del docente. Tiene lo stato della schermata:
 * quale quiz è aperto e se si sta modificando un quiz o una domanda esistente.
 */
class DocentePresenter {
    constructor(view, utente) {
        this.view = view;
        this.utente = utente;
        this.quizAperto = null;         // quiz mostrato nel dettaglio, con le sue domande
        this.modificaQuiz = false;      // il form del quiz sta modificando quizAperto?
        this.domandaInModifica = null;  // id della domanda nel form, null = nuova
    }

    async init() {
        const v = this.view;
        v.on('esci', () => Session.esci());
        v.on('apriQuiz', (id) => this.esegui(() => this.apriQuiz(id)));
        v.on('nuovoQuiz', () => this.mostraFormQuiz(false));
        v.on('modificaQuiz', () => this.mostraFormQuiz(true));
        v.on('annullaQuiz', () => this.mostraQuizAperto());
        v.on('salvaQuiz', () => this.esegui(() => this.salvaQuiz()));
        v.on('eliminaQuiz', () => this.esegui(() => this.eliminaQuiz()));
        v.on('statistiche', () => this.esegui(() => this.statistiche()));
        v.on('salvaDomanda', () => this.esegui(() => this.salvaDomanda()));
        v.on('modificaDomanda', (id) => this.modificaDomanda(id));
        v.on('annullaDomanda', () => this.annullaDomanda());
        v.on('eliminaDomanda', (id) => this.esegui(() => this.eliminaDomanda(id)));

        v.mostraUtente(this.utente);
        v.mostraVuoto();
        await this.esegui(() => this.caricaQuiz());
    }

    async caricaQuiz() {
        this.view.mostraQuiz(await ApiService.quiz(this.utente.id), this.quizAperto?.id);
    }

    async apriQuiz(id) {
        this.aggiornaQuizAperto(await ApiService.dettaglioQuiz(id));
        await this.caricaQuiz();
    }

    /** Aggiorna il quiz aperto e lo ridisegna, azzerando il form della domanda. */
    aggiornaQuizAperto(quiz) {
        this.quizAperto = quiz;
        this.domandaInModifica = null;
        this.view.mostraDettaglio(quiz);
    }

    mostraQuizAperto() {
        if (this.quizAperto) {
            this.view.mostraDettaglio(this.quizAperto);
        } else {
            this.view.mostraVuoto();
        }
    }

    // ---------------- quiz ----------------

    mostraFormQuiz(modifica) {
        this.modificaQuiz = modifica;
        this.view.mostraFormQuiz(modifica ? this.quizAperto : null);
    }

    async salvaQuiz() {
        const dati = this.view.datiQuiz();
        if (!dati.titolo) {
            this.view.mostraErrore('Inserisci un titolo');
            return;
        }
        const quiz = this.modificaQuiz
            ? await ApiService.modificaQuiz(this.quizAperto.id, dati)
            : await ApiService.creaQuiz(dati);
        this.aggiornaQuizAperto(quiz);
        await this.caricaQuiz();
        this.view.mostraConferma('Quiz salvato');
    }

    async eliminaQuiz() {
        if (!confirm(`Eliminare "${this.quizAperto.titolo}" con tutte le sue domande e i risultati?`)) {
            return;
        }
        await ApiService.eliminaQuiz(this.quizAperto.id);
        this.quizAperto = null;
        this.view.mostraVuoto();
        await this.caricaQuiz();
        this.view.mostraConferma('Quiz eliminato');
    }

    async statistiche() {
        this.view.mostraStatistiche(await ApiService.statistiche(this.quizAperto.id));
    }

    // ---------------- domande ----------------

    async salvaDomanda() {
        const dati = this.view.datiDomanda();
        const quiz = this.domandaInModifica
            ? await ApiService.modificaDomanda(this.domandaInModifica, dati)
            : await ApiService.creaDomanda(this.quizAperto.id, dati);
        this.aggiornaQuizAperto(quiz);
        await this.caricaQuiz();
        this.view.mostraConferma('Domanda salvata');
    }

    modificaDomanda(id) {
        this.domandaInModifica = id;
        this.view.riempiFormDomanda(this.quizAperto.domande.find((d) => d.id === id));
    }

    annullaDomanda() {
        this.domandaInModifica = null;
        this.view.pulisciFormDomanda();
    }

    async eliminaDomanda(id) {
        if (!confirm('Eliminare la domanda?')) {
            return;
        }
        await ApiService.eliminaDomanda(id);
        this.aggiornaQuizAperto(await ApiService.dettaglioQuiz(this.quizAperto.id));
        await this.caricaQuiz();
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
