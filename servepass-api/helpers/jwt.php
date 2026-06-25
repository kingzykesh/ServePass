<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function generateToken($user)
{
    $payload = [
        "iss" => $_ENV['APP_URL'],
        "iat" => time(),
        "exp" => time() + (int) $_ENV['JWT_EXPIRES_IN'],
        "user" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email'],
            "role" => $user['role']
        ]
    ];

    return JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
}

function verifyToken($token)
{
    return JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
}