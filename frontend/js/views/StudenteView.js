/**
 * View dello studente: quiz disponibili e risultati a sinistra;
 * a destra segnaposto, svolgimento del quiz oppure esito.
 */
class StudenteView extends Osservabile {
    constructor() {
        super();
        const $ = (id) => document.getElementById(id);

        this.elencoQuiz = $('elenco-quiz');
        this.elencoStorico = $('elenco-storico');
        this.vuoto = $('vuoto');
        this.svolgimento = $('svolgimento');
        this.esito = $('esito');

        this.titoloSvolgimento = $('titolo-svolgimento');
        this.descrizioneSvolgimento = $('descrizione-svolgimento');
        this.testoAvanzamento = $('testo-avanzamento');
        this.barraAvanzamento = $('barra-avanzamento');
        this.domande = $('contenitore-domande');

        this.titoloEsito = $('titolo-esito');
        this.punteggio = $('punteggio');
        this.barraEsito = $('barra-esito');
        this.percentuale = $('percentuale');
        this.dettaglioEsito = $('dettaglio-esito');

        $('btn-consegna').addEventListener('click', () => this.notifica('consegna'));
        $('btn-annulla').addEventListener('click', () => this.notifica('annulla'));
        $('btn-chiudi-esito').addEventListener('click', () => this.notifica('annulla'));
        this.domande.addEventListener('input', () => this.notifica('risposta'));
    }

    mostraUtente(utente) {
        Dom.barraUtente(utente, () => this.notifica('esci'));
    }

    // ---------------- colonna sinistra ----------------

    mostraQuiz(quiz) {
        if (quiz.length === 0) {
            Dom.vuoto(this.elencoQuiz, 'Nessun quiz disponibile.');
            return;
        }
        this.elencoQuiz.replaceChildren(...quiz.map((q) => {
            const voce = document.createElement('button');
            voce.type = 'button';
            voce.className = 'list-group-item list-group-item-action';
            voce.disabled = q.numero_domande === 0;
            voce.append(
                Dom.testo('div', 'fw-semibold', q.titolo),
                Dom.testo('div', 'small text-secondary', `${q.docente} · ${Dom.conta(q.numero_domande, 'domanda', 'domande')}`)
            );
            voce.addEventListener('click', () => this.notifica('apriQuiz', q.id));
            return voce;
        }));
    }

    mostraStorico(tentativi) {
        if (tentativi.length === 0) {
            Dom.vuoto(this.elencoStorico, 'Non hai ancora svolto quiz.');
            return;
        }
        this.elencoStorico.replaceChildren(...tentativi.map((t) => {
            const voce = document.createElement('button');
            voce.type = 'button';
            voce.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-2';
            const info = document.createElement('div');
            info.append(Dom.testo('div', '', t.quiz_titolo), Dom.testo('div', 'small text-secondary', Dom.data(t.data_svolgimento)));
            voce.append(info, Dom.testo('span', 'badge text-bg-secondary', `${t.punteggio}/${t.totale}`));
            voce.addEventListener('click', () => this.notifica('apriRisultato', t.id));
            return voce;
        }));
    }

    // ---------------- colonna destra ----------------

    mostraArea(area) {
        for (const sezione of [this.vuoto, this.svolgimento, this.esito]) {
            sezione.classList.toggle('d-none', sezione !== area);
        }
    }

    mostraVuoto() {
        this.mostraArea(this.vuoto);
    }

    /** Costruisce il questionario. Le opzioni non indicano quale sia corretta. */
    mostraSvolgimento(quiz) {
        this.titoloSvolgimento.textContent = quiz.titolo;
        this.descrizioneSvolgimento.textContent = quiz.descrizione ?? '';
        this.domande.replaceChildren(...quiz.domande.map((d, i) => {
            const blocco = document.createElement('div');
            blocco.className = 'domanda';
            blocco.dataset.id = d.id;
            blocco.dataset.tipo = d.tipo;

            const testo = document.createElement('div');
            testo.className = 'fw-semibold';
            testo.append(Dom.testo('span', 'numero', `${i + 1}.`), d.testo);
            blocco.append(testo);

            if (d.tipo === 'scelta_multipla') {
                blocco.append(...d.opzioni.map((o) => this.scelta(`domanda-${d.id}`, o.id, o.testo)));
            } else {
                blocco.append(...this.rispostaAperta(d));
            }
            return blocco;
        }));
        this.mostraArea(this.svolgimento);
    }

    /** Riquadro cliccabile con un radio button. */
    scelta(nome, valore, etichetta) {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.className = 'form-check-input';
        radio.name = nome;
        radio.value = valore;

        const riquadro = document.createElement('label');
        riquadro.className = 'scelta';
        riquadro.append(radio, Dom.testo('span', '', etichetta));
        return riquadro;
    }

    /** Area di testo, risposta attesa da rivelare e autovalutazione. */
    rispostaAperta(domanda) {
        const area = document.createElement('textarea');
        area.className = 'form-control mt-2';
        area.rows = 3;
        area.placeholder = 'Scrivi la tua risposta';

        const attesa = Dom.testo('div', 'attesa small d-none', 'Risposta attesa: ' + domanda.risposta_attesa);
        const mostra = Dom.bottone('Confronta con la risposta attesa', 'btn-sm btn-link px-0 mt-1', () => {
            attesa.classList.remove('d-none');
            mostra.remove();
        });

        const autovalutazione = Dom.testo('div', 'small text-secondary mt-3', 'Autovalutazione');
        const opzioni = document.createElement('div');
        opzioni.className = 'row g-2';
        for (const [valore, etichetta] of [['1', 'L\'ho fatta giusta'], ['0', 'L\'ho fatta sbagliata']]) {
            const colonna = document.createElement('div');
            colonna.className = 'col-sm-6';
            colonna.append(this.scelta(`auto-${domanda.id}`, valore, etichetta));
            opzioni.append(colonna);
        }
        return [area, mostra, attesa, autovalutazione, opzioni];
    }

    /**
     * Legge le risposte dal DOM. Una risposta non data vale null:
     * option_id per la scelta multipla, corretta per la risposta aperta.
     */
    raccogliRisposte() {
        return [...this.domande.querySelectorAll('.domanda')].map((blocco) => {
            const scelta = blocco.querySelector('input[type="radio"]:checked');
            const id = Number(blocco.dataset.id);
            if (blocco.dataset.tipo === 'scelta_multipla') {
                return { question_id: id, option_id: scelta ? Number(scelta.value) : null };
            }
            return {
                question_id: id,
                testo_libero: blocco.querySelector('textarea').value.trim(),
                corretta: scelta ? scelta.value === '1' : null
            };
        });
    }

    mostraAvanzamento(completate, totale) {
        this.testoAvanzamento.textContent = `${completate} di ${totale}`;
        this.barraAvanzamento.style.width = (completate / totale * 100) + '%';
    }

    /** Evidenzia le domande incomplete; con scorri = true porta in vista la prima. */
    evidenziaIncomplete(ids, scorri = false) {
        const blocchi = [...this.domande.querySelectorAll('.domanda')];
        for (const blocco of blocchi) {
            blocco.classList.toggle('incompleta', ids.includes(Number(blocco.dataset.id)));
        }
        if (scorri) {
            blocchi.find((b) => b.classList.contains('incompleta'))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    mostraEsito(tentativo) {
        const percentuale = Math.round(tentativo.punteggio / tentativo.totale * 100);
        this.titoloEsito.textContent = tentativo.quiz_titolo;
        this.punteggio.textContent = `${tentativo.punteggio}/${tentativo.totale}`;
        this.barraEsito.style.width = percentuale + '%';
        this.percentuale.textContent = `${percentuale}% di risposte corrette · ${Dom.data(tentativo.data_svolgimento)}`;

        this.dettaglioEsito.replaceChildren(...tentativo.risposte.map((r, i) => {
            const blocco = document.createElement('div');
            blocco.className = 'domanda ' + (r.corretta ? 'giusta' : 'sbagliata');

            const titolo = document.createElement('div');
            titolo.className = 'fw-semibold';
            titolo.append(Dom.testo('span', 'icona-esito', r.corretta ? '✓' : '✗'), `${i + 1}. ${r.domanda}`);

            blocco.append(titolo, Dom.testo('div', 'small mt-1', 'La tua risposta: ' + (r.opzione_scelta || r.testo_libero || '—')));
            if (r.tipo === 'risposta_aperta') {
                blocco.append(Dom.testo('div', 'attesa small', 'Risposta attesa: ' + r.risposta_attesa));
            }
            return blocco;
        }));
        this.mostraArea(this.esito);
        this.esito.scrollIntoView({ behavior: 'smooth' });
    }

    mostraErrore(messaggio)   { Dom.avviso(messaggio, 'danger'); }
    mostraConferma(messaggio) { Dom.avviso(messaggio, 'success'); }
}
