// src/components/SalesViewModal.js

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal'; // Usaremos una librería de modal si ya la tienes configurada

Modal.setAppElement('#root'); // Importante para accesibilidad

const SalesViewModal = ({ isOpen, onRequestClose, saleId }) => {
    const [saleData, setSaleData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && saleId) {
            setLoading(true);
            // Llama a tu API de PHP para obtener la venta específica por ID
            fetch(`http://localhost/facturador-api/sales.php?id=${saleId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error al cargar la venta');
                    }
                    return response.json();
                })
                .then(data => {
                    setSaleData(data);
                    setLoading(false);
                })
                .catch(error => {
                    setError(error.message);
                    setLoading(false);
                    console.error("Error fetching sale details:", error);
                });
        } else {
            setSaleData(null); // Limpiar datos cuando la modal se cierra
        }
    }, [isOpen, saleId]);

    if (loading) {
        return <Modal isOpen={isOpen} onRequestClose={onRequestClose}>Cargando...</Modal>;
    }

    if (error) {
        return <Modal isOpen={isOpen} onRequestClose={onRequestClose}>Error: {error}</Modal>;
    }

    if (!saleData) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Ver Detalles de Venta"
        >
            <h2>Detalles de Venta #{saleData.id_venta}</h2>
            <p><strong>Cliente:</strong> {saleData.client_name}</p>
            <p><strong>Fecha:</strong> {new Date(saleData.fecha_venta).toLocaleDateString()}</p>
            <p><strong>Total Neto:</strong> ${saleData.total_neto}</p>
            <p><strong>Descuento:</strong> {saleData.discount}%</p>
            <p><strong>Total Final:</strong> ${saleData.total_final}</p>

            <h3>Items de Venta:</h3>
            <table>
                <thead>
                    <tr>
                        <th>Producto ID</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {saleData.items && saleData.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.producto_id}</td>
                            <td>{item.cantidad}</td>
                            <td>${item.precio_unitario}</td>
                            <td>${item.subtotal}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <button onClick={onRequestClose}>Cerrar</button>
        </Modal>
    );
};

export default SalesViewModal;