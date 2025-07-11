<?php
// sales.php - API para el facturador y listado de ventas

// 1. Desactivar la visualización de errores para evitar que corrompan el JSON
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

// 2. Configuración de CORS y Headers, incluyendo DELETE y OPTIONS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir la conexión a la base de datos
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
$searchTerm = $_GET['q'] ?? '';
$input = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    case 'GET':
    // Lógica para BUSCAR PRODUCTOS, VER DETALLES o LISTAR VENTAS
    
    if (!empty($searchTerm)) {
        // --- Lógica de Búsqueda de Productos (SalesCreatePage.js) ---
        // Se ejecuta si hay un parámetro 'q' (buscar)
        $sql = "SELECT id, codigo, articulo, precio_neto, precio_con_iva FROM listaproductos 
                WHERE codigo LIKE ? OR articulo LIKE ? OR descripcion_subrubro LIKE ?";
        
        $stmt = $conn->prepare($sql);
        $searchPattern = "%" . $searchTerm . "%";
        $stmt->bind_param("sss", $searchPattern, $searchPattern, $searchPattern);
        $stmt->execute();
        $result = $stmt->get_result();

        $products = [];
        if ($result) {
            while($row = $result->fetch_assoc()) {
                $row['precio_neto'] = (float)$row['precio_neto'];
                $row['precio_con_iva'] = (float)$row['precio_con_iva'];
                $products[] = $row;
            }
        }
        echo json_encode($products);
        if (isset($stmt)) $stmt->close();

    } elseif (isset($_GET['id']) && is_numeric($_GET['id'])) {
        // --- Lógica para OBTENER DETALLES de una Venta específica (Ver) ---
        // Se ejecuta si hay un parámetro 'id' (ver detalle)
        $venta_id = $_GET['id'];
        
        // 1. Obtener los detalles de la venta (tabla ventas)
        $sql_venta = "SELECT id_venta, fecha_venta, total_final, client_name, discount, total_neto FROM ventas WHERE id_venta = ?";
        $stmt_venta = $conn->prepare($sql_venta);
        $stmt_venta->bind_param("i", $venta_id);
        $stmt_venta->execute();
        $result_venta = $stmt_venta->get_result();
        $venta = $result_venta->fetch_assoc();

        if ($venta) {
            // 2. Obtener los productos asociados (tabla detalle_venta)
            $sql_detalle = "SELECT venta_id, producto_id, cantidad, precio_unitario, subtotal FROM detalle_venta WHERE venta_id = ?";
            $stmt_detalle = $conn->prepare($sql_detalle);
            $stmt_detalle->bind_param("i", $venta_id);
            $stmt_detalle->execute();
            $result_detalle = $stmt_detalle->get_result();
            
            $detalle_items = [];
            while ($row = $result_detalle->fetch_assoc()) {
                $row['precio_unitario'] = (float)$row['precio_unitario'];
                $row['subtotal'] = (float)$row['subtotal'];
                $detalle_items[] = $row;
            }
            
            $venta['items'] = $detalle_items;
            
            echo json_encode($venta);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Venta no encontrada"]);
        }
        
        if (isset($stmt_venta)) $stmt_venta->close();
        if (isset($stmt_detalle)) $stmt_detalle->close();

    } else {
        // --- Lógica de Listado de Ventas general (SalesListPage.js) ---
        // Se ejecuta si NO hay 'q' ni 'id'
        $sql = "SELECT id_venta, fecha_venta, total_final, client_name, discount FROM ventas ORDER BY fecha_venta DESC"; 
        $result = $conn->query($sql);
        
        $sales = [];
        if ($result) {
            while($row = $result->fetch_assoc()) {
                $row['total_final'] = (float)$row['total_final'];
                $row['discount'] = (float)$row['discount'];
                $sales[] = $row;
            }
        }
        echo json_encode($sales);
    }
    break;
     case 'POST':
        // --- Lógica para Guardar una Venta (POST) ---
        $data = $input;
        
        $conn->begin_transaction();
        try {
            // ... (El código de inserción en la tabla 'ventas' es correcto) ...
            $sql_venta = "INSERT INTO ventas (client_name, total_neto, discount, total_final) VALUES (?, ?, ?, ?)";
            $stmt_venta = $conn->prepare($sql_venta);
            $cliente_nombre = $data['clientName'] ?? 'Consumidor Final';
            $total_neto = (float)$data['total_neto'];
            $descuento = (float)($data['discount'] ?? 0.00);
            $total_final = (float)$data['total_final'];
            $stmt_venta->bind_param("sddd", $cliente_nombre, $total_neto, $descuento, $total_final);
            $stmt_venta->execute();
            $venta_id = $conn->insert_id;
            $stmt_venta->close();

            // --- CORRECCIÓN AQUÍ: Eliminamos 'codigo' y 'articulo' del INSERT ---
            $sql_detalle = "INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)";
            $stmt_detalle = $conn->prepare($sql_detalle);

            foreach ($data['items'] as $item) {
                $producto_id = (int)($item['id'] ?? 0);
                // No necesitamos $codigo = $item['codigo'] ?? '';
                // No necesitamos $articulo = $item['articulo'] ?? '';
                $cantidad = (int)($item['cantidad'] ?? 0);
                $precio_unitario = (float)($item['precio_venta'] ?? 0);
                $subtotal = (float)($item['cantidad'] * $item['precio_venta']);

                // --- CORRECCIÓN: Ajustamos bind_param para 5 columnas (iiidd) ---
                // Original: "iissidd" (7 parámetros) -> Corregido: "iiidd" (5 parámetros)
                $stmt_detalle->bind_param("iiidd", $venta_id, $producto_id, $cantidad, $precio_unitario, $subtotal);
                $stmt_detalle->execute();
            }
            $stmt_detalle->close();

            $conn->commit(); 
            http_response_code(201); 
            echo json_encode(["success" => true, "message" => "Venta registrada exitosamente.", "venta_id" => $venta_id]);
        } catch (mysqli_sql_exception $e) {
            $conn->rollback(); 
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al registrar la venta: " . $e->getMessage()]);
        }
        break;
    case 'PUT':
        // --- Lógica para Actualizar una Venta (PUT) ---
        $data = $input;
        $venta_id = $data['id_venta'] ?? null;

        if (!$venta_id) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID de venta no proporcionado para la actualización."]);
            break;
        }

        $conn->begin_transaction();
        try {
            // 1. Actualizar la tabla 'ventas'
            $sql_venta_update = "UPDATE ventas SET client_name = ?, total_neto = ?, discount = ?, total_final = ? WHERE id_venta = ?";
            $stmt_venta_update = $conn->prepare($sql_venta_update);

            $cliente_nombre = $data['clientName'] ?? 'Consumidor Final';
            $total_neto = (float)$data['total_neto'];
            $descuento = (float)($data['discount'] ?? 0.00);
            $total_final = (float)$data['total_final'];

            $stmt_venta_update->bind_param("sdddi", $cliente_nombre, $total_neto, $descuento, $total_final, $venta_id);
            $stmt_venta_update->execute();
            $stmt_venta_update->close();

            // 2. Eliminar los detalles de venta existentes para reinsertar los nuevos
            $sql_detalle_delete = "DELETE FROM detalle_venta WHERE venta_id = ?";
            $stmt_detalle_delete = $conn->prepare($sql_detalle_delete);
            $stmt_detalle_delete->bind_param("i", $venta_id);
            $stmt_detalle_delete->execute();
            $stmt_detalle_delete->close();

            // 3. Insertar los nuevos detalles de venta (misma lógica que en POST)
            // NOTA: Usamos la misma consulta INSERT que corregimos en el POST (sin 'codigo' ni 'articulo')
            $sql_detalle_insert = "INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)";
            $stmt_detalle_insert = $conn->prepare($sql_detalle_insert);

            foreach ($data['items'] as $item) {
                $producto_id = (int)($item['id'] ?? 0);
                $cantidad = (int)($item['cantidad'] ?? 0);
                // Si el precio_venta no existe, intenta usar precio_unitario si viene de la base de datos
                $precio_unitario = (float)($item['precio_venta'] ?? $item['precio_unitario'] ?? 0); 
                // Asegúrate de que el subtotal se calcule correctamente en el frontend, 
                // o recalcularlo aquí: $subtotal = (float)($cantidad * $precio_unitario);
                $subtotal = (float)($item['subtotal'] ?? 0); 

                // Los tipos de bind_param: i (venta_id), i (producto_id), i (cantidad), d (precio_unitario), d (subtotal)
                $stmt_detalle_insert->bind_param("iiidd", $venta_id, $producto_id, $cantidad, $precio_unitario, $subtotal);
                $stmt_detalle_insert->execute();
            }
            $stmt_detalle_insert->close();

            $conn->commit();
            http_response_code(200); 
            echo json_encode(["success" => true, "message" => "Venta #" . $venta_id . " actualizada exitosamente."]);

        } catch (mysqli_sql_exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al actualizar la venta: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Lógica de Eliminación (Requiere el ID de venta)
        $delete_id = $_GET['id'] ?? $input['id'] ?? null;

        if ($delete_id) {
            // Eliminar venta y detalles de venta (opcionalmente puedes usar FOREIGN KEY ON DELETE CASCADE si ya lo tienes configurado)
            $conn->begin_transaction();
            try {
                // Eliminar detalles de venta asociados
                $sql_detalle = "DELETE FROM detalle_venta WHERE venta_id = ?";
                $stmt_detalle = $conn->prepare($sql_detalle);
                $stmt_detalle->bind_param("i", $delete_id);
                $stmt_detalle->execute();
                $stmt_detalle->close();

                // Eliminar la venta
                $sql_venta = "DELETE FROM ventas WHERE id_venta = ?";
                $stmt_venta = $conn->prepare($sql_venta);
                $stmt_venta->bind_param("i", $delete_id);
                $stmt_venta->execute();
                
                if ($stmt_venta->affected_rows > 0) {
                    $conn->commit();
                    http_response_code(200);
                    echo json_encode(["success" => true, "message" => "Venta #" . $delete_id . " eliminada exitosamente."]);
                } else {
                    $conn->rollback();
                    http_response_code(404);
                    echo json_encode(["success" => false, "message" => "Venta #" . $delete_id . " no encontrada."]);
                }
                $stmt_venta->close();
            } catch (mysqli_sql_exception $e) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Error al eliminar la venta: " . $e->getMessage()]);
            }

        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID de venta no proporcionado para la eliminación."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Método HTTP no soportado."]);
        break;
}

$conn->close();
?>