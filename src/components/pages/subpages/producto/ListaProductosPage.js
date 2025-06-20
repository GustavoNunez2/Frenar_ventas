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
    const [mostrandoFormularioCreacion, setMostrandoFormularioCreacion] = useState(false); // Nuevo estado

    const API_URL = 'http://localhost/facturador-api/products.php';

    const fetchProductos = async () => {
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
                // Asegúrate de usar los nombres de propiedad correctos del backend (ej. id, codigo, articulo, precio_neto)
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

    const handleEdit = (producto) => {
        setProductoEditando({ ...producto });
        setMostrandoFormularioCreacion(false); // Ocultar el formulario de creación si se activa la edición
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                const response = await fetch(API_URL, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: id }),
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
                fetchProductos();
            } catch (err) {
                console.error("Error al eliminar producto:", err);
                setError('Error al eliminar producto: ' + err.message);
            }
        }
    };

    // Nueva función para manejar el guardado desde ProductoForm (para crear o editar)
    const handleSaveProducto = async (productoData) => {
        // Determinar si es una creación (POST) o edición (PUT)
        const method = productoData.id ? 'PUT' : 'POST';
        const url = API_URL; // La URL de la API es la misma para ambos

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
            setProductoEditando(null); // Asegurarse de cerrar el formulario de edición
            setMostrandoFormularioCreacion(false); // Asegurarse de cerrar el formulario de creación
            fetchProductos(); // Recargar la lista para ver el nuevo/producto editado
        } catch (err) {
            console.error("Error al guardar/crear producto:", err);
            setError('Error al guardar/crear producto: ' + err.message);
        }
    };

    const handleCancelForm = () => {
        setProductoEditando(null); // Cancelar edición
        setMostrandoFormularioCreacion(false); // Cancelar creación
    };

    // Función para mostrar el formulario de creación
    const handleNuevoProductoClick = () => {
        setProductoEditando(null); // Asegurarse de que no estamos en modo edición
        setMostrandoFormularioCreacion(true);
    };

    // Renderizado condicional basado en el estado de carga y error
    if (cargando) {
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

            {/* Botón para crear nuevo producto */}
            <div className="create-product-button-container">
                <button
                    onClick={handleNuevoProductoClick}
                    className="action-button create"
                    disabled={mostrandoFormularioCreacion || productoEditando} // Deshabilitar si ya hay un formulario abierto
                >
                    Crear Nuevo Producto
                </button>
            </div>

            {/* Renderizado condicional del formulario: edición o creación */}
            {productoEditando && (
                <ProductoForm
                    productoInicial={productoEditando}
                    onSave={handleSaveProducto} // Ahora usa la función unificada
                    onCancel={handleCancelForm}
                />
            )}

            {mostrandoFormularioCreacion && !productoEditando && ( // Asegura que no se muestren ambos
                <ProductoForm
                    productoInicial={null} // Para crear, no hay producto inicial
                    onSave={handleSaveProducto} // Ahora usa la función unificada
                    onCancel={handleCancelForm}
                />
            )}

            {/* Tabla de Productos (solo se muestra si no hay formularios abiertos) */}
            {!productoEditando && !mostrandoFormularioCreacion && (
                <div className="table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
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
            {/* Mensaje si no hay productos */}
            {productos.length === 0 && !cargando && !error && !productoEditando && !mostrandoFormularioCreacion && (
                <p className="no-products-message">No hay productos para mostrar.</p>
            )}
        </div>
    );
};

export default ListaProductosPage;