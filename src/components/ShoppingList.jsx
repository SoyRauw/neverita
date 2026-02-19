import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, Circle, Trash } from '@phosphor-icons/react';

const ShoppingList = () => {
    // Estado inicial con cantidades y unidades
    const [items, setItems] = useState([
        { id: 1, name: 'Manzanas', quantity: 1, unit: 'kg', checked: false },
        { id: 2, name: 'Leche', quantity: 2, unit: 'L', checked: true },
        { id: 3, name: 'Arroz', quantity: 1, unit: 'paquetes', checked: false }
    ]);
    
    // Estados para el formulario
    const [newItem, setNewItem] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState('unidades');

    // Opciones de unidades
    const units = ['unidades', 'paquetes', 'g', 'kg', 'ml', 'L'];

    // Función para añadir
    const handleAddItem = (e) => {
        // Se ejecuta si presionan Enter en el teclado, o si hacen clic en el botón
        if ((e.type === 'keydown' && e.key !== 'Enter') || newItem.trim() === '') return;
        
        setItems([...items, { 
            id: Date.now(), 
            name: newItem.trim(), 
            quantity: Number(quantity) || 1, 
            unit: unit,
            checked: false 
        }]);
        
        // Limpiar el formulario después de añadir
        setNewItem('');
        setQuantity(1);
        setUnit('unidades');
    };

    // Función para tachar/destachar
    const toggleCheck = (id) => {
        setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };

    // Función para eliminar
    const deleteItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    return (
        <div className="main-content">
            <header>
                <div className="header-title">
                    <h1>Lista de Compras</h1>
                    <p>Organiza lo que necesitas comprar para la semana.</p>
                </div>
            </header>

            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: '750px' }}>
                
                {/* --- ZONA DE AÑADIR PRODUCTO --- */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '2px solid #F3F4F6', paddingBottom: '20px' }}>
                    <ShoppingCart size={24} color="#FF9F43" weight="bold" />
                    
                    {/* Input del Nombre */}
                    <input 
                        type="text" 
                        placeholder="Ej: Harina Pan, Tomates..." 
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={handleAddItem}
                        style={{ flex: '2', minWidth: '150px', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', fontSize: '1rem', outline: 'none' }}
                    />
                    
                    {/* Input de Cantidad */}
                    <input 
                        type="number" 
                        min="0.1"
                        step="any"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        onKeyDown={handleAddItem}
                        style={{ width: '80px', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', fontSize: '1rem', outline: 'none' }}
                    />
                    
                    {/* Selector de Unidad */}
                    <select 
                        value={unit} 
                        onChange={(e) => setUnit(e.target.value)}
                        style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', fontSize: '1rem', outline: 'none', background: 'white', cursor: 'pointer' }}
                    >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>

                    {/* Botón Añadir */}
                    <button 
                        onClick={handleAddItem}
                        style={{ background: '#FF9F43', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                    >
                        Añadir
                    </button>
                </div>

                {/* --- LISTA DE ELEMENTOS --- */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {items.length === 0 ? (
                        <li style={{ color: '#9CA3AF', textAlign: 'center', padding: '20px' }}>Tu lista está vacía. ¡Añade algo!</li>
                    ) : (
                        items.map(item => (
                            <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F9FAFB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }} onClick={() => toggleCheck(item.id)}>
                                    
                                    {item.checked ? <CheckCircle size={24} color="#10B981" weight="fill" /> : <Circle size={24} color="#D1D5DB" />}
                                    
                                    <span style={{ fontSize: '1.05rem', color: item.checked ? '#9CA3AF' : '#374151', textDecoration: item.checked ? 'line-through' : 'none', transition: 'all 0.2s', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <strong>{item.name}</strong> 
                                        
                                        {/* Etiqueta gris con la cantidad y unidad */}
                                        <span style={{ fontSize: '0.85rem', color: item.checked ? '#D1D5DB' : '#6B7280', background: '#F3F4F6', padding: '4px 10px', borderRadius: '12px', fontWeight: '500' }}>
                                            {item.quantity} {item.unit}
                                        </span>
                                    </span>
                                </div>
                                
                                <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', opacity: 0.7 }}>
                                    <Trash size={20} />
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ShoppingList;