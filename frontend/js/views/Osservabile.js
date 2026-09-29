/**
 * Design pattern Observer.
 *
 * La View è il soggetto osservato: quando l'utente compie un'azione la notifica
 * con un nome (per esempio 'salvaQuiz'). Il Presenter si registra come
 * osservatore degli eventi che gli interessano. Così la View non conosce il
 * Presenter e il Presenter non conosce il DOM.
 */
class Osservabile {
    constructor() {
        this.osservatori = {};   // nome evento -> funzioni registrate
    }

    /** Registra un osservatore per un evento. */
    on(evento, osservatore) {
        (this.osservatori[evento] ??= []).push(osservatore);
    }

    /** Notifica un evento a tutti i suoi osservatori. */
    notifica(evento, ...dati) {
        for (const osservatore of this.osservatori[evento] ?? []) {
            osservatore(...dati);
        }
    }
}
