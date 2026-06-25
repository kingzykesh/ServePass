<?php

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/response.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$basePath = '/servepass-api';
$route = str_replace($basePath, '', $uri);

if ($method === 'POST' && $route === '/api/register') {
    AuthController::register();
}

if ($method === 'POST' && $route === '/api/login') {
    AuthController::login();
}

if ($method === 'GET' && $route === '/api/me') {
    $user = AuthMiddleware::user();
    responseJson(true, "Authenticated user fetched successfully", $user);
}

if ($method === 'GET' && $route === '/api/admin-only') {
    $user = AuthMiddleware::requireRole(['ADMIN']);
    responseJson(true, "Welcome admin", $user);
}

responseJson(false, "Route not found", [
    "method" => $method,
    "route" => $route
], 404);