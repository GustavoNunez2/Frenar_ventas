// src/pages/subpages/producto/ProductoForm.js
import React, { useState, useEffect } from 'react';
import './ListaProductosPage.css'; // Reutilizaremos los estilos existentes para el formulario

const ProductoForm = ({ productoInicial, onSave, onCancel }) => {
    // Si productoInicial existe, estamos en modo edición; de lo contrario, es un nuevo producto.
    const [producto, setProducto] = useState(productoInicial || {
        id: null, // Para nuevos productos, el ID será null o undefined inicialmente
        codigo: '',
        articulo: '',
        descripcionSubrubro: '',
        rubro: '',
        marca: '',
        codMl: '',
        precioNeto: 0, // Inicializar con 0 para campos numéricos
        precioConIVA: 0, // Inicializar con 0 para campos numéricos
    });

    // Sincronizar el estado interno si productoInicial cambia (útil para edición)
    useEffect(() => {
        if (productoInicial) {
            setProducto({
                ...productoInicial,
                // Asegurarse de que los precios sean números al cargar para edición
                precioNeto: parseFloat(productoInicial.precioNeto || 0),
                precioConIVA: parseFloat(productoInicial.precioConIVA || 0)
            });
        } else {
            // Resetear el formulario para un nuevo producto
            setProducto({
                id: null,
                codigo: '',
                articulo: '',
                descripcionSubrubro: '',
                rubro: '',
                marca: '',
                codMl: '',
                precioNeto: 0,
                precioConIVA: 0,
            });
        }
    }, [productoInicial]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProducto(prev => ({
            ...prev,
            [name]: name.startsWith('precio') ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validación en el frontend (similar a la que ya tenemos)
        if (!producto.codigo || !producto.articulo ||
            producto.precioNeto === null || producto.precioNeto === undefined || isNaN(producto.precioNeto) ||
            producto.precioConIVA === null || producto.precioConIVA === undefined || isNaN(producto.precioConIVA)) {

            alert('Por favor, completa todos los campos requeridos: Código, Artículo, Precio Neto y Precio con IVA. Asegúrate de que los precios sean números válidos.');
            return;
        }

        // Llamar a la función onSave que se pasa por props
        onSave(producto);
    };

    return (
        <div className="edit-form-container"> {/* Reutilizamos la misma clase CSS */}
            <h2>{productoInicial ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Código:</label>
                    <input type="text" name="codigo" value={producto.codigo || ''} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Artículo:</label>
                    <input type="text" name="articulo" value={producto.articulo || ''} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Descripción Subrubro:</label>
                    <input type="text" name="descripcionSubrubro" value={producto.descripcionSubrubro || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Rubro:</label>
                    <input type="text" name="rubro" value={producto.rubro || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Marca:</label>
                    <input type="text" name="marca" value={producto.marca || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Cod. ML:</label>
                    <input type="text" name="codMl" value={producto.codMl || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Precio Neto:</label>
                    <input type="number" step="0.01" name="precioNeto" value={producto.precioNeto || 0} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Precio con IVA:</label>
                    <input type="number" step="0.01" name="precioConIVA" value={producto.precioConIVA || 0} onChange={handleInputChange} required />
                </div>
                <div className="form-actions">
                    <button type="submit" className="action-button edit">Guardar</button>
                    <button type="button" onClick={onCancel} className="action-button delete">Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default ProductoForm;