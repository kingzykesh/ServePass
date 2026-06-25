<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';

class AuthController
{
    public static function register()
    {
        $db = Database::connect();
        $input = json_decode(file_get_contents("php://input"), true);

        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $role = strtoupper($input['role'] ?? 'ADMIN');

        if (!$name || !$email || !$password) {
            responseJson(false, "Name, email and password are required", null, 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            responseJson(false, "Invalid email address", null, 422);
        }

        if (!in_array($role, ['ADMIN', 'VERIFIER'])) {
            responseJson(false, "Invalid role. Use ADMIN or VERIFIER", null, 422);
        }

        $check = $db->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);

        if ($check->fetch()) {
            responseJson(false, "Email already exists", null, 409);
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $db->prepare("
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([$name, $email, $hashedPassword, $role]);

        responseJson(true, "User registered successfully", [
            "id" => $db->lastInsertId(),
            "name" => $name,
            "email" => $email,
            "role" => $role
        ], 201);
    }

    public static function login()
    {
        $db = Database::connect();
        $input = json_decode(file_get_contents("php://input"), true);

        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (!$email || !$password) {
            responseJson(false, "Email and password are required", null, 422);
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);

        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            responseJson(false, "Invalid email or password", null, 401);
        }

        $token = generateToken($user);

        unset($user['password']);

        responseJson(true, "Login successful", [
            "user" => $user,
            "token" => $token
        ]);
    }
}