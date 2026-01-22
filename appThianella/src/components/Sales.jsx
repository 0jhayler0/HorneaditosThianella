import React, { useState, useEffect } from 'react'
import VerticalMenuLayout from './VerticalMenuLayout';
import CreateClient from './Createclient';
import ClientsList from './ClientsList';

import '../styles/Content.css';

const Sales = () => {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showClientsList, setShowClientsList] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/clients');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);
  
  const menuItems = [
    { label: 'Ingresar clientes', onClick: () => setShowCreateClient(true) },
    { label: 'Lista de clientes', onClick: () => setShowClientsList(true) },
    { label: 'Historial de Ventas', onClick: () => {} },
    { label: 'Reportes', onClick: () => {} }
  ];

  const productOptions = [
    { value: 'pandequesox10', label: 'Pandequeso x10' },
    { value: 'pandequesox5', label: 'Pandequeso x5' },
    { value: 'palitos', label: 'Palitos' },
    { value: 'trocitos', label: 'Trocitos' }
  ];

  const handleAddProduct = () => {
    setProducts([...products, { id: Date.now(), product: '', quantity: '' }]);
  };

  const handleProductChange = (id, field, value) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleRemoveProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleClientCreated = (newClient) => {
    console.log('Nuevo cliente creado:', newClient);
    setShowCreateClient(false);
  };

  return (
    <div>
      <VerticalMenuLayout menuItems={menuItems}/>
      <div className='content'>
        <form onSubmit={(e) => e.preventDefault()}>
          <h1>Ingreso de ventas</h1>

          {/* Primer producto */}
          <div className='formGroup'>
            <label htmlFor="product">Producto:</label>
            <select name="product" id="product">
              <option value="">Seleccionar...</option>
              {productOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className='formGroup'>
            <input type="number" placeholder='Cantidad'/>
          </div>


          {/* Productos dinámicos agregados */}
          {products.map((product) => (
            <React.Fragment key={product.id}>
              <button 
                className='closeButton' 
                type="button" 
                onClick={() => handleRemoveProduct(product.id)} 
                title="Eliminar producto"
                style={{ marginBottom: '-35px' }}
              >
                ✕
              </button>

              <div className='formGroup'>
                <label>Producto:</label>
                <select 
                  value={product.product}
                  onChange={(e) => handleProductChange(product.id, 'product', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {productOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className='formGroup'>
                <input 
                  type="number" 
                  placeholder='Cantidad'
                  value={product.quantity}
                  onChange={(e) => handleProductChange(product.id, 'quantity', e.target.value)}
                />
              </div>
            </React.Fragment>
          ))}

          <button type="button" onClick={handleAddProduct}>Agregar Productos</button>

          <div className='formGroup'>
            <label htmlFor="client">Cliente:</label>
            <select name="client" id="client">
              <option value="">Seleccionar...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <button type="submit">Guardar Venta</button>
        </form>

      </div>
      
      {/* Panel Create Client */}
      <div className={`createClientPanel ${showCreateClient ? 'visible' : ''}`}>

        <CreateClient onClientCreated={handleClientCreated} onClose={() => setShowCreateClient(false)} />
      </div>

      {/* Panel Clients List */}
      <div className={`createClientPanel ${showClientsList ? 'visible' : ''}`}>
        <ClientsList onClose={() => setShowClientsList(false)} />
      </div>
    </div>
  )
}

export default Sales
