<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Exceptions\HttpException;
use Throwable;

/**
 * Application kernel: boots configuration, builds the router from the route
 * definitions, and runs the request/response cycle with centralized error
 * handling that renders every failure as JSON.
 */
final class App
{
    private Router $router;

    public function __construct()
    {
        Config::load(require base_path('config/config.php'));

        $this->router = new Router();
        (require base_path('routes/api.php'))($this->router);
    }

    public function run(): void
    {
        $request = Request::capture();

        $this->handleCors($request);

        try {
            $response = $this->router->dispatch($request);
        } catch (HttpException $e) {
            $response = $this->errorResponse($e->status, $e->getMessage(), $e->errors, $e->headers);
        } catch (Throwable $e) {
            $response = $this->serverError($e);
        }

        $response->send();
    }

    /**
     * @param array<string, string[]> $errors
     * @param array<string, string>   $headers
     */
    private function errorResponse(int $status, string $message, array $errors = [], array $headers = []): Response
    {
        $payload = ['error' => ['status' => $status, 'message' => $message]];

        if ($errors !== []) {
            $payload['error']['fields'] = $errors;
        }

        return new Response($payload, $status, $headers);
    }

   private function serverError(Throwable $e): Response
{
    // 1. Log Estruturado (Sempre executa, mesmo com debug = false)
    $logData = [
        'timestamp' => date('c'),
        'level'     => 'ERROR',
        'message'   => $e->getMessage(),
        'exception' => $e::class,
        'file'      => $e->getFile(),
        'line'      => $e->getLine(),
        'code'      => $e->getCode(),
        'trace'     => explode("\n", $e->getTraceAsString()),
    ];

    // Envia o JSON para o stream de erro padrão (stderr / docker logs / php error log)
    error_log(json_encode($logData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

    // 2. Lógica atual de resposta para o cliente (Mantida intacta)
    $debug = (bool) Config::get('app.debug', false);

    $message = $debug ? $e->getMessage() : 'An unexpected error occurred.';
    $response = $this->errorResponse(500, $message);

    if ($debug) {
        $response->data['error']['exception'] = $e::class;
        $response->data['error']['trace'] = explode("\n", $e->getTraceAsString());
    }

    return $response;
}
    private function handleCors(Request $request): void
    {
        if (headers_sent()) {
            return;
        }

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedEnv = getenv('CORS_ALLOWED_ORIGINS') ?: '';
        $allowedOrigins = array_filter(array_map('trim', explode(',', $allowedEnv)));

        if (in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        if ($request->method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}