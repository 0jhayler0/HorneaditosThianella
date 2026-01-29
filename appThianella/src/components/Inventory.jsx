import React, { useState, useEffect } from 'react'
import VerticalMenuLayout from './VerticalMenuLayout';

import CreateRawMaterials from './CreateRawMaterials';
import LossIncome from './LossIncome';

import '../styles/Content.css';

const Inventory = () => {

  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [usable, setUsable] = useState([]);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const [editingRawMaterial, setEditingRawMaterial] = useState(null);
  const [newRawMaterialPrice, setNewRawMaterialPrice] = useState('');
  const [editingSupply, setEditingSupply] = useState(null);
  const [newSupplyPrice, setNewSupplyPrice] = useState('');

  const [editingUsable, setEditingUsable] = useState(null); 
  const [newUsablePrice, setNewUsablePrice] = useState('');

  const [showCreateRawMaterials, setShowCreateRawMaterials] = useState(false);
  const [showLossIncome, setShowLossIncome] = useState(false);

  const [editingRawMaterialFull, setEditingRawMaterialFull] = useState(null);
  const [rawMaterialForm, setRawMaterialForm] = useState({
    name: '',
    price: '',
    brand: '',
    packageweight: '',
    stock: '',
    measure: '',
    description: ''
  });




  useEffect(() => {
    fetchProducts();
    fetchRawMaterials();
    fetchSupplies();
    fetchUsable();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/finishedproducts');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/rawmaterials');
      const data = await response.json();
      setRawMaterials(data);
    } catch (error) {
      console.error('Error al obtener materias primas:', error);
    }
  };

  const fetchSupplies = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/supplies');
      const data = await response.json();
      setSupplies(data);
    } catch (error) {
      console.error('Error al obtener insumos:', error);
    }
  };

  const fetchUsable = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/usable');
      const data = await response.json();
      setUsable(data);
    } catch (error) {
      console.error('Error al obtener usables:', error);
    }
  };

  const handleSavePrice = async () => {
  try {
    const res = await fetch(
      `http://localhost:3000/api/finishedproducts/${editingProduct.id}/price`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(newPrice) })
      }
    );

    if (!res.ok) throw new Error('Error al actualizar precio');

    setEditingProduct(null);
    setNewPrice('');
    fetchProducts(); // refresca tabla
  } catch (err) {
    alert(err.message);
  }
};


  const menuItems = [
    { label: 'Crear materias Primas', onClick: () => setShowCreateRawMaterials(true) },
    { label: 'Registrar Perdidas', onClick: () => setShowLossIncome(true) },
  ];

  return (
      <div>
    <VerticalMenuLayout menuItems={menuItems} />
        <table>
          <thead>
            <tr>
              <th colSpan={4} className='tableTittle'>Productos Terminados</th>
            </tr>
            <tr>
              <th>Nombre</th>
              <th>Stock Disponible</th>
              <th>Precio Unitario</th>
              <th>Valor en Bodega</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.stock}</td>
                <td>{product.price}
                  <button className='editButton' 
                    onClick={() => {
                      setEditingProduct(product); 
                      setNewPrice(product.price);}}>
                    Editar Precio
                  </button>
                </td>
                <td>{product.stock * product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingProduct && (
          <div className="modal">
            <div className="modalContent">
              <h3>Editar precio</h3>

              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />

              <button onClick={handleSavePrice} className='saveButton'>Guardar</button>
              <button onClick={() => setEditingProduct(null)} className='cancelButton'>Cancelar</button>
            </div>
          </div>
        )}


        <table>
          <thead>
            <tr>
              <th colSpan={9} className='tableTittle'>Materias Primas</th>
            </tr>
            <tr>
              <th>Nombre</th>
              <th>Precio por paquete</th>
              <th>Marca</th>
              <th>Peso Por paquete (gr/ml)</th>
              <th>Stock</th>
              <th>Ud. de medida</th>
              <th>Descripcion</th>
              <th>Ultima compra</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rawMaterials.map((material) => (
              <tr key={material.id}>
                <td>{material.name}</td>
                <td>{material.price}</td>
                <td>{material.brand}</td>
                <td>{material.packageweight}</td>
                <td>{material.stock}</td>
                <td>{material.measure}</td>
                <td>{material.description}</td>
                <td>{material.lastpurchase}</td>
                <td>
                  <button
                    className="editButton"
                    onClick={() => {
                    setEditingRawMaterialFull(material);
                    setRawMaterialForm(material);
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
         ))}
          </tbody>
        </table>
         {editingRawMaterialFull && (
              <div className="modal">
                <div className="modalContent">
                  <h3>Editar materia prima</h3>

                  <input
                    value={rawMaterialForm.name}
                    onChange={e => setRawMaterialForm({ ...rawMaterialForm, name: e.target.value })}
                    placeholder="Nombre"
                  />

                  <input
                    type="number"
                    value={rawMaterialForm.price}
                    onChange={e => setRawMaterialForm({ ...rawMaterialForm, price: e.target.value })}
                    placeholder="Precio"
                  />

                  <input
                    value={rawMaterialForm.brand}
                    onChange={e => setRawMaterialForm({ ...rawMaterialForm, brand: e.target.value })}
                    placeholder="Marca"
                  />

                  <input
                    type="number"
                    value={rawMaterialForm.packageweight}
                    onChange={e => setRawMaterialForm({ ...rawMaterialForm, packageweight: e.target.value })}
                    placeholder="Peso por paquete"
                  />

                  <input
                    type="number"
                    value={rawMaterialForm.stock}
                    onChange={e => setRawMaterialForm({ ...rawMaterialForm, stock: e.target.value })}
                    placeholder="Stock"
                  />

                  <input
                    value={rawMaterialForm.measure}
                    onChange={e => setRawMaterialForm({ ...rawMaterialForm, measure: e.target.value })}
                    placeholder="Unidad de medida"
                  />

                  <textarea
                    value={rawMaterialForm.description}
                    onChange={e => setRawMaterialForm({ ...rawMaterialForm, description: e.target.value })}
                    placeholder="Descripción"
                  />

                  <button
                    className="saveButton"
                    onClick={async () => {
                      await fetch(
                        `http://localhost:3000/api/rawmaterials/${editingRawMaterialFull.id}`,
                        {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(rawMaterialForm)
                        }
                      );

                      setEditingRawMaterialFull(null);
                      fetchRawMaterials();
                    }}
                  >
                    Guardar
                  </button>

                  <button
                    className="cancelButton"
                    onClick={() => setEditingRawMaterialFull(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

        <table>
            <thead>
            <tr>
              <th colSpan={4} className='tableTittle'>Insumos</th>
            </tr>
            <tr>
              <th>Nombre</th>
              <th>Precio por paquete</th>
              <th>uds por paquete</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {supplies.map((supply) => (
              <tr key={supply.id}>
                <td>{supply.name}</td>
                <td>{supply.price}
                    <button
                      className="editButton"
                      onClick={() => {
                        setEditingSupply(supply);
                        setNewSupplyPrice(supply.price);
                      }}
                    >
                      Editar Precio
                    </button>
                </td>
                <td>{supply.uds}</td>
                <td>{supply.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
            {editingSupply && (
              <div className="modal">
                <div className="modalContent">
                  <h3>Editar precio</h3>
                  <input
                    type="number"
                    value={newSupplyPrice}
                    onChange={(e) => setNewSupplyPrice(e.target.value)}
                  />
                  <button className='saveButton'
                    onClick={async () => {
                      await fetch(
                        `http://localhost:3000/api/supplies/${editingSupply.id}/price`,
                        {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ price: parseFloat(newSupplyPrice) })
                        }
                      );
                      setEditingSupply(null);
                      fetchSupplies();
                    }}
                  >
                    Guardar
                  </button>

                  <button onClick={() => setEditingSupply(null)} className='cancelButton'>Cancelar</button>
                </div>
              </div>
            )}

        <table>
          <thead>
            <tr>
              <th colSpan={2} className='tableTittle'>usables y maquinaria</th>
            </tr>
            <tr>
              <th>Nombre</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {usable.map((usable) => (
              <tr key={usable.id}>
                <td>{usable.name}</td>
                <td>{usable.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={`createClientPanel ${showCreateRawMaterials ? 'visible' : '' }` }>
          <CreateRawMaterials onClose={() => setShowCreateRawMaterials(false)}/>
        </div>
        <div className={`createClientPanel ${showLossIncome ? 'visible' : '' }` }>
          <LossIncome onClose={() => setShowLossIncome(false)}/>
        </div>
      </div>
  );
}


export default Inventory
