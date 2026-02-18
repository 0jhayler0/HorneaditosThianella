import React, { useState, useEffect } from 'react';
import '../styles/Content.css';

const EditClients = ({ onClose }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('https://appthianella-backend.onrender.com/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document.includes(searchTerm)
  );

  const handleEdit = (client) => {
    setEditingId(client.id);
    setFormData({ ...client });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (id) => {
    // No enviar currentdbt - es calculado automáticamente
    const { currentdbt, ...dataToSave } = formData;
    
    try {
      const response = await fetch(
        `https://appthianella-backend.onrender.com/api/clients/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        }
      );

      if (response.ok) {
        fetchClients();
        setEditingId(null);
        alert('Cliente actualizado correctamente');
      } else {
        alert('Error al actualizar cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar cliente');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        const response = await fetch(
          `https://appthianella-backend.onrender.com/api/clients/${id}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          fetchClients();
          alert('Cliente eliminado correctamente');
        } else {
          alert('Error al eliminar cliente');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar cliente');
      }
    }
  };

  if (loading) return <div><p>Cargando clientes...</p></div>;

  return (
    <div className='content'>
      <button
        onClick={onClose}
        className='closeButton'
        title='Cerrar'
      >
        ✕
      </button>

      <div style={{ padding: '20px' }}>
        <h2>EDITAR CLIENTES</h2>
        
        <input
          type='text'
          placeholder='Buscar por nombre o documento...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />

        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Dirección</th>
              <th>Ciudad</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Deuda</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id}>
                {editingId === client.id ? (
                  <>
                    <td>
                      <input
                        type='text'
                        name='name'
                        value={formData.name || ''}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        name='document'
                        value={formData.document || ''}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        name='addres'
                        value={formData.addres || ''}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        name='city'
                        value={formData.city || ''}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        name='tel'
                        value={formData.tel || ''}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type='email'
                        name='email'
                        value={formData.email || ''}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <span>${formData.currentdbt || 0}</span>
                      <small style={{ display: 'block', color: '#666' }}>No editable</small>
                    </td>
                    <td>
                      <button
                        className='saveButton'
                        onClick={() => handleSave(client.id)}
                        style={{ marginRight: '5px' }}
                      >
                        Guardar
                      </button>
                      <button
                        className='cancelButton'
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{client.name}</td>
                    <td>{client.document}</td>
                    <td>{client.addres}</td>
                    <td>{client.city}</td>
                    <td>{client.tel}</td>
                    <td>{client.email}</td>
                    <td>${client.currentdbt || 0}</td>
                    <td>
                      <button
                        className='editButton'
                        onClick={() => handleEdit(client)}
                        style={{ marginRight: '5px' }}
                      >
                        Editar
                      </button>
                      <button
                        className='deleteButton'
                        onClick={() => handleDelete(client.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EditClients;
