<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Configuración CORS para permitir la comunicación con React (localhost:3000)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Incluir el autoload de Composer para PhpSpreadsheet
// Asegúrate de que esta ruta sea correcta dependiendo de dónde ejecutaste 'composer require'
require_once 'vendor/autoload.php';

// Incluir tu archivo de conexión a la base de datos MySQLi (db_connect.php)
require_once 'db_connect.php'; 

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Exception as ReaderException;

// Verificar que la conexión MySQLi ($conn) sea exitosa
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos (MySQLi): ' . $conn->connect_error]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // 1. Manejar la subida del archivo
    if (!isset($_FILES['excelFile']) || $_FILES['excelFile']['error'] != UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Error al subir el archivo o no se recibió ningún archivo.']);
        exit;
    }

    $fileTmpPath = $_FILES['excelFile']['tmp_name'];
    $fileExtension = pathinfo($_FILES['excelFile']['name'], PATHINFO_EXTENSION);
    
    // Validar extensiones permitidas
    $allowedExtensions = ['xlsx', 'xls', 'csv'];
    if (!in_array(strtolower($fileExtension), $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Formato de archivo no válido. Solo se permiten .xlsx, .xls o .csv.']);
        exit;
    }

    try {
        // 2. Cargar el archivo Excel con PhpSpreadsheet
        $spreadsheet = IOFactory::load($fileTmpPath);
        $worksheet = $spreadsheet->getActiveSheet();
        $highestRow = $worksheet->getHighestRow();

        $importedCount = 0;
        $errors = [];
        
        // 3. Preparar la consulta SQL para inserción en la tabla 'listaproductos'
        $sql = "INSERT INTO listaproductos (codigo, articulo, descripcion_subrubro, rubro, marca, cod_ml, precio_neto, precio_con_iva) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        // mysqli prepared statement
        if (!$stmt = $conn->prepare($sql)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta: ' . $conn->error]);
            exit;
        }

        // 4. Iterar sobre las filas del Excel (empezando desde la fila 2 para el encabezado)
        for ($row = 2; $row <= $highestRow; ++$row) {
            
            // 4a. Leer campos obligatorios (Código, Artículo)
            $codigo = $worksheet->getCell('A' . $row)->getValue();
            $articulo = $worksheet->getCell('B' . $row)->getValue();

            // 4b. Validación básica de campos obligatorios
            if (empty($codigo) || empty($articulo)) {
                $errors[] = "Fila $row: Faltan datos obligatorios (Código o Artículo).";
                continue; // Saltar la fila si falta información clave
            }

            // 4c. Leer campos opcionales de texto y convertirlos a NULL si están vacíos.
            $descripcionSubrubro = trim($worksheet->getCell('C' . $row)->getValue());
            $rubro = trim($worksheet->getCell('D' . $row)->getValue());
            $marca = trim($worksheet->getCell('E' . $row)->getValue());
            $codMl = trim($worksheet->getCell('F' . $row)->getValue());

            // Convertir cadenas vacías (después de trim) a NULL para la base de datos
            $descripcionSubrubro = empty($descripcionSubrubro) ? NULL : $descripcionSubrubro;
            $rubro = empty($rubro) ? NULL : $rubro;
            $marca = empty($marca) ? NULL : $marca;
            $codMl = empty($codMl) ? NULL : $codMl;

            // 4d. Leer campos numéricos (precios) y convertirlos a NULL si están vacíos.
            $precioNetoCell = $worksheet->getCell('G' . $row);
            $precioConIVACell = $worksheet->getCell('H' . $row);

            // Verificamos si la celda tiene un valor antes de intentar leerlo como float.
            $precioNeto = ($precioNetoCell->getValue() !== null && $precioNetoCell->getValue() !== '') 
                          ? (float)$precioNetoCell->getCalculatedValue() 
                          : NULL;
                          
            $precioConIVA = ($precioConIVACell->getValue() !== null && $precioConIVACell->getValue() !== '') 
                            ? (float)$precioConIVACell->getCalculatedValue() 
                            : NULL;

            // 5. Ejecutar la inserción con MySQLi
            // Tipos de parámetros: ssssssdd (6 strings, 2 doubles)
            if (!$stmt->bind_param("ssssssdd", $codigo, $articulo, $descripcionSubrubro, $rubro, $marca, $codMl, $precioNeto, $precioConIVA)) {
                $errors[] = "Fila $row: Error al vincular parámetros: " . $stmt->error;
                continue;
            }

            if ($stmt->execute()) {
                $importedCount++;
            } else {
                $errors[] = "Fila $row: Error al insertar en DB: " . $stmt->error;
            }
        }
        
        $stmt->close(); // Cerrar el statement preparado

        // 6. Respuesta final
        $response = [
            'success' => true,
            'message' => "Importación completada. Se importaron $importedCount productos. Errores: " . count($errors),
            'errors' => $errors
        ];

        echo json_encode($response);

    } catch (ReaderException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al leer el archivo Excel: ' . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Ocurrió un error inesperado: ' . $e->getMessage()]);
    }

} else {
    // Si la solicitud no es POST
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}

// Nota: No cerramos la conexión $conn aquí, ya que db_connect.php indica que se cerrará automáticamente.
?>