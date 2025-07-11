import React, { useState } from 'react';
import axios from 'axios';
// Puedes añadir otros imports si los necesitas para el diseño (ej. CSS)

const ProductImportPage = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setMessage('');
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage('Por favor, selecciona un archivo Excel primero.');
            return;
        }

        setIsLoading(true);
        setMessage('Importando productos...');

        const formData = new FormData();
        formData.append('excelFile', file);

        try {
            // Asegúrate de que la URL apunte a tu import.php en XAMPP
            const response = await axios.post('http://localhost/facturador-api/import.php', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage(response.data.message);

        } catch (error) {
            setMessage('Error al importar el archivo: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    // Implementación de Drag and Drop
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setFile(files[0]);
            setMessage('');
        }
    };

    // ----------------------------------------------------
    // Este es el bloque crucial que faltaba para el renderizado:
    // ----------------------------------------------------
    return (
        <div className="import-container">
            <h1>Importar Productos desde Excel</h1>
            <div 
                className="drop-zone" 
                onDragOver={handleDragOver} 
                onDrop={handleDrop}
                style={{
                    border: '2px dashed #ccc',
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#f9f9f9'
                }}
            >
                {file ? (
                    <p>Archivo seleccionado: <strong>{file.name}</strong></p>
                ) : (
                    <p>Arrastra y suelta un archivo Excel aquí, o haz clic para seleccionar.</p>
                )}
                
                <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    id="file-upload"
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', color: 'blue' }}>
                    Seleccionar Archivo
                </label>
            </div>

            <button 
                onClick={handleImport} 
                disabled={!file || isLoading}
                style={{ marginTop: '20px', padding: '10px 20px' }}
            >
                {isLoading ? 'Importando...' : 'Importar Productos'}
            </button>
            
            {message && <p style={{ marginTop: '20px', color: isLoading ? 'blue' : (message.includes('Error') ? 'red' : 'green') }}>
                {message}
            </p>}

            <p style={{ marginTop: '30px' }}>
                **Nota:** El archivo Excel debe tener la estructura esperada: Código, Artículo, Descripción Rubro, Rubro, Marca, Cod. Ml, Precio Neto y Precio IVA.
            </p>
            
            {/* Enlace de descarga de la plantilla */}
            <p>
                Si no tienes la plantilla, puedes descargarla aquí: 
                <a 
                    href="/Template_Productos.xlsx" 
                    download="Template_Productos.xlsx" 
                    style={{ color: 'blue' }}
                >
                    Descargar Plantilla Excel (.xlsx)
                </a>
            </p>

        </div>
    );
};

export default ProductImportPage;