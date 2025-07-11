import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { jsPDF } from 'jspdf'; 
import { useParams, useNavigate } from 'react-router-dom'; // Usamos useParams para leer el ID y useNavigate para redirigir
import './SalesCreatePage.css'; // Usaremos el mismo CSS si aplica

const API_URL = 'http://localhost/facturador-api/sales.php'; 

const SalesEditPage = () => {
    // Obtenemos el ID de la venta desde la URL
    const { ventaId } = useParams();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [invoiceItems, setInvoiceItems] = useState([]); 
    const [clientName, setClientName] = useState('');
    const [discount, setDiscount] = useState(0); 
    const [isLoading, setIsLoading] = useState(true); // Empezamos cargando
    const [pageError, setPageError] = useState(null);

    // -----------------------------------------------------------
    // --- LÓGICA DE CARGA DE DATOS DE LA VENTA EXISTENTE ---
    // -----------------------------------------------------------
    useEffect(() => {
        const fetchSaleDetails = async () => {
            setIsLoading(true);
            setPageError(null);
            
            try {
                // Hacemos un GET a sales.php?id=X
                const response = await fetch(`${API_URL}?id=${ventaId}`);
                
                if (!response.ok) {
                    throw new Error('Venta no encontrada o error de conexión.');
                }
                
                const data = await response.json();

                // Asegúrate de que el backend devuelve 'items' y no un mensaje de error
                if (!data || !Array.isArray(data.items)) {
                    throw new Error('Datos de venta incompletos o inválidos del servidor.');
                }

                // Mapeamos los datos de la API a nuestro estado de React
                setClientName(data.client_name || '');
                setDiscount(data.discount || 0);

                // Mapeamos los items de detalle_venta (dv) al formato esperado por invoiceItems
                // NOTA: Asumimos que el backend ya fue corregido para devolver 'codigo' y 'articulo'
                const loadedItems = data.items.map(item => ({
                    id: item.id, // producto_id
                    codigo: item.codigo,
                    articulo: item.articulo,
                    cantidad: item.cantidad,
                    // Usamos precio_unitario del detalle como precio_venta
                    precio_venta: parseFloat(item.precio_unitario), 
                }));
                setInvoiceItems(loadedItems);
                
            } catch (error) {
                setPageError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (ventaId) {
            fetchSaleDetails();
        } else {
            setPageError('ID de venta no válido.');
            setIsLoading(false);
        }
    }, [ventaId]);

    // -----------------------------------------------------------
    // --- LÓGICA DE BÚSQUEDA Y GESTIÓN DE ITEMS (Igual que CreatePage) ---
    // -----------------------------------------------------------
    
    // Lógica de Búsqueda
    const fetchProducts = useCallback(async (query) => {
        // ... (Tu código de fetchProducts) ...
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

    // Añadir/Actualizar items
    const addItemToInvoice = (product) => {
        // ... (Tu código de addItemToInvoice) ...
        const existingItem = invoiceItems.find(item => item.id === product.id);

        if (existingItem) {
            const updatedItems = invoiceItems.map(item => 
                item.id === product.id 
                ? { ...item, cantidad: item.cantidad + 1, precio_venta: product.precio_con_iva || product.precio_neto }
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
        // ... (Tu código de updateItem) ...
        setInvoiceItems(prevItems => 
            prevItems.map(item => 
                item.id === id 
                ? { ...item, [field]: value } 
                : item
            )
        );
    };

    // Cálculos de totales
    const totals = useMemo(() => {
        // ... (Tu código de totals) ...
        const subtotal = invoiceItems.reduce((acc, item) => 
            acc + (item.cantidad * item.precio_venta), 0
        );
        const total = subtotal - (subtotal * (discount / 100)); 
        return { subtotal, total: total > 0 ? total : 0 };
    }, [invoiceItems, discount]);

    // -----------------------------------------------------------
    // --- LÓGICA DE ACTUALIZACIÓN (PUT) Y GENERACIÓN DE PDF ---
    // -----------------------------------------------------------

    const generateTicketPDF = (invoiceDetails, ventaId) => {
        // ... (Tu código de generateTicketPDF) ...
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

    // Lógica para guardar la venta (PUT)
    const updateInvoice = async () => {
        if (invoiceItems.length === 0) {
            alert('Agrega al menos un producto a la factura.');
            return;
        }

        setIsLoading(true);

        // Preparamos el payload para la solicitud PUT
        const payload = {
            id_venta: ventaId, // El ID de la venta que estamos editando
            items: invoiceItems.map(item => ({
                id: item.id, // ID del producto
                cantidad: item.cantidad,
                precio_venta: item.precio_venta,
                subtotal: (item.cantidad * item.precio_venta).toFixed(2), 
            })),
            clientName: clientName,
            discount: discount,
            total_neto: totals.subtotal.toFixed(2),
            total_final: totals.total.toFixed(2),
        };

        try {
            const response = await fetch(API_URL, {
                method: 'PUT', // Usamos el método PUT
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(result.message);
                
                // Generamos el PDF con los datos actualizados
                generateTicketPDF(payload, ventaId);

                // Opcional: Navegar de vuelta a la lista de ventas después de actualizar
                navigate('/sales'); 
                
            } else {
                alert(`Error al actualizar la venta: ${result.message}`);
                console.error("Server error:", result.message);
            }

        } catch (error) {
            console.error("Error updating invoice:", error);
            alert("Error de conexión al servidor al actualizar la venta.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Renderizado de la Interfaz ---
    if (isLoading && !pageError) {
        return <div className="facturador-page loading">Cargando venta #{ventaId} para edición...</div>;
    }

    if (pageError) {
        return <div className="facturador-page error">Error: {pageError}</div>;
    }

    return (
        <div className="facturador-page">
            <h1>Editar Venta #{ventaId}</h1>

            <div className="invoice-header">
                <input
                    type="text"
                    placeholder="Nombre del Cliente (Opcional)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                />
                {/* Bloque de Descuento */}
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

            {/* Sección de Búsqueda para añadir más productos a la venta existente */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Buscar producto para añadir..."
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

            {/* Detalle de la Venta (Formulario de Edición) */}
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

            {/* Totales y Botón de Actualizar */}
            <div className="invoice-footer">
                <div className="totals">
                    <p>Subtotal: <strong>${totals.subtotal.toFixed(2)}</strong></p>
                    <p>Descuento ({discount}%): ${ (totals.subtotal * (discount / 100)).toFixed(2) }</p> 
                    <p>Total a Pagar: <strong>${totals.total.toFixed(2)}</strong></p>
                </div>
                <button onClick={updateInvoice} disabled={invoiceItems.length === 0 || isLoading}>
                    {isLoading ? 'Actualizando...' : 'Actualizar Venta'}
                </button>
            </div>
        </div>
    );
};

export default SalesEditPage;