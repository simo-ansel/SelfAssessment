<?php

/**
 * Smista ogni richiesta HTTP al metodo del Presenter corrispondente.
 * La tabella delle rotte in rotte() coincide con quella documentata in docs/05.
 */
final class Router
{
    public function run(): never
    {
        $metodo = $_SERVER['REQUEST_METHOD'];
        $percorso = rtrim(preg_replace('#^/api#', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)), '/');

        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body)) {
            $body = [];
        }

        try {
            foreach ($this->rotte($body, $this->utenteCorrente()) as [$verbo, $schema, $azione]) {
                if ($verbo === $metodo && preg_match("#^$schema$#", $percorso, $parametri)) {
                    $azione(...array_map('intval', array_slice($parametri, 1)));
                }
            }
            JsonView::error('Risorsa non trovata', 404);
        } catch (InvalidArgumentException $e) {
            JsonView::error($e->getMessage(), 400);
        } catch (Throwable $e) {
            error_log((string) $e);   // il dettaglio va nel log, non al client
            JsonView::error('Errore interno del server', 500);
        }
    }

    /**
     * Metodo HTTP, percorso (espressione regolare) e azione da eseguire.
     * I gruppi (\d+) diventano i parametri interi dell'azione.
     */
    private function rotte(array $body, ?array $utente): array
    {
        return [
            ['GET',    '/users',                     fn() => (new UserPresenter())->index()],
            ['POST',   '/users',                     fn() => (new UserPresenter())->create($body)],
            ['DELETE', '/users/(\d+)',               fn($id) => (new UserPresenter())->delete($id)],
            ['GET',    '/users/(\d+)/attempts',      fn($id) => (new UserPresenter())->attempts($id)],

            ['GET',    '/quizzes',                   fn() => (new QuizPresenter($utente))->index()],
            ['POST',   '/quizzes',                   fn() => (new QuizPresenter($utente))->create($body)],
            ['GET',    '/quizzes/(\d+)',             fn($id) => (new QuizPresenter($utente))->show($id)],
            ['PUT',    '/quizzes/(\d+)',             fn($id) => (new QuizPresenter($utente))->update($id, $body)],
            ['DELETE', '/quizzes/(\d+)',             fn($id) => (new QuizPresenter($utente))->delete($id)],
            ['GET',    '/quizzes/(\d+)/statistics',  fn($id) => (new QuizPresenter($utente))->statistiche($id)],

            ['POST',   '/quizzes/(\d+)/questions',   fn($id) => (new QuizPresenter($utente))->creaDomanda($id, $body)],
            ['PUT',    '/questions/(\d+)',           fn($id) => (new QuizPresenter($utente))->modificaDomanda($id, $body)],
            ['DELETE', '/questions/(\d+)',           fn($id) => (new QuizPresenter($utente))->eliminaDomanda($id)],

            ['POST',   '/quizzes/(\d+)/attempts',    fn($id) => (new AttemptPresenter($utente))->create($id, $body)],
            ['GET',    '/attempts/(\d+)',            fn($id) => (new AttemptPresenter($utente))->show($id)],
        ];
    }

    /** Non c'è login: l'utente scelto nella home arriva nell'header X-User-Id. */
    private function utenteCorrente(): ?array
    {
        $id = (int) ($_SERVER['HTTP_X_USER_ID'] ?? 0);
        return $id > 0 ? (new UserRepository())->find($id) : null;
    }
}
