# Frenar_ventas

# 🚧 ¡EN DESARROLLO! 🚧

Este proyecto se encuentra actualmente en desarrollo activo. Se esperan cambios frecuentes y la funcionalidad puede no estar completa o ser inestable.

---

Este es un proyecto Full-Stack para la gestión de productos, permitiendo listar, crear, editar y eliminar productos. El frontend está desarrollado con React.js y el backend utiliza PHP con MySQL.

## Estructura del Proyecto

El proyecto está dividido en dos directorios principales:

-   `frontend/`: Contiene la aplicación web desarrollada en React.js.
-   `backend/`: Contiene los scripts PHP que actúan como la API para interactuar con la base de datos MySQL.

## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado lo siguiente:

-   **Node.js y npm** (para el frontend React)
-   **PHP** (versión 7.4 o superior recomendada)
-   **MySQL** (o MariaDB)
-   Un servidor web como **Apache** (comúnmente incluido en paquetes como XAMPP o WAMP para Windows, o LAMP para Linux).

## Configuración y Ejecución del Backend (PHP)

1.  **Base de Datos MySQL:**
    * Crea una base de datos MySQL llamada `facturador`.
    * Crea una tabla `listaproductos` con la siguiente estructura (o ajusta según tu esquema actual):
        ```sql
        CREATE TABLE listaproductos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo VARCHAR(255) NOT NULL UNIQUE,
            articulo VARCHAR(255) NOT NULL,
            descripcion_subrubro VARCHAR(255),
            rubro VARCHAR(255),
            marca VARCHAR(255),
            cod_ml VARCHAR(255),
            precio_neto DECIMAL(10, 2) NOT NULL,
            precio_con_iva DECIMAL(10, 2) NOT NULL
        );
        ```

2.  **Configuración de la Conexión a la BD (`backend/db_connect.php`):**
    * Asegúrate de que tu archivo `backend/db_connect.php` tenga las credenciales correctas para tu base de datos:
        ```php
        <?php
        $servername = "localhost";
        $username = "root"; // Tu usuario de MySQL
        $password = "";     // Tu contraseña de MySQL
        $dbname = "facturador";

        $conn = new mysqli($servername, $username, $password, $dbname);

        if ($conn->connect_error) {
            http_response_code(500);
            echo json_encode(["message" => "Connection failed: " . $conn->connect_error]);
            exit(); // Terminar el script si la conexión falla
        }
        ?>
        ```

3.  **Despliegue del Backend:**
    * Copia la carpeta `backend/` (que contiene `products.php` y `db_connect.php`) a la raíz de tu servidor web (ej. `htdocs` en XAMPP). Puedes nombrarla `facturador-api`.
    * Asegúrate de que tu servidor Apache (o el que uses) esté corriendo.
    * Verifica que la API esté accesible visitando `http://localhost/facturador-api/products.php` en tu navegador. Deberías ver un JSON (probablemente un array vacío `[]` si no hay productos).

## Configuración y Ejecución del Frontend (React)

1.  **Navega al Directorio del Frontend:**
    ```bash
    cd frontend
    ```

2.  **Instala las Dependencias:**
    ```bash
    npm install
    ```

3.  **Ejecuta la Aplicación React:**
    ```bash
    npm start
    ```
    Esto iniciará la aplicación de desarrollo en `http://localhost:3000` (o un puerto similar).

## Uso

Una vez que el frontend y el backend estén corriendo:

-   Accede a `http://localhost:3000` en tu navegador.
-   Podrás ver la lista de productos, editarlos, eliminarlos y crear nuevos productos a través del botón "Crear Nuevo Producto" o el enlace "Crear Producto" en el submenú.

## Contribuciones

Si deseas contribuir a este proyecto, por favor, sigue estos pasos:

1.  Haz un "fork" de este repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nombre-de-la-feature`).
3.  Realiza tus cambios y haz commits descriptivos.
4.  Sube tu rama (`git push origin feature/nombre-de-la-feature`).
5.  Abre un Pull Request.

## Licencia

Este proyecto está bajo la licencia [MIT License](https://opensource.org/licenses/MIT) (o la que prefieras).