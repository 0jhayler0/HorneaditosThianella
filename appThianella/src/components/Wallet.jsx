import React, { useEffect, useState } from 'react'
import '../styles/Content.css'

const Wallet = () => {
  const [balances, setBalances] = useState({
    caja_menor: 0,
    caja_mayor: 0,
    cuenta_bancaria: 0,
    total: 0
  })
  const [summary, setSummary] = useState({
    accounts_receivable: 0,
    debts: 0
  })
  const [movements, setMovements] = useState([])

  useEffect(() => {
    fetchBalance()
    fetchSummary()
    fetchMovements()

    const interval = setInterval(() => {
      fetchBalance()
      fetchSummary()
      fetchMovements()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchBalance = async () => {
    const res = await fetch('https://appthianella-backend.onrender.com/api/wallet/balance')
    const data = await res.json()
    setBalances(data)
  }

  const fetchSummary = async () => {
    const res = await fetch('https://appthianella-backend.onrender.com/api/wallet/summary')
    const data = await res.json()
    setSummary(data)
  }

  const fetchMovements = async () => {
    const res = await fetch('https://appthianella-backend.onrender.com/api/wallet/movements')
    const data = await res.json()
    setMovements(Array.isArray(data) ? data : [])
  }

  return (
    <div className='content' >
      <h1 style={styles.title}>Cartera de la Empresa</h1>

      {/* ===== RESUMEN ===== */}
      <div style={styles.summary}>
        <div style={styles.card}>
          <h3>Caja menor (Efectivo)</h3>
          <p style={{ ...styles.amount, color: '#16a34a' }}>
            ${Number(balances.caja_menor).toFixed(2)}
          </p>
        </div>

        <div style={styles.card}>
          <h3>Caja mayor (Cuenta David)</h3>
          <p style={{ ...styles.amount, color: '#16a34a' }}>
            ${Number(balances.caja_mayor).toFixed(2)}
          </p>
        </div>

        <div style={styles.card}>
          <h3>Cuenta bancaria</h3>
          <p style={{ ...styles.amount, color: '#16a34a' }}>
            ${Number(balances.cuenta_bancaria).toFixed(2)}
          </p>
        </div>

        <div style={styles.card}>
          <h3>Total</h3>
          <p style={{ ...styles.amount, color: '#16a34a' }}>
            ${Number(balances.total).toFixed(2)}
          </p>
        </div>
      </div>

      <div style={styles.summary}>
        <div style={styles.card}>
          <h3>Cuentas por cobrar</h3>
          <p style={{ ...styles.amount, color: '#ca8a04' }}>
            ${Number(summary.accounts_receivable).toFixed(2)}
          </p>
        </div>

        <div style={styles.card}>
          <h3>Deudas</h3>
          <p style={{ ...styles.amount, color: '#dc2626' }}>
            ${Number(summary.debts).toFixed(2)}
          </p>
        </div>
      </div>

      {/* ===== MOVIMIENTOS ===== */}
      <h2 style={styles.subtitle}>Movimientos</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Fecha</th>
            <th style={styles.th}>Tipo</th>
            <th style={styles.th}>Detalle</th>
            <th style={styles.th}>Entrada</th>
            <th style={styles.th}>Salida</th>
          </tr>
        </thead>
        <tbody>
          {movements.map(m => (
            <tr key={m.id} style={styles.tr}>
              <td style={styles.td}>
                {new Date(m.created_at).toLocaleDateString()}
              </td>
              <td style={styles.td}>{m.type}</td>
              <td style={styles.td}>{m.note || '-'}</td>
              <td style={{ ...styles.td, color: '#16a34a' }}>
                {m.direction === 'in' ? `$${m.amount}` : ''}
              </td>
              <td style={{ ...styles.td, color: '#dc2626' }}>
                {m.direction === 'out' ? `$${m.amount}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  container: {
    padding: '30px',
    fontFamily: 'system-ui, sans-serif'
  },
  title: {
    marginBottom: '20px'
  },
  subtitle: {
    marginTop: '30px',
    marginBottom: '10px'
  },
  summary: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px'
  },
  card: {
    flex: 1,
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
  },
  amount: {
    fontSize: '22px',
    fontWeight: 'bold'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    background: '#f3f4f6',
    borderBottom: '2px solid #e5e7eb'
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #e5e7eb'
  },
  tr: {
    backgroundColor: '#ffffff'
  }
}

export default Wallet
