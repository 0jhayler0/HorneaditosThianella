import React, { useState, useRef, useEffect } from 'react';
import '../styles/VerticalMenu.css';

const VerticalMenuLayout = ({ menuItems, children }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      <aside ref={menuRef} className={`verticalMenu ${open ? "open" : ""}`}>
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
