import React, { useState, useEffect } from 'react'
import VerticalMenuLayout from './VerticalMenuLayout';

import CreateRawMaterials from './CreateRawMaterials';
import CreateSupplies from './CreateSupplies';
import CreateFinishedProducts from './CreateFinishedProducts';
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
  const [showCreateSupplies, setShowCreateSupplies] = useState(false);
  const [showCreateFinishedProducts, setShowCreateFinishedProducts] = useState(false);

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

  const [editingSupplyFull, setEditingSupplyFull] = useState(null);
  const [supplyForm, setSupplyForm] = useState({
    name: '',
    price: '',
    uds: '',
    stock: ''
  });

  const [editingUsableFull, setEditingUsableFull] = useState(null);
  const [usableForm, setUsableForm] = useState({
    name: '',
    stock: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchRawMaterials();
    fetchSupplies();
    fetchUsable();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('https://appthianella-backend.onrender.com/api/finishedproducts');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await fetch('https://appthianella-backend.onrender.com/api/rawmaterials');
      const data = await response.json();
      setRawMaterials(data);
    } catch (error) {
      console.error('Error al obtener materias primas:', error);
    }
  };

  const fetchSupplies = async () => {
    try {
      const response = await fetch('https://appthianella-backend.onrender.com/api/supplies');
      const data = await response.json();
      setSupplies(data);
    } catch (error) {
      console.error('Error al obtener insumos:', error);
    }
  };

  const fetchUsable = async () => {
    try {
      const response = await fetch('https://appthianella-backend.onrender.com/api/usable');
      const data = await response.json();
      setUsable(data);
    } catch (error) {
      console.error('Error al obtener usables:', error);
    }
  };

  const handleSavePrice = async () => {
  try {
    const res = await fetch(
      `https://appthianella-backend.onrender.com/api/finishedproducts/${editingProduct.id}/price`,
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
    { label: 'Crear Insumos', onClick: () => setShowCreateSupplies(true) },
    { label: 'Crear Productos Terminados', onClick: () => setShowCreateFinishedProducts(true) },
    { label: 'Registrar Perdidas', onClick: () => setShowLossIncome(true) }
  ];

  return (
      <div className='content'>
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
              <th colSpan={5} className='tableTittle'>Insumos</th>
            </tr>
            <tr>
              <th>Nombre</th>
              <th>Precio por paquete</th>
              <th>uds por paquete</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {supplies.map((supply) => (
              <tr key={supply.id}>
                <td>{supply.name}</td>
                <td>{supply.price}</td>
                <td>{supply.uds}</td>
                <td>{supply.stock}</td>
                <td>
                  <button
                    className="editButton"
                    onClick={() => {
                      setEditingSupplyFull(supply);
                      setSupplyForm(supply);
                    }}
                  >
                    Editar
                  </button>
                </td>
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

            {editingSupplyFull && (
              <div className="modal">
                <div className="modalContent">
                  <h3>Editar insumo</h3>

                  <input
                    value={supplyForm.name}
                    onChange={e => setSupplyForm({ ...supplyForm, name: e.target.value })}
                    placeholder="Nombre"
                  />

                  <input
                    type="number"
                    value={supplyForm.price}
                    onChange={e => setSupplyForm({ ...supplyForm, price: e.target.value })}
                    placeholder="Precio"
                  />

                  <input
                    type="number"
                    value={supplyForm.uds}
                    onChange={e => setSupplyForm({ ...supplyForm, uds: e.target.value })}
                    placeholder="Uds por paquete"
                  />

                  <input
                    type="number"
                    value={supplyForm.stock}
                    onChange={e => setSupplyForm({ ...supplyForm, stock: e.target.value })}
                    placeholder="Stock"
                  />

                  <button
                    className="saveButton"
                    onClick={async () => {
                      await fetch(
                        `http://localhost:3000/api/supplies/${editingSupplyFull.id}`,
                        {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(supplyForm)
                        }
                      );

                      setEditingSupplyFull(null);
                      fetchSupplies();
                    }}
                  >
                    Guardar
                  </button>

                  <button
                    className="cancelButton"
                    onClick={() => setEditingSupplyFull(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

        <table>
          <thead>
            <tr>
              <th colSpan={3} className='tableTittle'>usables y maquinaria</th>
            </tr>
            <tr>
              <th>Nombre</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usable.map((usableItem) => (
              <tr key={usableItem.id}>
                <td>{usableItem.name}</td>
                <td>{usableItem.stock}</td>
                <td>
                  <button
                    className="editButton"
                    onClick={() => {
                      setEditingUsableFull(usableItem);
                      setUsableForm(usableItem);
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingUsableFull && (
          <div className="modal">
            <div className="modalContent">
              <h3>Editar usable</h3>

              <input
                value={usableForm.name}
                onChange={e => setUsableForm({ ...usableForm, name: e.target.value })}
                placeholder="Nombre"
              />

              <input
                type="number"
                value={usableForm.stock}
                onChange={e => setUsableForm({ ...usableForm, stock: e.target.value })}
                placeholder="Stock"
              />

              <button
                className="saveButton"
                onClick={async () => {
                  await fetch(
                    `http://localhost:3000/api/usable/${editingUsableFull.id}`,
                    {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(usableForm)
                    }
                  );

                  setEditingUsableFull(null);
                  fetchUsable();
                }}
              >
                Guardar
              </button>

              <button
                className="cancelButton"
                onClick={() => setEditingUsableFull(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className={`createClientPanel ${showCreateRawMaterials ? 'visible' : '' }` }>
          <CreateRawMaterials onClose={() => { setShowCreateRawMaterials(false); fetchRawMaterials(); }}/>
        </div>
        <div className={`createClientPanel ${showLossIncome ? 'visible' : '' }` }>
          <LossIncome onClose={() => setShowLossIncome(false)}/>
        </div>
        <div className={`createClientPanel ${showCreateSupplies ? 'visible' : ''}`}>
          <CreateSupplies onClose={() => setShowCreateSupplies(false)} />  
        </div>
        <div className={`createClientPanel ${showCreateFinishedProducts ? 'visible' : ''}`}>
          <CreateFinishedProducts onClose={() => { setShowCreateFinishedProducts(false); fetchProducts(); }} />
        </div>
        <VerticalMenuLayout menuItems={menuItems} />
      </div>
  );
}

export default Inventory
