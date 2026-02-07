import React, { useState, useEffect } from 'react'

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
 const [isMobile, setIsMobile] = useState(false)
 const [menuOpen, setMenuOpen] = useState(false)

 useEffect(() => {
   const handleResize = () => {
     setIsMobile(window.innerWidth < 768)
   }
   window.addEventListener('resize', handleResize)
   handleResize() // initial check
   return () => window.removeEventListener('resize', handleResize)
 }, [])

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
            {isMobile ? (
                <>
                    <button className='hamburger' onClick={() => setMenuOpen(!menuOpen)}>☰</button>
                    {menuOpen && (
                        <div className='mobileMenu'>
                            <button onClick={() => { setOption("inventory"); setMenuOpen(false) }}>Inventario</button>
                            <button onClick={() => { setOption("sales"); setMenuOpen(false) }}>Ventas</button>
                            <button onClick={() => { setOption("DailyProduction"); setMenuOpen(false) }}>Producción Diaria</button>
                            <button onClick={() => { setOption("purchases"); setMenuOpen(false) }}>Compras</button>
                            <button onClick={() => { setOption("payments"); setMenuOpen(false) }}>Pagos</button>
                            <button onClick={() => { setOption("Colaborators"); setMenuOpen(false) }}>Colaboradores</button>
                            <button onClick={() => { setOption("Wallet"); setMenuOpen(false) }}>Cartera</button>
                            <button onClick={() => { setOption("History"); setMenuOpen(false) }}>Historial</button>
                            <button onClick={() => { onLogout(); setMenuOpen(false) }}>Cerrar Sesión</button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <button onClick={() => setOption("inventory")}>Inventario</button>
                    <button onClick={() => setOption("sales")}>Ventas</button>
                    <button onClick={() => setOption("DailyProduction")}>Producción Diaria</button>
                    <button onClick={() => setOption("purchases")}>Compras</button>
                    <button onClick={() => setOption("payments")}>Pagos</button>
                    <button onClick={() => setOption("Colaborators")}>Colaboradores</button>
                    <button onClick={() => setOption("Wallet")}>Cartera</button>
                    <button onClick={() => setOption("History")}>Historial</button>
                    <button onClick={onLogout} style={{ marginLeft: 'auto' }}>Cerrar Sesión</button>
                </>
            )}
        </nav>
        <div className='contentContainer'>
            {renderContent()}
        </div>
    </div>
  )

}

export default App
