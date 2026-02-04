import React, { useState } from 'react'

import Inventory from './components/Inventory'
import Sales from './components/Sales'
import DailyProduction from './components/DailyProduction'
import Purchases from './components/Purchases'
import Payments from './components/Payments'
import Colaborators from './components/Colaborators'
import Wallet from './components/Wallet'
import History from './components/History'
import Welcome from './components/Welcome'

import './styles/App.css'

const App = ({ onLogout, user }) => {

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
            case "payments":
                return < Payments />
            case "Colaborators":
                return < Colaborators />
            case "Wallet":
                return < Wallet />
            case "History":
                return < History />
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
            <button onClick={() => setOption("payments")}>Pagos</button>
            <button onClick={() => setOption("Colaborators")}>Colaboradores</button>
            <button onClick={() => setOption("Wallet")}>Cartera</button>
            <button onClick={() => setOption("History")}>Historial</button>
            <button onClick={onLogout} style={{ marginLeft: 'auto' }}>Cerrar Sesión</button>
        </nav>
        <div className='contentContainer'>
            {renderContent()}
        </div>
    </div>
  )

}

export default App
