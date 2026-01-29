import React, { useState, useEffect } from 'react';
import '../styles/Content.css';

const Returns = ({ onClose }) => {
  const [clients, setClients] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const fetchClients = async () => {
    const res = await fetch('http://localhost:3000/api/clients');
    setClients(await res.json());
  };

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:3000/api/finishedproducts');
    setAvailableProducts(await res.json());
  };

  const addProduct = () => {
    setProducts([...products, { id: Date.now(), product: '', quantity: '' }]);
  };

  const updateProduct = (id, field, value) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removeProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const client_id = parseInt(formData.get('client'));

    if (!client_id || products.length === 0) {
      alert('Completa cliente y productos');
      return;
    }

    const productsToSend = products
      .filter(p => p.product && p.quantity > 0)
      .map(p => ({
        product_id: parseInt(p.product),
        quantity: parseInt(p.quantity)
      }));

    if (productsToSend.length === 0) {
      alert('Productos inválidos');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id,
          products: productsToSend
        })
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Error al guardar devolución');
        return;
      }

      alert('Devolución registrada');
      setProducts([]);
      e.target.reset();

    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <div>
      <button onClick={onClose} className="closeButton">✕</button>

      <form onSubmit={handleSubmit}>
        <h1>Ingreso de devoluciones</h1>

        {products.map(p => (
          <div key={p.id} className="formGroup">
            <button type="button" onClick={() => removeProduct(p.id)}>✕</button>

            <select
              value={p.product}
              onChange={e => updateProduct(p.id, 'product', e.target.value)}
            >
              <option value="">Producto...</option>
              {availableProducts.map(prod => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Cantidad"
              value={p.quantity}
              onChange={e => updateProduct(p.id, 'quantity', e.target.value)}
            />
          </div>
        ))}

        <button type="button" onClick={addProduct}>
          Agregar producto
        </button>

        <div className="formGroup">
          <label>Cliente</label>
          <select name="client">
            <option value="">Seleccionar...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button type="submit">Guardar devolución</button>
      </form>
    </div>
  );
};

export default Returns;
