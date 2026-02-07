import React, { useState, useEffect } from 'react';

const LossIncome = ({ onClose }) => {
  const [type, setType] = useState('finished');
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    fetchItems();
  }, [type]);

  const fetchItems = async () => {
    let url = '';

    if (type === 'finished') url = 'https://appthianella-backend.onrender.com/api/finishedproducts';
    if (type === 'raw') url = 'https://appthianella-backend.onrender.com/api/rawmaterials';
    if (type === 'supply') url = 'https://appthianella-backend.onrender.com/api/supplies';
    if (type === 'usable') url = 'https://appthianella-backend.onrender.com/api/usable';

    const res = await fetch(url);
    const data = await res.json();
    setItems(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!itemId || quantity <= 0) {
      alert('Datos inválidos');
      return;
    }

    let url = '';

    if (type === 'finished')
      url = `https://appthianella-backend.onrender.com/api/finishedproducts/${itemId}/stock`;

    if (type === 'raw')
      url = `https://appthianella-backend.onrender.com/api/rawmaterials/${itemId}/stock`;

    if (type === 'supply')
      url = `https://appthianella-backend.onrender.com/api/supplies/${itemId}/stock`;

    if (type === 'usable')
      url = `https://appthianella-backend.onrender.com/api/usable/${itemId}/stock`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: Number(quantity) })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Error');
      return;
    }

    alert('Pérdida registrada');
    setItemId('');
    setQuantity('');
    fetchItems();
    onClose();
  };

  return (
    <div>
      <button onClick={onClose} className="closeButton">✕</button>

      <form className="formGroup" onSubmit={handleSubmit}>
        <label>Tipo</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="finished">Producto terminado</option>
          <option value="raw">Materia prima</option>
          <option value="supply">Insumo</option>
          <option value="usable">Usable</option>
        </select>

        <label>Item</label>
        <select value={itemId} onChange={e => setItemId(e.target.value)}>
          <option value="">Seleccionar...</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>
              {i.name} (Stock: {i.stock})
            </option>
          ))}
        </select>

        <label>Cantidad perdida</label>
        <input
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          min="1"
        />

        <button type="submit">Registrar pérdida</button>
      </form>
    </div>
  );
};

export default LossIncome;
