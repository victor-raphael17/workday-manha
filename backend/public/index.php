<?php

/**
 * CA Pharmacy API — front controller.
 *
 * Every HTTP request is routed through this single entry point (see the
 * .htaccess rewrite). It loads the Composer autoloader and hands control to
 * the application kernel.
 */

declare(strict_types=1);

/**
 * CORS Configuration for Development Environment.
 * Enables cross-origin requests from the frontend development server (e.g., Vite).
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$composerAutoload = dirname(__DIR__) . '/vendor/autoload.php';

if (is_file($composerAutoload)) {
    require $composerAutoload;
} else {
    // No `composer install` run — fall back to the bundled PSR-4 autoloader.
    require dirname(__DIR__) . '/src/autoload.php';
}

(new App\Core\App())->run();