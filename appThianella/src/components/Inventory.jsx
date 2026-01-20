import React, { useState, useEffect } from 'react'

import '../styles/VerticalMenu.css'
import '../styles/Content.css'


const Inventory = () => {

  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchRawMaterials();
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

  return (
    <div>
      <aside className={`verticalMenu ${open ? "open" : ""}`}>
        <button className='verticalMenuButton' 
                onClick={() => setOpen(!open)} 
                aria-expanded={open}
        >
          ☰
        </button>
        <ul className='verticalMenuList'>
          <li><button>Productos Terminados</button></li>
        </ul>
      </aside>

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
                <td>{product.price}</td>
                <td>{product.stock * product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th colSpan={6} className='tableTittle'>Materias Primas</th>
            </tr>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Marca</th>
              <th>Stock</th>
              <th>Ud. de medida</th>
              <th>Descripcion</th>
            
            </tr>
          </thead>
          <tbody>
            {rawMaterials.map((material) => (
              <tr key={material.id}>
                <td>{material.name}</td>
                <td>{material.price}</td>
                <td>{material.brand}</td>
                <td>{material.stock}</td>
                <td>{material.measure}</td>
                <td>{material.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default Inventory
