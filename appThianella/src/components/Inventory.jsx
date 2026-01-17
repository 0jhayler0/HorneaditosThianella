import React, { useState } from 'react'

import '../styles/VerticalMenu.css'
import '../styles/Content.css'


const Inventory = () => {

  const [open, setOpen] = useState();
  const [inventaryOption, setInventaryOption] = useState();

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
          <li><button></button></li>
        </ul>
      </aside>

      <div className='content'>
        <table>
          <thead>
            <tr>
              <th colSpan={4} className='tableTittle'>Productos Terminados</th>
            </tr>
          </thead>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Stock Disponible</th>
              <th>Precio Unitario</th>
              <th>Valor en Bodega</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}


export default Inventory
