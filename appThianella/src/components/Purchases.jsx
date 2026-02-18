import React, { useEffect, useState } from 'react';
import VerticalMenuLayout from './VerticalMenuLayout';
import EditPurchases from './EditPurchases';

import '../styles/Content.css';

const Purchases = () => {
  const [type, setType] = useState('');
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState('');
  const [packagesQty, setPackagesQty] = useState('');
  const [unitCost, setUnitCost] = useState(0);
  const [showEditPurchases, setShowEditPurchases] = useState(false);

  useEffect(() => {
    if (!type) return;

    fetch(`https://appthianella-backend.onrender.com/api/purchases/items/${type}`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err));
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!type || !itemId || !packagesQty || packagesQty <= 0) {
      alert('Completa todos los campos');
      return;
    }

    try {
      const res = await fetch('https://appthianella-backend.onrender.com/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          item_id: parseInt(itemId),
          packages_qty: parseFloat(packagesQty)
        })
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Error al registrar compra');
        return;
      }

      alert('Compra registrada correctamente');
      setType('');
      setItemId('');
      setPackagesQty('');
      setUnitCost(0);
      setItems([]);

    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const menuItems = [
    { label: '✏️ Editar compras', onClick: () => setShowEditPurchases(true) }
  ];

  return (
    <div>
      <div className='content'>

      <form className='formGroup' onSubmit={handleSubmit}>

        <div className="formGroup">
          <h1>INGRESO DE COMPRAS</h1>
          <label>Tipo</label>
          <select
            value={type}
            onChange={e => {
              setType(e.target.value);
              setItemId('');
              setUnitCost(0);
            }}
          >
            <option value="">Seleccionar...</option>
            <option value="rawmaterials">Materia prima</option>
            <option value="supplies">Insumos</option>
            <option value="usable">Usables</option>
          </select>
        </div>

        {type && (
          <div className="formGroup">
            <label>Producto</label>
            <select
              value={itemId}
              onChange={e => {
                const id = e.target.value;
                setItemId(id);

                const selected = items.find(i => i.id === parseInt(id));
                if (selected) {
                  setUnitCost(selected.price || 0);
                }
              }}
            >
              <option value="">Seleccionar...</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {itemId && (
          <>
            <div className="formGroup">
              <label>Precio unitario (BD)</label>
              <input
                type="number"
                value={unitCost}
                readOnly
              />
            </div>

            <div className="formGroup">
              <label>Cantidad de paquetes</label>
              <input
                type="number"
                step="0.01"
                value={packagesQty}
                onChange={e => setPackagesQty(e.target.value)}
              />
            </div>

            <button type="submit">Guardar compra</button>
          </>
        )}

      </form>
      </div>

      <div className={`createClientPanel ${showEditPurchases ? 'visible' : ''}`}>
        <EditPurchases onClose={() => setShowEditPurchases(false)} />
      </div>

      <VerticalMenuLayout menuItems={menuItems} />
    </div>
  );
};

export default Purchases;
