/**
 * View del docente: elenco dei quiz a sinistra; a destra segnaposto,
 * form del quiz oppure dettaglio (statistiche, domande, form della domanda).
 */
class DocenteView extends Osservabile {
    constructor() {
        super();
        const $ = (id) => document.getElementById(id);

        this.elencoQuiz = $('elenco-quiz');
        this.vuoto = $('vuoto');
        this.dettaglio = $('dettaglio');

        this.formQuiz = $('form-quiz');
        this.titoloFormQuiz = $('titolo-form-quiz');
        this.quizTitolo = $('quiz-titolo');
        this.quizDescrizione = $('quiz-descrizione');

        this.titoloQuiz = $('titolo-quiz');
        this.descrizioneQuiz = $('descrizione-quiz');
        this.statistiche = $('statistiche');
        this.contenutoStatistiche = $('contenuto-statistiche');
        this.numeroDomande = $('numero-domande');
        this.elencoDomande = $('elenco-domande');

        this.formDomanda = $('form-domanda');
        this.titoloFormDomanda = $('titolo-form-domanda');
        this.domandaTesto = $('domanda-testo');
        this.bloccoOpzioni = $('blocco-opzioni');
        this.bloccoAperta = $('blocco-aperta');
        this.domandaAttesa = $('domanda-attesa');
        this.testiOpzioni = [...this.bloccoOpzioni.querySelectorAll('input[type="text"]')];
        this.radioCorrette = [...this.bloccoOpzioni.querySelectorAll('input[type="radio"]')];

        $('btn-nuovo-quiz').addEventListener('click', () => this.notifica('nuovoQuiz'));
        $('btn-modifica-quiz').addEventListener('click', () => this.notifica('modificaQuiz'));
        $('btn-annulla-quiz').addEventListener('click', () => this.notifica('annullaQuiz'));
        $('btn-elimina-quiz').addEventListener('click', () => this.notifica('eliminaQuiz'));
        $('btn-statistiche').addEventListener('click', () => this.notifica('statistiche'));
        $('btn-chiudi-statistiche').addEventListener('click', () => this.statistiche.classList.add('d-none'));
        $('btn-annulla-domanda').addEventListener('click', () => this.notifica('annullaDomanda'));
        this.formQuiz.addEventListener('submit', (e) => { e.preventDefault(); this.notifica('salvaQuiz'); });
        this.formDomanda.addEventListener('submit', (e) => { e.preventDefault(); this.notifica('salvaDomanda'); });
        this.formDomanda.addEventListener('change', () => this.aggiornaTipo());
    }

    mostraUtente(utente) {
        Dom.barraUtente(utente, () => this.notifica('esci'));
    }

    // ---------------- elenco dei quiz ----------------

    mostraQuiz(quiz, idSelezionato) {
        if (quiz.length === 0) {
            Dom.vuoto(this.elencoQuiz, 'Nessun quiz: creane uno con "+ Nuovo".');
            return;
        }
        this.elencoQuiz.replaceChildren(...quiz.map((q) => {
            const voce = document.createElement('button');
            voce.type = 'button';
            voce.className = 'list-group-item list-group-item-action' + (q.id === idSelezionato ? ' active' : '');
            voce.append(
                Dom.testo('div', 'fw-semibold', q.titolo),
                Dom.testo('div', 'small text-secondary', Dom.conta(q.numero_domande, 'domanda', 'domande'))
            );
            voce.addEventListener('click', () => this.notifica('apriQuiz', q.id));
            return voce;
        }));
    }

    // ---------------- colonna destra ----------------

    /** Mostra una sola delle tre aree della colonna destra. */
    mostraArea(area) {
        this.vuoto.classList.toggle('d-none', area !== this.vuoto);
        this.formQuiz.classList.toggle('d-none', area !== this.formQuiz);
        this.dettaglio.classList.toggle('d-none', area !== this.dettaglio);
    }

    mostraVuoto() {
        this.mostraArea(this.vuoto);
    }

    /** @param quiz null per un nuovo quiz, altrimenti il quiz da modificare */
    mostraFormQuiz(quiz) {
        this.titoloFormQuiz.textContent = quiz ? 'Modifica quiz' : 'Nuovo quiz';
        this.quizTitolo.value = quiz?.titolo ?? '';
        this.quizDescrizione.value = quiz?.descrizione ?? '';
        this.mostraArea(this.formQuiz);
        this.quizTitolo.focus();
    }

    datiQuiz() {
        return { titolo: this.quizTitolo.value.trim(), descrizione: this.quizDescrizione.value.trim() };
    }

    mostraDettaglio(quiz) {
        this.titoloQuiz.textContent = quiz.titolo;
        this.descrizioneQuiz.textContent = quiz.descrizione || 'Nessuna descrizione';
        this.statistiche.classList.add('d-none');
        this.mostraDomande(quiz.domande);
        this.pulisciFormDomanda();
        this.mostraArea(this.dettaglio);
    }

    mostraDomande(domande) {
        this.numeroDomande.textContent = `${domande.length} in totale`;
        if (domande.length === 0) {
            Dom.vuoto(this.elencoDomande, 'Ancora nessuna domanda: aggiungila con il form qui sotto.');
            return;
        }
        this.elencoDomande.replaceChildren(...domande.map((d, i) => {
            const testo = document.createElement('div');
            testo.append(Dom.testo('span', 'numero', `${i + 1}.`), d.testo);

            const azioni = document.createElement('div');
            azioni.className = 'btn-group btn-group-sm flex-shrink-0';
            azioni.append(
                Dom.bottone('Modifica', 'btn-outline-secondary', () => this.notifica('modificaDomanda', d.id)),
                Dom.bottone('Elimina', 'btn-outline-danger', () => this.notifica('eliminaDomanda', d.id))
            );

            const intestazione = document.createElement('div');
            intestazione.className = 'd-flex justify-content-between gap-3';
            intestazione.append(testo, azioni);

            const blocco = document.createElement('div');
            blocco.className = 'domanda';
            blocco.append(intestazione);

            if (d.tipo === 'scelta_multipla') {
                const lista = document.createElement('ul');
                lista.className = 'small mb-0 mt-2';
                lista.append(...d.opzioni.map((o) =>
                    Dom.testo('li', o.corretta ? 'opzione-corretta' : '', o.testo + (o.corretta ? '  ✓' : ''))));
                blocco.append(lista);
            } else {
                blocco.append(Dom.testo('div', 'attesa small', 'Risposta attesa: ' + d.risposta_attesa));
            }
            return blocco;
        }));
    }

    mostraStatistiche(stat) {
        this.statistiche.classList.remove('d-none');

        if (stat.tentativi === 0) {
            Dom.vuoto(this.contenutoStatistiche, 'Nessuno studente ha ancora svolto questo quiz.');
            return;
        }

        const righe = stat.per_domanda.map((d, i) => {
            const percentuale = d.risposte > 0 ? Math.round(d.corrette / d.risposte * 100) : 0;
            const barra = document.createElement('div');
            barra.className = 'progress mt-1';
            const riempimento = document.createElement('div');
            riempimento.className = 'progress-bar';
            riempimento.style.width = percentuale + '%';
            barra.append(riempimento);

            const riga = document.createElement('div');
            riga.className = 'mb-3';
            const intestazione = document.createElement('div');
            intestazione.className = 'd-flex justify-content-between small gap-3';
            intestazione.append(Dom.testo('span', '', `${i + 1}. ${d.testo}`), Dom.testo('span', 'text-secondary text-nowrap', `${percentuale}% corrette`));
            riga.append(intestazione, barra);
            return riga;
        });

        this.contenutoStatistiche.replaceChildren(
            Dom.testo('p', 'mb-4', `${Dom.conta(stat.tentativi, 'tentativo', 'tentativi')} · punteggio medio ${stat.punteggio_medio}`),
            ...righe
        );
    }

    // ---------------- form della domanda ----------------

    tipoScelto() {
        return this.formDomanda.querySelector('input[name="tipo"]:checked').value;
    }

    aggiornaTipo() {
        const aperta = this.tipoScelto() === 'risposta_aperta';
        this.bloccoOpzioni.classList.toggle('d-none', aperta);
        this.bloccoAperta.classList.toggle('d-none', !aperta);
    }

    datiDomanda() {
        const dati = { testo: this.domandaTesto.value.trim(), tipo: this.tipoScelto(), risposta_attesa: '', opzioni: [] };
        if (dati.tipo === 'risposta_aperta') {
            dati.risposta_attesa = this.domandaAttesa.value.trim();
        } else {
            this.testiOpzioni.forEach((input, i) => {
                if (input.value.trim()) {
                    dati.opzioni.push({ testo: input.value.trim(), corretta: this.radioCorrette[i].checked });
                }
            });
        }
        return dati;
    }

    riempiFormDomanda(domanda) {
        this.titoloFormDomanda.textContent = 'Modifica domanda';
        this.domandaTesto.value = domanda.testo;
        this.formDomanda.querySelector(`input[name="tipo"][value="${domanda.tipo}"]`).checked = true;
        this.domandaAttesa.value = domanda.risposta_attesa ?? '';
        this.testiOpzioni.forEach((input, i) => {
            input.value = domanda.opzioni[i]?.testo ?? '';
            this.radioCorrette[i].checked = Boolean(domanda.opzioni[i]?.corretta);
        });
        this.aggiornaTipo();
        this.formDomanda.scrollIntoView({ behavior: 'smooth' });
        this.domandaTesto.focus();
    }

    pulisciFormDomanda() {
        this.formDomanda.reset();
        this.titoloFormDomanda.textContent = 'Nuova domanda';
        this.aggiornaTipo();
    }

    // ---------------- messaggi ----------------

    mostraErrore(messaggio)   { Dom.avviso(messaggio, 'danger'); }
    mostraConferma(messaggio) { Dom.avviso(messaggio, 'success'); }
}
