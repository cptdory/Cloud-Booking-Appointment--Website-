<?php
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'user';

    // sample credentials
    $sample_username = 'admin';
    $sample_password = 'admin123';
    
    if (empty($username) || empty($password)) {
        echo json_encode(['error' => 'Username and password are required']);
        exit;
    }

    if ($username === $sample_username && $password === $sample_password) {
        session_regenerate_id(true);
        $_SESSION["role"] = $role; // change to id || PK
        echo json_encode(['status' => 'success',]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Username or password is incorrect']);
    }
}
