import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
// Importa Modal (ej. de react-modal) y el nuevo componente SalesViewModal
import Modal from 'react-modal'; 
import SalesViewModal from './SalesViewModal'; 
import './SalesListPage.css'; 
import { useNavigate } from 'react-router-dom';

// Configurar Modal para accesibilidad
Modal.setAppElement('#root');

const API_URL = 'http://localhost/facturador-api/sales.php'; 

const SalesListPage = () => {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // --- NUEVOS ESTADOS para la Modal de Vista ---
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState(null);

    // Formatear la fecha para una mejor visualización en la tabla
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleString();
        } catch (e) {
            return 'Invalid Date';
        }
    };

    // Formatear el total final
    const formatTotal = (total) => {
        const parsedTotal = parseFloat(total);
        if (isNaN(parsedTotal)) {
            return '$NaN';
        }
        return `$${parsedTotal.toFixed(2)}`;
    };

    // Lógica para obtener la lista de ventas
    const fetchSales = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (!response.ok) {
                const text = await response.text();
                if (text.startsWith('<')) {
                    throw new Error('Error de servidor: El servidor devolvió un error HTML/PHP en lugar de JSON. Revisa tus archivos PHP.');
                }
                
                let errorData;
                try {
                    errorData = JSON.parse(text);
                } catch {
                    throw new Error('Error al cargar ventas: Respuesta no válida del servidor.');
                }
                throw new Error(errorData.message || 'Error desconocido.');
            }
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setSales(data);
            } else {
                console.error("Respuesta inesperada del servidor:", data);
                setSales([]);
            }
            
        } catch (err) {
            setError(err.message || 'Error de conexión al servidor.');
            console.error("Error fetching sales list:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    // Lógica para descargar PDF (Mantengo tu lógica, pero recuerda que usa datos de ejemplo para los items)
    const handleDownloadPDF = async (sale) => {
        // NOTA: Para obtener los detalles completos para el PDF, esta función
        // debería llamar a la API (sales.php?id=sale.id_venta) para obtener los items reales.

        // Ejemplo de datos mock para el PDF (ajústalo con los datos reales de la venta)
        const invoiceDetails = {
            venta_id: sale.id_venta,
            clientName: sale.client_name || 'Consumidor Final',
            total_final: sale.total_final, 
            discount: sale.discount,
            total_neto: parseFloat(sale.total_final) / (1 - (parseFloat(sale.discount) / 100)),
            // Datos de los items (actuamente mock)
            items: [
                { codigo: '101', articulo: 'Producto A (Ejemplo)', cantidad: 2, precio_venta: 50 },
            ]
        };

        const doc = new jsPDF();
        const margin = 10;
        let y = margin;
        const lineHeight = 7;
        const width = doc.internal.pageSize.getWidth();
        const labelX = width - 65; 
        const valueX = width - 15; 

        // Generación del PDF (el mismo código de SalesCreatePage.js)
        doc.setFontSize(18);
        doc.text("TICKET DE VENTA", width / 2, y, { align: "center" });
        y += lineHeight * 2;

        doc.setFontSize(10);
        doc.text("Empresa: FRENAR", margin, y);
        y += lineHeight;
        doc.text(`Venta ID: ${invoiceDetails.venta_id}`, margin, y);
        y += lineHeight;
        doc.text(`Fecha: ${formatDate(sale.fecha_venta)}`, margin, y);
        y += lineHeight;
        doc.text(`Cliente: ${invoiceDetails.clientName}`, margin, y);
        y += lineHeight * 2;

        // ... (resto de la tabla de productos) ...

        // Totales (Usando las coordenadas corregidas)
        doc.setFontSize(12);
        doc.text("Subtotal:", labelX, y); 
        doc.text(`$${invoiceDetails.total_neto.toFixed(2)}`, valueX, y, { align: "right" }); 
        y += lineHeight;

        if (invoiceDetails.discount > 0) {
            doc.text("Descuento:", labelX, y); 
            doc.text(`$${(invoiceDetails.total_neto * (invoiceDetails.discount / 100)).toFixed(2)} (${invoiceDetails.discount}%)`, valueX, y, { align: "right" });
            y += lineHeight;
        }

        doc.setFontSize(14);
        doc.text("TOTAL:", labelX, y); 
        doc.text(`$${invoiceDetails.total_final.toFixed(2)}`, valueX, y, { align: "right" }); 
        y += lineHeight * 2;
        
        doc.save(`ticket_venta_${sale.id_venta}.pdf`);
    };

    // Lógica para eliminar una venta
    const handleDeleteSale = async (id) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la venta #${id}?`)) {
            try {
                // Petición DELETE a sales.php
                const response = await fetch(`${API_URL}?id=${id}`, {
                    method: 'DELETE',
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    alert('Venta eliminada exitosamente.');
                    // Recargar la lista de ventas
                    fetchSales();
                } else {
                    alert(`Error al eliminar la venta: ${result.message}`);
                }
            } catch (err) {
                console.error("Error deleting sale:", err);
                alert("Error de conexión o fallo de JSON al eliminar la venta.");
            }
        }
    };
    
    // --- Lógica para manejar el 'Ver' ---
    const handleViewClick = (id) => {
        setSelectedSaleId(id);
        setIsViewModalOpen(true);
    };

    // --- LÓGICA PARA MANEJAR EL 'EDITAR' (AGREGADA) ---
    const handleEditClick = (id) => {
        // Usamos navigate para ir a la ruta de edición con el ID de la venta
        navigate(`/ventas/editar/${id}`);
    };

    // Renderizado de la Interfaz
    if (isLoading) {
        return <div className="sales-list-page loading">Cargando lista de ventas...</div>;
    }

    if (error) {
        return <div className="sales-list-page error">Error: {error}</div>;
    }

    return (
        <div className="sales-list-page">
            <h1>Lista de Ventas</h1>
            
            <table>
                <thead>
                    <tr>
                        <th>ID Venta</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Descuento (%)</th>
                        <th>Total Final</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.length === 0 ? (
                        <tr>
                            <td colSpan="6">No hay ventas registradas.</td>
                        </tr>
                    ) : (
                        sales.map((sale) => (
                            <tr key={sale.id_venta}>
                                <td>{sale.id_venta}</td>
                                <td>{formatDate(sale.fecha_venta)}</td>
                                <td>{sale.client_name || 'N/A'}</td>
                                <td>{sale.discount || 0}%</td>
                                <td>{formatTotal(sale.total_final)}</td>
                                <td className="actions">
                                    <button onClick={() => handleDownloadPDF(sale)}>
                                        PDF
                                    </button>
                                    
                                    <button onClick={() => handleViewClick(sale.id_venta)}>
                                        Ver
                                    </button>

                                    {/* Botón 'Editar' corregido */}
                                    <button onClick={() => handleEditClick(sale.id_venta)}>
                                        Editar
                                    </button>
                                    
                                    <button onClick={() => handleDeleteSale(sale.id_venta)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* --- COMPONENTE MODAL DE VISTA --- */}
            <SalesViewModal
                isOpen={isViewModalOpen}
                onRequestClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedSaleId(null); // Limpiar el ID al cerrar
                }}
                saleId={selectedSaleId}
            />
        </div>
    );
};

export default SalesListPage;