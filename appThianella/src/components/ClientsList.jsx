import React, { useState, useEffect } from "react";
import '../styles/Content.css';

const ClientsList = ({ onClose }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/clients');
      if (!response.ok) {
        throw new Error('Error al obtener clientes');
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div><p>Cargando clientes...</p></div>;
  if (error) return <div><p style={{ color: 'red' }}>Error: {error}</p></div>;

  return (
    <div className="content">
      <button
        onClick={onClose}
        className='closeButton'
        title="Cerrar"
      >
        ✕
      </button>
      <div style={{ padding: '20px' }}>
      <table>
        <thead>
          <tr>
            <th colSpan={8} className='tableTittle'>
              LISTA DE CLIENTES
            </th>
          </tr>
          <tr>
            <th>Nombre</th>
            <th>Nit / Cedula</th>
            <th>Direccion</th>
            <th>Ciudad</th>
            <th>Telefono</th>
            <th>Correo Electronico</th>
            <th>Ultima Compra</th>
            <th>Deuda actual</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td>
                No hay clientes registrados
              </td>
            </tr>
          ) : (
            clients.map(client => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.document}</td>
                <td>{client.addres}</td>
                <td>{client.city}</td>
                <td>{client.tel}</td>
                <td>{client.email}</td>
                <td>{new Date(client.lastpurchase).toLocaleDateString()}</td>
                <td>${client.currentdbt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}

export default ClientsList
