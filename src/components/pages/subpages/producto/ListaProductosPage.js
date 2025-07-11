// src/pages/subpages/producto/ListaProductosPage.js

import React, { useState, useEffect } from 'react';
import '../../../../components/Layout/Layout.css';
import './ListaProductosPage.css';
import ProductoForm from './ProductoForm'; // ¡Importar el nuevo componente!

const ListaProductosPage = () => {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [productoEditando, setProductoEditando] = useState(null);
    const [mostrandoFormularioCreacion, setMostrandoFormularioCreacion] = useState(false);
    
    // Nuevo estado para almacenar los IDs de los productos seleccionados
    const [selectedProducts, setSelectedProducts] = useState([]); 

    const API_URL = 'http://localhost/facturador-api/products.php';

    const fetchProductos = async () => {
        // ... (fetchProductos - sin cambios, usa el código que ya tienes) ...
        setCargando(true);
        setError(null);
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(`HTTP error! status: ${response.status} - ${errorJson.message || errorText}`);
                } catch (jsonParseError) {
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }
            }
            const data = await response.json();
            const parsedData = data.map(prod => ({
                ...prod,
                // Asegurarse de usar los nombres de propiedad correctos del backend (ej. id, codigo, articulo, precio_neto)
                // Y convertirlos a float si es necesario
                id: parseInt(prod.id), // Asegurarse de que el id sea un número entero
                codigo: prod.codigo,
                articulo: prod.articulo,
                descripcionSubrubro: prod.descripcion_subrubro, // Mapear a camelCase si tu front usa eso
                rubro: prod.rubro,
                marca: prod.marca,
                codMl: prod.cod_ml, // Mapear a camelCase si tu front usa eso
                precioNeto: parseFloat(prod.precio_neto),
                precioConIVA: parseFloat(prod.precio_con_iva)
            }));
            setProductos(parsedData);
        } catch (err) {
            console.error("Error al cargar los productos:", err);
            setError('Error al cargar los productos: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    // ----------------------------------------------------
    // Funciones de SELECCIÓN
    // ----------------------------------------------------

    // Maneja la selección individual de una fila (checkbox)
    const handleCheckboxChange = (id) => {
        setSelectedProducts(prevSelected => {
            if (prevSelected.includes(id)) {
                // Si ya está seleccionado, lo eliminamos
                return prevSelected.filter(productId => productId !== id);
            } else {
                // Si no está seleccionado, lo agregamos
                return [...prevSelected, id];
            }
        });
    };

    // Maneja la selección de todas las filas (checkbox de encabezado)
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Si el checkbox "Seleccionar Todo" está marcado, seleccionar todos los productos
            const allProductIds = productos.map(p => p.id);
            setSelectedProducts(allProductIds);
        } else {
            // Si está desmarcado, limpiar la selección
            setSelectedProducts([]);
        }
    };

    // Determina si todos los productos están seleccionados
    const isAllSelected = productos.length > 0 && selectedProducts.length === productos.length;

    // ----------------------------------------------------
    // Funciones de ELIMINACIÓN
    // ----------------------------------------------------
    
    // Función de eliminación individual (sin cambios importantes, aunque ahora puedes usar handleBulkDelete si lo prefieres)
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                // Usamos la lógica de eliminación masiva con un solo ID para simplificar
                await handleBulkDelete([id]);
            } catch (err) {
                console.error("Error al eliminar producto:", err);
                setError('Error al eliminar producto: ' + err.message);
            }
        }
    };

    // Función para eliminar productos seleccionados
    const handleBulkDelete = async (idsToDelete = selectedProducts) => {
        if (idsToDelete.length === 0) {
            alert("Selecciona al menos un producto para eliminar.");
            return;
        }

        const confirmationMessage = idsToDelete.length === 1 
            ? '¿Estás seguro de que quieres eliminar este producto?' 
            : `¿Estás seguro de que quieres eliminar ${idsToDelete.length} productos seleccionados?`;

        if (window.confirm(confirmationMessage)) {
            try {
                const response = await fetch(API_URL, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Enviamos un objeto JSON con el array de IDs
                    body: JSON.stringify({ ids: idsToDelete }), 
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    try {
                        const errorJson = JSON.parse(errorText);
                        throw new Error(`HTTP error! status: ${response.status} - ${errorJson.message || errorText}`);
                    } catch (jsonParseError) {
                        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                    }
                }
                const result = await response.json();
                alert(result.message);
                
                setSelectedProducts([]); // Limpiar la selección después de eliminar
                fetchProductos(); // Recargar la lista
            } catch (err) {
                console.error("Error al eliminar producto(s):", err);
                setError('Error al eliminar producto(s): ' + err.message);
            }
        }
    };


    // ----------------------------------------------------
    // Lógica de Edición/Creación (sin cambios)
    // ----------------------------------------------------

    const handleEdit = (producto) => {
        // ... (código existente) ...
        setProductoEditando({ ...producto });
        setMostrandoFormularioCreacion(false);
    };

    const handleSaveProducto = async (productoData) => {
        // ... (código existente) ...
        const method = productoData.id ? 'PUT' : 'POST';
        const url = API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productoData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(`HTTP error! status: ${response.status} - ${errorJson.message || errorText}`);
                } catch (jsonParseError) {
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }
            }
            const result = await response.json();
            alert(result.message);
            setProductoEditando(null); 
            setMostrandoFormularioCreacion(false); 
            fetchProductos(); 
        } catch (err) {
            console.error("Error al guardar/crear producto:", err);
            setError('Error al guardar/crear producto: ' + err.message);
        }
    };

    const handleCancelForm = () => {
        setProductoEditando(null);
        setMostrandoFormularioCreacion(false);
    };

    const handleNuevoProductoClick = () => {
        setProductoEditando(null);
        setMostrandoFormularioCreacion(true);
    };

    // ----------------------------------------------------
    // Renderizado (JSX)
    // ----------------------------------------------------

    if (cargando) {
        // ... (código existente de carga) ...
        return (
            <div className="content-area loading-message">
                <div className="spinner"></div>
                Cargando productos...
            </div>
        );
    }

    if (error) {
        return <div className="content-area error-message">{error}</div>;
    }

    return (
        <div className="content-area">
            <h1 className="page-title">Lista de Productos</h1>

            <div className="button-container-top">
                {/* Botón para crear nuevo producto */}
                <button
                    onClick={handleNuevoProductoClick}
                    className="action-button create"
                    disabled={mostrandoFormularioCreacion || productoEditando}
                >
                    Crear Nuevo Producto
                </button>
                
                {/* Botón para eliminar productos seleccionados */}
                <button
                    onClick={() => handleBulkDelete()}
                    className="action-button delete"
                    disabled={selectedProducts.length === 0 || mostrandoFormularioCreacion || productoEditando}
                >
                    Eliminar Seleccionados ({selectedProducts.length})
                </button>
            </div>

            {/* Renderizado condicional de formularios (sin cambios) */}
            {productoEditando && (
                <ProductoForm
                    productoInicial={productoEditando}
                    onSave={handleSaveProducto}
                    onCancel={handleCancelForm}
                />
            )}

            {mostrandoFormularioCreacion && !productoEditando && (
                <ProductoForm
                    productoInicial={null}
                    onSave={handleSaveProducto}
                    onCancel={handleCancelForm}
                />
            )}

            {/* Tabla de Productos (solo se muestra si no hay formularios abiertos) */}
            {!productoEditando && !mostrandoFormularioCreacion && (
                <div className="table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
                                {/* Nuevo encabezado para el checkbox "Seleccionar Todo" */}
                                <th>
                                    <input 
                                        type="checkbox" 
                                        onChange={handleSelectAll} 
                                        checked={isAllSelected}
                                    />
                                </th>
                                <th>Código</th>
                                <th>Artículo</th>
                                <th>Descripción Subrubro</th>
                                <th>Rubro</th>
                                <th>Marca</th>
                                <th>Cod. ML</th>
                                <th>Precio Neto</th>
                                <th>Precio con IVA</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map(producto => (
                                <tr key={producto.id}>
                                    {/* Nueva celda para el checkbox de selección individual */}
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedProducts.includes(producto.id)}
                                            onChange={() => handleCheckboxChange(producto.id)}
                                        />
                                    </td>
                                    <td>{producto.codigo}</td>
                                    <td>{producto.articulo}</td>
                                    <td>{producto.descripcionSubrubro}</td>
                                    <td>{producto.rubro}</td>
                                    <td>{producto.marca}</td>
                                    <td>{producto.codMl}</td>
                                    <td>${producto.precioNeto !== undefined && producto.precioNeto !== null ? producto.precioNeto.toFixed(2) : '0.00'}</td>
                                    <td>${producto.precioConIVA !== undefined && producto.precioConIVA !== null ? producto.precioConIVA.toFixed(2) : '0.00'}</td>
                                    <td>
                                        <button onClick={() => handleEdit(producto)} className="action-button edit">Editar</button>
                                        <button onClick={() => handleDelete(producto.id)} className="action-button delete">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Mensaje si no hay productos (sin cambios) */}
            {productos.length === 0 && !cargando && !error && !productoEditando && !mostrandoFormularioCreacion && (
                <p className="no-products-message">No hay productos para mostrar.</p>
            )}
        </div>
    );
};

export default ListaProductosPage;