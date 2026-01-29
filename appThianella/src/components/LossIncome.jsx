import React, { useState, useEffect } from 'react';

const LossIncome = ({ onClose }) => {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:3000/api/finishedproducts');
    const data = await res.json();
    setAvailableProducts(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId || quantity <= 0) {
      alert('Datos inválidos');
      return;
    }

    await fetch(
      `http://localhost:3000/api/finishedproducts/${productId}/stock`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(quantity) })
      }
    );

    fetchProducts();
    onClose();
  };

  return (
    <div>
      <button onClick={onClose} className="closeButton">✕</button>

      <form className="formGroup" onSubmit={handleSubmit}>
        <label>Producto</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {availableProducts.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} (Stock: {p.stock})
            </option>
          ))}
        </select>

        <label>Cantidad</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
        />

        <button type="submit">Registrar pérdida</button>
      </form>
    </div>
  );
};

export default LossIncome;
