import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { jsPDF } from 'jspdf'; 
import './SalesCreatePage.css'; 

const API_URL = 'http://localhost/facturador-api/sales.php'; 

const SalesCreatePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [invoiceItems, setInvoiceItems] = useState([]); 
    const [clientName, setClientName] = useState('');
    const [discount, setDiscount] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    
    // Lógica de Búsqueda
    const fetchProducts = useCallback(async (query) => {
        try {
            const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`); 
            if (!response.ok) {
                throw new Error('Error al buscar productos');
            }
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Error fetching products:", error);
            setSearchResults([]);
        }
    }, []);

    useEffect(() => {
        if (searchTerm.length > 0) {
            fetchProducts(searchTerm);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, fetchProducts]);

    // Lógica de la Factura y Cálculos
    const addItemToInvoice = (product) => {
        const existingItem = invoiceItems.find(item => item.id === product.id);

        if (existingItem) {
            const updatedItems = invoiceItems.map(item => 
                item.id === product.id 
                ? { ...item, cantidad: item.cantidad + 1, precio_venta: item.precio_con_iva || item.precio_neto }
                : item
            );
            setInvoiceItems(updatedItems);
        } else {
            setInvoiceItems([
                ...invoiceItems,
                { 
                    ...product, 
                    cantidad: 1, 
                    precio_venta: product.precio_con_iva || product.precio_neto,
                    codigo: product.codigo, 
                    articulo: product.articulo
                }
            ]);
        }
        setSearchTerm(''); 
        setSearchResults([]); 
    };

    const updateItem = (id, field, value) => {
        setInvoiceItems(prevItems => 
            prevItems.map(item => 
                item.id === id 
                ? { ...item, [field]: value } 
                : item
            )
        );
    };

    const totals = useMemo(() => {
        const subtotal = invoiceItems.reduce((acc, item) => 
            acc + (item.cantidad * item.precio_venta), 0
        );
        const total = subtotal - (subtotal * (discount / 100)); 
        return { subtotal, total: total > 0 ? total : 0 };
    }, [invoiceItems, discount]);

    // --- LÓGICA DE GENERACIÓN DE TICKET PDF CON JSPDF ---
    const generateTicketPDF = (invoiceDetails, ventaId) => {
        const doc = new jsPDF();
        const margin = 10;
        let y = margin;
        const lineHeight = 7;
        const width = doc.internal.pageSize.getWidth();
        const labelX = width - 65; 
        const valueX = width - 15; 

        // 1. Título y Datos de la Empresa/Venta
        doc.setFontSize(18);
        doc.text("TICKET DE VENTA", width / 2, y, { align: "center" });
        y += lineHeight * 2;

        doc.setFontSize(10);
        doc.text("Empresa: FRENAR", margin, y);
        y += lineHeight;
        doc.text(`Venta ID: ${ventaId}`, margin, y);
        y += lineHeight;
        doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, y);
        y += lineHeight;
        doc.text(`Cliente: ${invoiceDetails.clientName || 'Consumidor Final'}`, margin, y);
        y += lineHeight * 2;

        // 2. Encabezados de la Tabla de Productos
        doc.setFontSize(10);
        doc.text("Código", margin, y);
        doc.text("Artículo", margin + 30, y);
        doc.text("Cant.", width - 60, y, { align: "right" });
        doc.text("Precio Unit.", width - 35, y, { align: "right" });
        doc.text("Subtotal", width - margin, y, { align: "right" });
        y += lineHeight;
        doc.setLineWidth(0.5);
        doc.line(margin, y, width - margin, y);
        y += 5;

        // 3. Detalle de Productos
        doc.setFontSize(9);
        invoiceDetails.items.forEach(item => {
            doc.text(String(item.codigo), margin, y);
            doc.text(item.articulo, margin + 30, y);
            doc.text(String(item.cantidad), width - 60, y, { align: "right" });
            doc.text(`$${item.precio_venta.toFixed(2)}`, width - 35, y, { align: "right" });
            doc.text(`$${(item.cantidad * item.precio_venta).toFixed(2)}`, width - margin, y, { align: "right" });
            y += lineHeight;
        });

        y += 5;
        doc.setLineWidth(0.5);
        doc.line(margin, y, width - margin, y);
        y += 5;

        // 4. Totales 
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

        // 5. Pie de página
        doc.setFontSize(10);
        doc.text("¡Gracias por su compra!", width / 2, y, { align: "center" });

        // Guardar el PDF
        doc.save(`ticket_venta_${ventaId}.pdf`);
    };

    // --- LÓGICA DE GUARDADO DE VENTA (POST) ---
    const saveInvoice = async () => {
        if (invoiceItems.length === 0) {
            alert('Agrega al menos un producto a la factura.');
            return;
        }

        setIsLoading(true);

        const payload = {
            items: invoiceItems.map(item => ({
                id: item.id,
                codigo: item.codigo,
                articulo: item.articulo,
                cantidad: item.cantidad,
                precio_venta: item.precio_venta,
            })),
            clientName: clientName,
            discount: discount,
            total_neto: totals.subtotal,
            total_final: totals.total,
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(result.message + ` Venta ID: ${result.venta_id}`);
                generateTicketPDF(payload, result.venta_id);

                setInvoiceItems([]);
                setClientName('');
                setDiscount(0);
                setSearchTerm('');
                setSearchResults([]);
            } else {
                alert(`Error al registrar la venta: ${result.message}`);
                console.error("Server error:", result.message);
            }

        } catch (error) {
            console.error("Error saving invoice:", error);
            alert("Error de conexión al servidor al guardar la venta.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Renderizado de la Interfaz ---
    return (
        <div className="facturador-page">
            <h1>Facturación / Punto de Venta</h1>

            <div className="invoice-header">
                <input
                    type="text"
                    placeholder="Nombre del Cliente (Opcional)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label htmlFor="discount">Descuento:</label>
                    <input
                        type="number"
                        id="discount"
                        placeholder="%"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        style={{ width: '60px' }}
                    />
                    <span>%</span>
                </div>
            </div>

            <div className="search-section">
                <input
                    type="text"
                    placeholder="Buscar producto por código o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <ul className="search-results">
                    {searchResults.map(product => (
                        <li key={product.id} onClick={() => addItemToInvoice(product)}>
                            <strong>{product.codigo}</strong> - {product.articulo} (${product.precio_con_iva || product.precio_neto})
                        </li>
                    ))}
                </ul>
            </div>

            <div className="invoice-body">
                <h2>Detalle de la Venta</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Artículo</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceItems.length === 0 ? (
                            <tr><td colSpan="6">No hay productos en la factura.</td></tr>
                        ) : (
                            invoiceItems.map(item => (
                                <tr key={item.id}>
                                    <td>{item.codigo}</td>
                                    <td>{item.articulo}</td>
                                    <td>
                                        <input 
                                            type="number" 
                                            value={item.cantidad} 
                                            onChange={(e) => updateItem(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                            min="1"
                                            style={{ width: '60px' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={item.precio_venta}
                                            onChange={(e) => updateItem(item.id, 'precio_venta', parseFloat(e.target.value) || 0)}
                                            style={{ width: '80px' }}
                                        />
                                    </td>
                                    <td>${(item.cantidad * item.precio_venta).toFixed(2)}</td>
                                    <td>
                                        <button onClick={() => setInvoiceItems(invoiceItems.filter(i => i.id !== item.id))}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="invoice-footer">
                <div className="totals">
                    <p>Subtotal: <strong>${totals.subtotal.toFixed(2)}</strong></p>
                    <p>Descuento ({discount}%): ${ (totals.subtotal * (discount / 100)).toFixed(2) }</p> 
                    <p>Total a Pagar: <strong>${totals.total.toFixed(2)}</strong></p>
                </div>
                <button onClick={saveInvoice} disabled={invoiceItems.length === 0 || isLoading}>
                    {isLoading ? 'Generando...' : 'Generar Venta'}
                </button>
            </div>
        </div>
    );
};

export default SalesCreatePage;