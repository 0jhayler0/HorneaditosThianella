import React, { useState } from 'react';
import '../styles/VerticalMenu.css';

const VerticalMenuLayout = ({ menuItems, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <aside className={`verticalMenu ${open ? "open" : ""}`}>
        <button 
          className='verticalMenuButton' 
          onClick={() => setOpen(!open)} 
          aria-expanded={open}
        >
          ☰
        </button>
        <ul className='verticalMenuList'>
          {menuItems.map((item, index) => (
            <li key={index}>
              <button 
                className='menuItemButton'
                onClick={item.onClick}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className='content'>
        {children}
      </div>
    </div>
  );
};

export default VerticalMenuLayout;
