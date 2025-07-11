<?php
// db_connect.php

// Detalles de conexión a la base de datos
$servername = "localhost";
$username = "root"; // Usuario por defecto de XAMPP para MySQL
$password = "";    // Contraseña por defecto de XAMPP para MySQL (vacía)
$dbname = "FRENAR";   // Nombre de la base de datos que acabamos de crear

// Crea la conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verifica la conexión
if ($conn->connect_error) {
    die("Error de conexión a la base de datos: " . $conn->connect_error);
}

// Opcional: Establecer el juego de caracteres a utf8mb4 para evitar problemas con tildes y caracteres especiales
$conn->set_charset("utf8mb4");

// No cierres la conexión aquí, ya que será usada por otros scripts.
// La conexión se cerrará automáticamente cuando el script PHP termine,
// o puedes cerrarla explícitamente con $conn->close(); cuando ya no sea necesaria.