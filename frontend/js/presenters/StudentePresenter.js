/**
 * Presenter dello studente: scelta del quiz, svolgimento, consegna ed esito.
 * Una risposta è completa quando è stata scelta un'opzione (scelta multipla)
 * oppure quando lo studente si è autovalutato (risposta aperta).
 */
class StudentePresenter {
    constructor(view, utente) {
        this.view = view;
        this.utente = utente;
        this.quizInCorso = null;
        this.consegnaTentata = false;   // dopo un tentativo di consegna si evidenziano le mancanti
    }

    async init() {
        const v = this.view;
        v.on('esci', () => Session.esci());
        v.on('apriQuiz', (id) => this.esegui(() => this.apriQuiz(id)));
        v.on('risposta', () => this.aggiornaAvanzamento());
        v.on('consegna', () => this.esegui(() => this.consegna()));
        v.on('annulla', () => this.chiudi());
        v.on('apriRisultato', (id) => this.esegui(() => this.apriRisultato(id)));

        v.mostraUtente(this.utente);
        v.mostraVuoto();
        await this.esegui(async () => {
            v.mostraQuiz(await ApiService.quiz());
            v.mostraStorico(await ApiService.storico(this.utente.id));
        });
    }

    async apriQuiz(id) {
        if (this.quizInCorso && !confirm('Abbandonare il quiz in corso? Le risposte date andranno perse.')) {
            return;
        }
        this.quizInCorso = await ApiService.dettaglioQuiz(id, true);
        this.consegnaTentata = false;
        this.view.mostraSvolgimento(this.quizInCorso);
        this.aggiornaAvanzamento();
    }

    /** Id delle domande a cui manca ancora una risposta. */
    incomplete(risposte) {
        return risposte
            .filter((r) => ('option_id' in r ? r.option_id : r.corretta) === null)
            .map((r) => r.question_id);
    }

    aggiornaAvanzamento() {
        const risposte = this.view.raccogliRisposte();
        const mancanti = this.incomplete(risposte);
        this.view.mostraAvanzamento(risposte.length - mancanti.length, risposte.length);
        if (this.consegnaTentata) {
            this.view.evidenziaIncomplete(mancanti);
        }
    }

    async consegna() {
        const risposte = this.view.raccogliRisposte();
        const mancanti = this.incomplete(risposte);
        if (mancanti.length > 0) {
            this.consegnaTentata = true;
            this.view.evidenziaIncomplete(mancanti, true);
            const quante = mancanti.length === 1 ? 'Manca 1 risposta' : `Mancano ${mancanti.length} risposte`;
            this.view.mostraErrore(`${quante}: scegli un'opzione o autovalutati.`);
            return;
        }
        const tentativo = await ApiService.consegna(this.quizInCorso.id, risposte);
        this.quizInCorso = null;
        this.view.mostraEsito(tentativo);
        this.view.mostraStorico(await ApiService.storico(this.utente.id));
    }

    async apriRisultato(id) {
        this.quizInCorso = null;
        this.view.mostraEsito(await ApiService.tentativo(id));
    }

    chiudi() {
        this.quizInCorso = null;
        this.view.mostraVuoto();
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
