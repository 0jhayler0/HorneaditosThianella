import React, { useState, useEffect } from 'react';
import VerticalMenuLayout from './VerticalMenuLayout';
import CreateRecipes from './CreateRecipes'
import '../styles/Content.css';

const DailyProduction = () => {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showCreateRecipes, setShowCreateRecipes] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('https://appthianella-backend.onrender.com/api/finishedproducts');
      const data = await res.json();

      // 🔹 Agregar Masa Madre como opción virtual
      const masaMadreOption = {
        id: 'masa_madre',
        name: 'Masa Madre'
      };

      setAvailableProducts([masaMadreOption, ...data]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qty = parseInt(quantity) || 0;

    if (!productId || qty <= 0) {
      alert('Completa todos los campos');
      return;
    }

    try {
      let body;

      // 🔹 Si eligió Masa Madre
      if (productId === 'masa_madre') {
        body = {
          masa_madre: qty
        };
      } else {
        body = {
          finishedproduct_id: parseInt(productId),
          quantity: qty,
          masa_madre: 0
        };
      }

      const res = await fetch('https://appthianella-backend.onrender.com/api/dailyproduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar producción');
      }

      alert('Producción registrada correctamente');

      setProductId('');
      setQuantity('');

    } catch (err) {
      alert(err.message);
    }
  };

  const menuItems = [
    { label: 'Crear nueva receta', onClick: () => setShowCreateRecipes(true) }
  ];

  return (
    <div>
      <div className="content">
        <form onSubmit={handleSubmit}>
          <h1>PRODUCCIÓN DIARIA</h1>

          <div className="formGroup">
            <label>Producto</label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="formGroup">
            <label>
              {productId === 'masa_madre'
                ? 'Cantidad de Masa Madre (unidades)'
                : 'Cantidad producida'}
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />
          </div>

          <button type="submit">Registrar Producción</button>
        </form>

        <div className={`createClientPanel ${showCreateRecipes ? 'visible' : ''}`}>
          <CreateRecipes onClose={() => setShowCreateRecipes(false)} />
        </div>
      </div>
      <VerticalMenuLayout menuItems={menuItems} />

    </div>
  );
};

export default DailyProduction;
