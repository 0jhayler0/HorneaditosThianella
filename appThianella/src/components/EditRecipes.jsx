import React, { useState, useEffect } from 'react';
import '../styles/Content.css';

const EditRecipes = ({ onClose }) => {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [items, setItems] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [supplies, setSupplies] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, rawMaterials_res, supplies_res] = await Promise.all([
        fetch('https://appthianella-backend.onrender.com/api/finishedproducts'),
        fetch('https://appthianella-backend.onrender.com/api/rawmaterials'),
        fetch('https://appthianella-backend.onrender.com/api/supplies')
      ]);

      const productsData = await productsRes.json();
      const rawData = await rawMaterials_res.json();
      const suppliesData = await supplies_res.json();

      setProducts(productsData);
      setRawMaterials(rawData);
      setSupplies(suppliesData);

      // Cargar las recetas existentes
      const recipesMap = {};
      for (const product of productsData) {
        try {
          const recipeRes = await fetch(
            `https://appthianella-backend.onrender.com/api/recipes/${product.id}`
          );
          const recipeData = await recipeRes.json();
          if (recipeData) {
            recipesMap[product.id] = recipeData;
          }
        } catch (e) {
          // Recipe doesn't exist yet
        }
      }
      setRecipes(recipesMap);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    const recipe = recipes[product.id];
    if (recipe) {
      setItems(recipe.items || []);
    } else {
      setItems([]);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { item_type: 'rawmaterial', item_id: '', quantity_per_unit: 0 }
    ]);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'item_id' || field === 'item_type' ? value : parseFloat(value);
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!selectedProduct || items.length === 0) {
      alert('Por favor selecciona un producto e ingredientes');
      return;
    }

    // Validar que todos los ingredientes tengan datos completos
    const validItems = items.filter(item => item.item_id && item.quantity_per_unit > 0);
    
    if (validItems.length === 0) {
      alert('Por favor completa todos los ingredientes con cantidad > 0');
      return;
    }

    // Validar que no haya ingredientes duplicados
    const itemIds = validItems.map(item => `${item.item_type}-${item.item_id}`);
    const uniqueIds = new Set(itemIds);
    if (itemIds.length !== uniqueIds.size) {
      alert('No puedes agregar el mismo ingrediente dos veces');
      return;
    }

    try {
      const response = await fetch('https://appthianella-backend.onrender.com/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finishedproductid: selectedProduct.id,
          items: validItems
        })
      });

      if (response.ok) {
        await fetchData();
        alert('Receta guardada correctamente');
      } else {
        alert('Error al guardar receta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar receta');
    }
  };

  const handleDeleteRecipe = async (productId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta receta?')) {
      try {
        const response = await fetch(
          `https://appthianella-backend.onrender.com/api/recipes/${productId}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          await fetchData();
          setSelectedProduct(null);
          setItems([]);
          alert('Receta eliminada correctamente');
        } else {
          alert('Error al eliminar receta');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar receta');
      }
    }
  };

  if (loading) return <div><p>Cargando recetas...</p></div>;

  return (
    <div className='content'>
      <button onClick={onClose} className='closeButton' title='Cerrar'>
        ✕
      </button>

      <div style={{ padding: '20px' }}>
        <h2>EDITAR RECETAS</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Productos */}
          <div>
            <h3>Productos Terminados</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc' }}>
              {products.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    backgroundColor: selectedProduct?.id === product.id ? '#007bff' : '#f5f5f5',
                    color: selectedProduct?.id === product.id ? 'white' : 'black',
                    borderBottom: '1px solid #ddd'
                  }}
                >
                  {product.name}
                </div>
              ))}
            </div>
          </div>

          {/* Editor de Receta */}
          <div>
            {selectedProduct ? (
              <>
                <h3>Ingredientes de {selectedProduct.name}</h3>
                <table style={{ width: '100%', marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Ingrediente</th>
                      <th>Cantidad por Unidad</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            value={item.item_type}
                            onChange={(e) => handleUpdateItem(index, 'item_type', e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value='rawmaterial'>Materia Prima</option>
                            <option value='supply'>Insumo</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={item.item_id}
                            onChange={(e) => handleUpdateItem(index, 'item_id', e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value=''>Seleccionar...</option>
                            {item.item_type === 'rawmaterial'
                              ? rawMaterials.map(rm => (
                                <option key={rm.id} value={rm.id}>
                                  {rm.name}
                                </option>
                              ))
                              : supplies.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type='number'
                            value={item.quantity_per_unit}
                            onChange={(e) => handleUpdateItem(index, 'quantity_per_unit', e.target.value)}
                            step='0.01'
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <button
                            className='deleteButton'
                            onClick={() => handleRemoveItem(index)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginBottom: '20px' }}>
                  <button className='saveButton' onClick={handleAddItem}>
                    + Agregar Ingrediente
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className='saveButton' onClick={handleSaveRecipe}>
                    Guardar Receta
                  </button>
                  {recipes[selectedProduct.id] && (
                    <button
                      className='deleteButton'
                      onClick={() => handleDeleteRecipe(selectedProduct.id)}
                    >
                      Eliminar Receta
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p>Selecciona un producto para editar su receta</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRecipes;
