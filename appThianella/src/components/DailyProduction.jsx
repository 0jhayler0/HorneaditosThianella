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
      const res = await fetch('http://localhost:3000/api/finishedproducts');
      const data = await res.json();
      setAvailableProducts(data);
    } catch (err) {
      console.error(err);
    }
  };                                                            

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId || quantity <= 0) {
      alert('Completa todos los campos');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/dailyproduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finishedproduct_id: parseInt(productId),
          quantity: parseInt(quantity)
        })
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
      <VerticalMenuLayout menuItems={menuItems} />

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
            <label>Cantidad producida</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />
          </div>

          <button type="submit">Registrar Producción</button>
        </form>
        <div  className={`createClientPanel ${showCreateRecipes ? 'visible' : ''}`}>
              <CreateRecipes onClose={() => setShowCreateRecipes(false)} />
        </div>
      </div>
    </div>
  );
};

export default DailyProduction;
