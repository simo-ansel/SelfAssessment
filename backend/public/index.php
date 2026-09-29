<?php
/**
 * Front controller: unico punto di ingresso dell'API.
 * Apache inoltra qui ogni richiesta verso /api (vedi .htaccess).
 */
declare(strict_types=1);

require_once __DIR__ . '/../src/View/JsonView.php';
require_once __DIR__ . '/../src/Model/Database.php';
require_once __DIR__ . '/../src/Model/Correzione.php';
require_once __DIR__ . '/../src/Model/CorrezioneAutomatica.php';
require_once __DIR__ . '/../src/Model/Autovalutazione.php';
require_once __DIR__ . '/../src/Model/UserRepository.php';
require_once __DIR__ . '/../src/Model/QuizRepository.php';
require_once __DIR__ . '/../src/Model/AttemptRepository.php';
require_once __DIR__ . '/../src/Presenter/UserPresenter.php';
require_once __DIR__ . '/../src/Presenter/QuizPresenter.php';
require_once __DIR__ . '/../src/Presenter/AttemptPresenter.php';
require_once __DIR__ . '/../src/Router.php';

(new Router())->run();
