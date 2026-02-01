import React, { useState } from 'react';
import { Trash, PlusCircle } from '@phosphor-icons/react';

const Inventory = () => {
    // Estado inicial (Datos de prueba)
    const [items, setItems] = useState([
        { id: 1, name: 'Leche Deslactosada', quantity: 2, unit: 'litros', expiry: '2023-11-20' },
        { id: 2, name: 'Huevos', quantity: 12, unit: 'unidades', expiry: '2023-11-15' },
        { id: 3, name: 'Pechuga de Pollo', quantity: 500, unit: 'gr', expiry: '2023-11-18' },
    ]);

    return (
        <div className="main-content">
            <header>
                <div className="header-title">
                    <h1>📦 Mi Inventario</h1>
                    <p>Gestiona lo que tienes en tu nevera</p>
                </div>
                <button className="btn-primary">
                    <PlusCircle size={20} weight="bold" /> Agregar Producto
                </button>
            </header>

            <div className="calendar-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem' }}>Producto</th>
                            <th>Cantidad</th>
                            <th>Vencimiento</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.name}</td>
                                <td>{item.quantity} {item.unit}</td>
                                <td>
                                    <span style={{ 
                                        backgroundColor: '#FFF4E5', 
                                        color: '#F7B27B', 
                                        padding: '4px 8px', 
                                        borderRadius: '8px',
                                        fontSize: '0.9rem'
                                    }}>
                                        {item.expiry}
                                    </span>
                                </td>
                                <td>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FA7070' }}>
                                        <Trash size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;