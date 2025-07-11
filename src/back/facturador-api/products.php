<?php
// products.php - Tu API de productos
// 1. Desactivar la visualización de errores para evitar que corrompan el JSON
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

// Headers para CORS (Cross-Origin Resource Sharing)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar preflight OPTIONS request (requerido por CORS para algunos métodos)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    case 'GET':
        $sql = "SELECT id, codigo, articulo, descripcion_subrubro, rubro, marca, cod_ml, precio_neto, precio_con_iva FROM listaproductos";
        $result = $conn->query($sql);

        $products = [];
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                // Convertir precios a float para asegurar el formato correcto en JSON
                $row['precio_neto'] = (float)$row['precio_neto'];
                $row['precio_con_iva'] = (float)$row['precio_con_iva'];
                $products[] = $row;
            }
        }
        echo json_encode($products);
        break;

    case 'POST':
        // Lógica para crear un nuevo producto
        // Validar datos recibidos (asegúrate de que los nombres de los campos coincidan con los que envías desde React)
        if (empty($data['codigo']) || empty($data['articulo']) || !isset($data['precioNeto']) || !isset($data['precioConIVA'])) {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos para crear el producto (codigo, articulo, precioNeto, precioConIVA son requeridos)."]);
            exit();
        }

        // Sanitizar y escapar datos (¡Usamos prepared statements para mayor seguridad!)
        $codigo = $data['codigo'];
        $articulo = $data['articulo'];
        
        // Los campos opcionales pueden ser NULL si no se proporcionan o están vacíos
        $descripcionSubrubro = isset($data['descripcionSubrubro']) && $data['descripcionSubrubro'] !== '' ? $data['descripcionSubrubro'] : null;
        $rubro = isset($data['rubro']) && $data['rubro'] !== '' ? $data['rubro'] : null;
        $marca = isset($data['marca']) && $data['marca'] !== '' ? $data['marca'] : null;
        $codMl = isset($data['codMl']) && $data['codMl'] !== '' ? $data['codMl'] : null;
        
        // Convertir precios a float (usando el operador null-coalescing para manejar casos donde el precio no se envía)
        $precioNeto = (float)($data['precioNeto'] ?? 0);
        $precioConIVA = (float)($data['precioConIVA'] ?? 0);

        $sql = "INSERT INTO listaproductos (codigo, articulo, descripcion_subrubro, rubro, marca, cod_ml, precio_neto, precio_con_iva) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            http_response_code(500);
            echo json_encode(["message" => "Error al preparar la consulta POST: " . $conn->error]);
            exit();
        }

        // "ssssssdd" -> 6 strings (s), 2 doubles (d)
        $stmt->bind_param("ssssssdd", $codigo, $articulo, $descripcionSubrubro, $rubro, $marca, $codMl, $precioNeto, $precioConIVA);

        if ($stmt->execute()) {
            http_response_code(201); // 201 Created para indicar que se creó un nuevo recurso
            echo json_encode(["message" => "Producto creado correctamente.", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al crear el producto: " . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'PUT':
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "ID de producto no proporcionado para actualización."]);
            break;
        }

        $id = (int)$data['id']; // Asegúrate de que el ID sea un entero
        $codigo = $data['codigo'] ?? null;
        $articulo = $data['articulo'] ?? null;
        
        // Manejo de campos opcionales para PUT (NULL si no se envían o están vacíos)
        $descripcionSubrubro = isset($data['descripcionSubrubro']) && $data['descripcionSubrubro'] !== '' ? $data['descripcionSubrubro'] : null;
        $rubro = isset($data['rubro']) && $data['rubro'] !== '' ? $data['rubro'] : null;
        $marca = isset($data['marca']) && $data['marca'] !== '' ? $data['marca'] : null;
        $codMl = isset($data['codMl']) && $data['codMl'] !== '' ? $data['codMl'] : null;
        
        // Asegúrate de castear a float, usando 0 si el valor no existe en el payload
        $precioNeto = (float)($data['precioNeto'] ?? 0); 
        $precioConIVA = (float)($data['precioConIVA'] ?? 0); 

        // Verificación de datos obligatorios antes de la actualización
        if (is_null($codigo) || is_null($articulo)) {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos para actualizar el producto (código y artículo son requeridos)."]);
            break;
        }

        $sql = "UPDATE listaproductos SET 
                    codigo = ?, 
                    articulo = ?, 
                    descripcion_subrubro = ?, 
                    rubro = ?, 
                    marca = ?, 
                    cod_ml = ?, 
                    precio_neto = ?, 
                    precio_con_iva = ? 
                WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            http_response_code(500);
            echo json_encode(["message" => "Error al preparar la consulta PUT: " . $conn->error]);
            break;
        }
        
        // ssssssddi -> 6 strings (s), 2 doubles (d), 1 integer (i)
        $stmt->bind_param("ssssssddi", 
            $codigo, $articulo, $descripcionSubrubro, $rubro, $marca, $codMl, $precioNeto, $precioConIVA, $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                echo json_encode(["message" => "Producto actualizado correctamente."]);
            } else {
                http_response_code(200); 
                echo json_encode(["message" => "Producto encontrado, pero no se realizaron cambios o el ID no existe."]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al actualizar el producto: " . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        // **Manejo de eliminación individual y masiva**
        
        // Intentar obtener IDs del cuerpo JSON (para eliminación masiva desde React)
        $ids = $data['ids'] ?? null; 

        // Si no se reciben IDs en el array, verificar si se envió un solo ID en el body JSON o por GET (para compatibilidad)
        if (!$ids && isset($data['id'])) {
            $ids = [$data['id']]; // Convertir el ID individual en un array
        } elseif (!$ids && isset($_GET['id'])) {
            // Manejar si se pasó un solo ID por query param (ej. /products.php?id=1)
            $ids = [$_GET['id']];
        }

        if (empty($ids) || !is_array($ids)) {
            http_response_code(400);
            echo json_encode(["message" => "IDs de producto no proporcionados o formato incorrecto para eliminación."]);
            break;
        }
        
        // Sanitizar IDs (asegurar que sean enteros)
        $ids = array_map('intval', $ids);
        
        // 1. Crear la consulta SQL para eliminación masiva usando WHERE id IN (...)
        // Creamos una cadena de '?' placeholders basados en el número de IDs
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        $sql = "DELETE FROM listaproductos WHERE id IN ($placeholders)";
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            http_response_code(500);
            echo json_encode(["message" => "Error al preparar la consulta DELETE masiva: " . $conn->error]);
            break;
        }

        // 2. Vincular dinámicamente los IDs a los placeholders
        // Necesitamos una cadena de tipos ('i' para cada ID entero)
        $types = str_repeat('i', count($ids));
        
        // array_unshift agrega la cadena de tipos al inicio de la matriz de IDs
        array_unshift($ids, $types);
        
        // ----------------------------------------------------
        // CORRECCIÓN: Usar el operador "splat" (...) para pasar argumentos por referencia
        // Esto soluciona el Warning de bind_param
        // ----------------------------------------------------
        try {
            $stmt->bind_param(...$ids);
        } catch (Throwable $e) {
            // En caso de que el operador splat falle en alguna configuración antigua,
            // volvemos a usar call_user_func_array, aunque cause el warning.
            // Nota: Es mejor actualizar PHP si esto falla.
            call_user_func_array([$stmt, 'bind_param'], $ids);
        }

        // 3. Ejecutar la eliminación
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                http_response_code(200);
                echo json_encode(["message" => "Productos eliminados correctamente. Total eliminados: " . $stmt->affected_rows]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "No se encontraron productos con los IDs proporcionados."]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al eliminar productos: " . $stmt->error]);
        }
        $stmt->close();
        break;
}

// Cierra la conexión si no se usa mysqli_close() en db_connect.php
$conn->close();
?>