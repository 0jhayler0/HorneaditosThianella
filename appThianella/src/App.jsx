import React, { useState } from 'react'

import Inventory from './components/Inventory'
import Sales from './components/Sales'
import DailyProduction from './components/DailyProduction'
import Purchases from './components/Purchases'
import Welcome from './components/Welcome'

import './styles/App.css'

const App = () => {
  
  const [option, setOption] = useState("")

    const renderContent = () => {
        switch(option) {
            case "inventory":
                return < Inventory />
            case "sales":
                return < Sales />
            case "DailyProduction":
                return < DailyProduction />
            case "purchases":
                return < Purchases />
            default:
                return < Welcome />
        }
    }
    
    return (
        <div className='principalContainer'>
        <nav className='menuContainer'>
            <button onClick={() => setOption("inventory")}>Inventario</button>
            <button onClick={() => setOption("sales")}>Ventas</button>
            <button onClick={() => setOption("DailyProduction")}>Producción Diaria</button>
            <button onClick={() => setOption("purchases")}>Compras</button>
        </nav>
        <div className='contentContainer'>
            {renderContent()}
        </div>
    </div>
  )
  
}

export default App
