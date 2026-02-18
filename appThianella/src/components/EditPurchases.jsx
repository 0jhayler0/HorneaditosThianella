import React, { useState, useEffect } from 'react';
import '../styles/Content.css';

const EditPurchases = ({ onClose }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [rawMaterials, setRawMaterials] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [usables, setUsables] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesRes, rawRes, suppRes, usableRes] = await Promise.all([
        fetch('https://appthianella-backend.onrender.com/api/purchases'),
        fetch('https://appthianella-backend.onrender.com/api/rawmaterials'),
        fetch('https://appthianella-backend.onrender.com/api/supplies'),
        fetch('https://appthianella-backend.onrender.com/api/usable')
      ]);

      if (!purchasesRes.ok) throw new Error('Error al cargar compras');
      if (!rawRes.ok) throw new Error('Error al cargar materias primas');
      if (!suppRes.ok) throw new Error('Error al cargar insumos');
      if (!usableRes.ok) throw new Error('Error al cargar usables');

      const purchasesData = await purchasesRes.json();
      const rawData = await rawRes.json();
      const suppData = await suppRes.json();
      const usableData = await usableRes.json();

      setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
      setRawMaterials(Array.isArray(rawData) ? rawData : []);
      setSupplies(Array.isArray(suppData) ? suppData : []);
      setUsables(Array.isArray(usableData) ? usableData : []);
    } catch (error) {
      console.error('Error:', error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const getItemName = (type, itemId) => {
    let items = [];
    if (type === 'rawmaterials') {
      items = rawMaterials;
    } else if (type === 'supplies') {
      items = supplies;
    } else if (type === 'usable') {
      items = usables;
    }
    const item = items.find(i => i.id === itemId);
    return item ? item.name : `Item ${itemId}`;
  };

  const filteredPurchases = purchases.filter(purchase =>
    getItemName(purchase.type, purchase.item_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.id.toString().includes(searchTerm)
  );

  const handleEdit = (purchase) => {
    setEditingId(purchase.id);
    setFormData({
      type: purchase.type,
      item_id: purchase.item_id,
      packages: purchase.packages
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'packages' ? parseFloat(value) : value
    }));
  };

  const handleSave = async (id) => {
    try {
      const response = await fetch(
        `https://appthianella-backend.onrender.com/api/purchases/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        fetchData();
        setEditingId(null);
        alert('Compra actualizada correctamente');
      } else {
        alert('Error al actualizar compra');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar compra');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta compra? Esto revertirá el stock.')) {
      try {
        const response = await fetch(
          `https://appthianella-backend.onrender.com/api/purchases/${id}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          fetchData();
          alert('Compra eliminada correctamente');
        } else {
          alert('Error al eliminar compra');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar compra');
      }
    }
  };

  if (loading) return <div><p>Cargando compras...</p></div>;

  return (
    <div className='content'>
      <button onClick={onClose} className='closeButton' title='Cerrar'>
        ✕
      </button>

      <div style={{ padding: '20px' }}>
        <h2>EDITAR COMPRAS</h2>

        <input
          type='text'
          placeholder='Buscar por item o ID...'
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
              <th>Tipo</th>
              <th>Artículo</th>
              <th>Cantidad (paquetes)</th>
              <th>Costo Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map(purchase => (
              <tr key={purchase.id} style={{ borderBottom: '1px solid #ddd' }}>
                {editingId === purchase.id ? (
                  <>
                    <td>{purchase.id}</td>
                    <td>
                      <select
                        name='type'
                        value={formData.type}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      >
                        <option value='rawmaterials'>Materia Prima</option>
                        <option value='supplies'>Insumo</option>
                        <option value='usable'>Usable</option>
                      </select>
                    </td>
                    <td>
                      <select
                        name='item_id'
                        value={formData.item_id}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                      >
                        <option value=''>Seleccionar...</option>
                        {formData.type === 'rawmaterials'
                          ? rawMaterials.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))
                          : formData.type === 'supplies'
                            ? supplies.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))
                            : usables.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type='number'
                        name='packages'
                        value={formData.packages}
                        onChange={handleChange}
                        step='1'
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>${purchase.total_cost.toFixed(2)}</td>
                    <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className='saveButton'
                        onClick={() => handleSave(purchase.id)}
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
                    <td>{purchase.id}</td>
                    <td>{purchase.type}</td>
                    <td>{getItemName(purchase.type, purchase.item_id)}</td>
                    <td>{purchase.packages}</td>
                    <td>${purchase.total_cost.toFixed(2)}</td>
                    <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className='editButton'
                        onClick={() => handleEdit(purchase)}
                        style={{ marginRight: '5px' }}
                      >
                        Editar
                      </button>
                      <button
                        className='deleteButton'
                        onClick={() => handleDelete(purchase.id)}
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

export default EditPurchases;
