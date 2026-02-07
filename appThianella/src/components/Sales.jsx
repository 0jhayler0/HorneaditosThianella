import React, { useState, useEffect } from 'react';
import VerticalMenuLayout from './VerticalMenuLayout';
import CreateClient from './Createclient';
import ClientsList from './ClientsList';
import Returns from './Returns';
import Exchanges from './Exchanges';

import '../styles/Content.css';

const Sales = () => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [paymentType, setPaymentType] = useState('caja_menor');
  const [discount, setDiscount] = useState(0);

  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showClientsList, setShowClientsList] = useState(false);
  const [showReturns, setShowReturns] = useState(false);
  const [showExchanges, setShowExchanges] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchSales();
  }, []);

  const fetchClients = async () => {
    const res = await fetch('http://localhost:3000/api/clients');
    setClients(await res.json());
  };

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:3000/api/finishedproducts');
    setAvailableProducts(await res.json());
  };

  const fetchSales = async () => {
    const res = await fetch('http://localhost:3000/api/sales');
    const data = await res.json();
    setSales(Array.isArray(data) ? data : []);
  };

  const menuItems = [
    { label: 'Ingresar clientes', onClick: () => setShowCreateClient(true) },
    { label: 'Lista de clientes', onClick: () => setShowClientsList(true) },
    { label: 'Devoluciones', onClick: () => setShowReturns(true) },
    { label: 'Cambios', onClick: () => setShowExchanges(true) },
  ];

  const handleAddProduct = () => {
    setProducts([...products, { id: Date.now(), product: '', quantity: '' }]);
  };

  const handleProductChange = (id, field, value) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleRemoveProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const client_id = parseInt(formData.get('client'));
    const mainProduct = parseInt(formData.get('product'));
    const mainQuantity = parseInt(formData.get('quantity'));

    if (!client_id || !mainProduct || !mainQuantity || mainQuantity <= 0) {
      alert('Completa todos los campos');
      return;
    }

    const productsToSend = [
      { product_id: mainProduct, quantity: mainQuantity }
    ];

    products.forEach(p => {
      if (p.product && p.quantity > 0) {
        productsToSend.push({
          product_id: parseInt(p.product),
          quantity: parseInt(p.quantity)
        });
      }
    });

    try {
      const res = await fetch('http://localhost:3000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id,
          products: productsToSend,
          payment_type: paymentType,
          discount
        })
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Error al guardar la venta');
        return;
      }

      alert('Venta guardada correctamente');
      setProducts([]);
      setPaymentType('cash');
      setDiscount(0);
      e.target.reset();
      fetchSales();
      fetchProducts();

    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <div className='content'>
      <div>
        <form className='formGroup' onSubmit={handleSubmit}>
          <h1>INGRESO DE VENTAS</h1>

          <label>Producto</label>
          <select name="product">
            <option value="">Seleccionar...</option>
            {availableProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.stock})
              </option>
            ))}
          </select>

          <input type="number" name="quantity" placeholder="Cantidad" />

          {products.map(p => (
            <div key={p.id}>
              <button type="button" onClick={() => handleRemoveProduct(p.id)}>✕</button>

              <select
                value={p.product}
                onChange={e => handleProductChange(p.id, 'product', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {availableProducts.map(prod => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Cantidad"
                value={p.quantity}
                onChange={e => handleProductChange(p.id, 'quantity', e.target.value)}
              />
            </div>
          ))}

          <button type="button" onClick={handleAddProduct}>
            Agregar Producto
          </button>

          <label>Cliente</label>
          <select name="client">
            <option value="">Seleccionar...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label>Método de pago</label>
          <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
            <option value="credit">Pago a crédito</option>
            <option value="caja_menor">Caja menor (Efectivo)</option>
            <option value="caja_mayor">Caja mayor (Cuenta David)</option>
            <option value="cuenta_bancaria">Cuenta bancaria</option>
          </select>

          <label>Descuento (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
          />

          <button type="submit">Guardar Venta</button>
        </form>
      </div>

      <div className={`createClientPanel ${showCreateClient ? 'visible' : ''}`}>
        <CreateClient onClientCreated={fetchClients} onClose={() => setShowCreateClient(false)} />
      </div>

      <div className={`createClientPanel ${showClientsList ? 'visible' : ''}`}>
        <ClientsList onClose={() => setShowClientsList(false)} />
      </div>

      <div className={`createClientPanel ${showReturns ? 'visible' : ''}`}>
        <Returns onClose={() => setShowReturns(false)} />
      </div>

      <div className={`createClientPanel ${showExchanges ? 'visible' : ''}`}>
        <Exchanges onClose={() => setShowExchanges(false)} />
      </div>
      <VerticalMenuLayout menuItems={menuItems} />

    </div>
  );
};

export default Sales;
