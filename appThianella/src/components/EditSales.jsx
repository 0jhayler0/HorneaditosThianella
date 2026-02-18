import React, { useState, useEffect } from 'react';
import '../styles/Content.css';

const EditSales = ({ onClose }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('https://appthianella-backend.onrender.com/api/sales');
      const data = await response.json();
      setSales(Array.isArray(data) ? data : data?.value || []);
    } catch (error) {
      console.error('Error:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toString().includes(searchTerm)
  );

  const handleEdit = (sale) => {
    setEditingId(sale.id);
    setFormData({
      discount: sale.discount || 0,
      payment_type: sale.payment_type || 'caja_menor'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discount' ? parseFloat(value) : value
    }));
  };

  const handleSave = async (id) => {
    // Validar descuento
    if (formData.discount < 0 || formData.discount > 100) {
      alert('El descuento debe estar entre 0 y 100%');
      return;
    }

    try {
      const response = await fetch(
        `https://appthianella-backend.onrender.com/api/sales/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        fetchSales();
        setEditingId(null);
        alert('Venta actualizada correctamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo actualizar la venta'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta venta? Esto restaurará el stock.')) {
      try {
        const response = await fetch(
          `https://appthianella-backend.onrender.com/api/sales/${id}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          fetchSales();
          alert('Venta eliminada correctamente');
        } else {
          alert('Error al eliminar venta');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar venta');
      }
    }
  };

  if (loading) return <div><p>Cargando ventas...</p></div>;

  if (sales.length === 0) {
    return (
      <div className='content'>
        <button onClick={onClose} className='closeButton' title='Cerrar'>
          ✕
        </button>
        <div style={{ padding: '20px' }}>
          <h2>EDITAR VENTAS</h2>
          <p style={{ color: '#666', fontSize: '16px' }}>No hay ventas registradas. Crea una nueva venta primero.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='content'>
      <button onClick={onClose} className='closeButton' title='Cerrar'>
        ✕
      </button>

      <div style={{ padding: '20px' }}>
        <h2>EDITAR VENTAS</h2>

        <input
          type='text'
          placeholder='Buscar por cliente o ID...'
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

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Descuento (%)</th>
              <th>Tipo de Pago</th>
              <th>Productos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.id} style={{ borderBottom: '1px solid #ddd' }}>
                {editingId === sale.id ? (
                  <>
                    <td>{sale.id}</td>
                    <td>{sale.client_name}</td>
                    <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td>${sale.total_amount.toFixed(2)}</td>
                    <td>
                      <input
                        type='number'
                        name='discount'
                        value={formData.discount}
                        onChange={handleChange}
                        min='0'
                        max='100'
                        step='0.1'
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <select
                        name='payment_type'
                        value={formData.payment_type}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      >
                        <option value='credit'>Crédito</option>
                        <option value='caja_menor'>Caja Menor</option>
                        <option value='caja_mayor'>Caja Mayor</option>
                        <option value='cuenta_bancaria'>Cuenta Bancaria</option>
                      </select>
                    </td>
                    <td>
                      {sale.products.map(p => `${p.name} (${p.quantity})`).join(', ')}
                    </td>
                    <td>
                      <button
                        className='saveButton'
                        onClick={() => handleSave(sale.id)}
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
                    <td>{sale.id}</td>
                    <td>{sale.client_name}</td>
                    <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td>${sale.total_amount.toFixed(2)}</td>
                    <td>{sale.discount || 0}%</td>
                    <td>{sale.payment_type}</td>
                    <td>
                      {sale.products.map(p => `${p.name} (${p.quantity})`).join(', ')}
                    </td>
                    <td>
                      <button
                        className='editButton'
                        onClick={() => handleEdit(sale)}
                        style={{ marginRight: '5px' }}
                      >
                        Editar
                      </button>
                      <button
                        className='deleteButton'
                        onClick={() => handleDelete(sale.id)}
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

export default EditSales;
