import React, { useState, useEffect } from 'react'
import VerticalMenuLayout from './VerticalMenuLayout';
import CreateClient from './Createclient';
import ClientsList from './ClientsList';

import '../styles/Content.css';

const Sales = () => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showClientsList, setShowClientsList] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchSales();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/finishedproducts');
      const data = await res.json();
      setAvailableProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/sales');
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error(err);
    }
  };

  

  const menuItems = [
    { label: 'Ingresar clientes', onClick: () => setShowCreateClient(true) },
    { label: 'Lista de clientes', onClick: () => setShowClientsList(true) },
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

  const handleClientCreated = () => {
    setShowCreateClient(false);
    fetchClients();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const client_id = formData.get('client');
    const mainProduct = formData.get('product');
    const mainQuantity = parseInt(formData.get('quantity'));

    if (!client_id || !mainProduct || !mainQuantity || mainQuantity <= 0) {
      alert('Completa todos los campos');
      return;
    }

    const productsToSend = [
      { product_id: parseInt(mainProduct), quantity: mainQuantity }
    ];

    products.forEach(p => {
      if (p.product && p.quantity && p.quantity > 0) {
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
          client_id: parseInt(client_id),
          products: productsToSend
        })
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Error al guardar la venta');
        return;
      }

      alert('Venta guardada correctamente');
      setProducts([]);
      e.target.reset();

    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <div>
      <VerticalMenuLayout menuItems={menuItems} />

      <div className="content">
        <form onSubmit={handleSubmit}>
          <h1>INGRESO DE VENTAS</h1>

          <div className="formGroup">
            <label>Producto</label>
            <select name="product">
              <option value="">Seleccionar...</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="formGroup">
            <input type="number" name="quantity" placeholder="Cantidad" />
          </div>

          {products.map(p => (
            <React.Fragment key={p.id}>
              <button
                type="button"
                className="closeButton"
                onClick={() => handleRemoveProduct(p.id)}
              >
                ✕
              </button>

              <div className="formGroup">
                <select
                  value={p.product}
                  onChange={e =>
                    handleProductChange(p.id, 'product', e.target.value)
                  }
                >
                  <option value="">Seleccionar...</option>
                  {availableProducts.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={p.quantity}
                  onChange={e =>
                    handleProductChange(p.id, 'quantity', e.target.value)
                  }
                />
              </div>
            </React.Fragment>
          ))}

          <button type="button" onClick={handleAddProduct}>
            Agregar Producto
          </button>

          <div className="formGroup">
            <label>Cliente</label>
            <select name="client">
              <option value="">Seleccionar...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit">Guardar Venta</button>
        </form>
      </div>
      
      <table>
          <thead>
            <tr>
              <th colSpan={4} className='tableTittle'>Historial de ventas</th>
            </tr>
            <tr>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Total</th>
              <th>fecha</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.client_name}</td>
                <td>
                  <ul>
                    {sale.products.map((prod, i) => (
                      <li key={i}>
                        {prod.name} - Cantidad: {prod.quantity}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>${sale.total_amount}</td>
                <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      

      <div className={`createClientPanel ${showCreateClient ? 'visible' : ''}`}>
        <CreateClient onClientCreated={handleClientCreated} onClose={() => setShowCreateClient(false)}/>
      </div>

      <div className={`createClientPanel ${showClientsList ? 'visible' : ''}`}>
        <ClientsList  onClose={() => setShowClientsList(false)}/>
      </div>
    </div>
  );
};

export default Sales;
