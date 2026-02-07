import React, { useState, useEffect } from 'react';
import '../styles/Content.css';

const Exchanges = ({ onClose }) => {
  const [clients, setClients] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  const [incoming, setIncoming] = useState([]); // el cliente entrega
  const [outgoing, setOutgoing] = useState([]); // el cliente recibe

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const fetchClients = async () => {
    const res = await fetch('https://appthianella-backend.onrender.com/api/clients');
    setClients(await res.json());
  };

  const fetchProducts = async () => {
    const res = await fetch('https://appthianella-backend.onrender.com/api/finishedproducts');
    setAvailableProducts(await res.json());
  };

  const addItem = (setter, list) => {
    setter([...list, { id: Date.now(), product: '', quantity: '' }]);
  };

  const updateItem = (setter, list, id, field, value) => {
    setter(list.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (setter, list, id) => {
    setter(list.filter(i => i.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const client_id = parseInt(e.target.client.value);

    if (!client_id) {
      alert('Selecciona un cliente');
      return;
    }

    const mapItems = arr =>
      arr
        .filter(i => i.product && i.quantity > 0)
        .map(i => ({
          product_id: parseInt(i.product),
          quantity: parseInt(i.quantity)
        }));

    const incomingSend = mapItems(incoming);
    const outgoingSend = mapItems(outgoing);

    if (incomingSend.length === 0 && outgoingSend.length === 0) {
      alert('Agrega productos');
      return;
    }

    try {
      const res = await fetch('https://appthianella-backend.onrender.com/api/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id,
          incoming: incomingSend,
          outgoing: outgoingSend
        })
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Error al guardar cambio');
        return;
      }

      alert('Cambio registrado correctamente');
      setIncoming([]);
      setOutgoing([]);
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
        <h1>Registro de Cambios</h1>

        <h3>Productos que entrega el cliente</h3>
        {incoming.map(p => (
          <div key={p.id} className="formGroup">
            <button type="button" onClick={() => removeItem(setIncoming, incoming, p.id)}>✕</button>

            <select
              value={p.product}
              onChange={e => updateItem(setIncoming, incoming, p.id, 'product', e.target.value)}
            >
              <option value="">Producto...</option>
              {availableProducts.map(prod => (
                <option key={prod.id} value={prod.id}>{prod.name}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Cantidad"
              value={p.quantity}
              onChange={e => updateItem(setIncoming, incoming, p.id, 'quantity', e.target.value)}
            />
          </div>
        ))}

        <button type="button" onClick={() => addItem(setIncoming, incoming)}>
          + Agregar entrega
        </button>

        <h3>Productos que recibe el cliente</h3>
        {outgoing.map(p => (
          <div key={p.id} className="formGroup">
            <button type="button" onClick={() => removeItem(setOutgoing, outgoing, p.id)}>✕</button>

            <select
              value={p.product}
              onChange={e => updateItem(setOutgoing, outgoing, p.id, 'product', e.target.value)}
            >
              <option value="">Producto...</option>
              {availableProducts.map(prod => (
                <option key={prod.id} value={prod.id}>{prod.name}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Cantidad"
              value={p.quantity}
              onChange={e => updateItem(setOutgoing, outgoing, p.id, 'quantity', e.target.value)}
            />
          </div>
        ))}

        <button type="button" onClick={() => addItem(setOutgoing, outgoing)}>
          + Agregar recepción
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

        <button type="submit">Guardar Cambio</button>
      </form>
    </div>
  );
};

export default Exchanges;
