import React from 'react'

import '../styles/VerticalMenu.css'
import '../styles/Content.css'

const Sales = () => {
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
          
        </ul>
      </aside>
    </div>
  )
}

export default Sales
