<?php

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';

class AuthMiddleware
{
    public static function user()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            responseJson(false, "Authorization token missing", null, 401);
        }

        $token = str_replace('Bearer ', '', $authHeader);

        try {
            $decoded = verifyToken($token);
            return (array) $decoded->user;
        } catch (Exception $e) {
            responseJson(false, "Invalid or expired token", null, 401);
        }
    }

    public static function requireRole($roles)
    {
        $user = self::user();

        if (!in_array($user['role'], $roles)) {
            responseJson(false, "You are not allowed to access this resource", null, 403);
        }

        return $user;
    }
}