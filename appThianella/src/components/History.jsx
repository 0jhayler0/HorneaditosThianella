import React, { useEffect, useState } from 'react'
import '../styles/Content.css'

const History = () => {
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMonthlyHistory()
  }, [])

  const fetchMonthlyHistory = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/history/monthly')
      if (!res.ok) throw new Error('Error al cargar el historial')
      const data = await res.json()
      setMonthlyData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP'
    }).format(amount)
  }

  if (loading) return <div className="loading">Cargando historial...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="history-container">
      <h1>Historial Mensual</h1>

      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Ventas</th>
              <th>Pagos Recibidos</th>
              <th>Compras</th>
              <th>Pagos Colaboradores</th>
              <th>Intercambios</th>
              <th>Devoluciones</th>
              <th>Movimientos Cartera</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((month) => (
              <tr key={month.month}>
                <td className="month-cell">
                  <strong>{formatMonth(month.month)}</strong>
                </td>

                {/* Ventas */}
                <td>
                  <div className="metric-group">
                    <div className="metric-main">
                      {month.sales.count} ventas
                    </div>
                    <div className="metric-detail">
                      Total: {formatCurrency(month.sales.total)}
                    </div>
                    <div className="metric-sub">
                      Contado: {formatCurrency(month.sales.cash)}
                    </div>
                    <div className="metric-sub">
                      Crédito: {formatCurrency(month.sales.credit)}
                    </div>
                  </div>
                </td>

                {/* Pagos Recibidos */}
                <td>
                  <div className="metric-group">
                    <div className="metric-main">
                      {month.payments.count} pagos
                    </div>
                    <div className="metric-detail">
                      {formatCurrency(month.payments.total)}
                    </div>
                  </div>
                </td>

                {/* Compras */}
                <td>
                  <div className="metric-group">
                    <div className="metric-main">
                      {month.purchases.count} compras
                    </div>
                    <div className="metric-detail">
                      {formatCurrency(month.purchases.total)}
                    </div>
                  </div>
                </td>

                {/* Pagos Colaboradores */}
                <td>
                  <div className="metric-group">
                    <div className="metric-main">
                      {month.colaborator_payments.count} pagos
                    </div>
                    <div className="metric-detail">
                      {formatCurrency(month.colaborator_payments.total)}
                    </div>
                  </div>
                </td>

                {/* Intercambios */}
                <td>
                  <div className="metric-group">
                    <div className="metric-main">
                      {month.exchanges.count} intercambios
                    </div>
                    <div className="metric-detail">
                      Diferencia: {formatCurrency(month.exchanges.difference)}
                    </div>
                  </div>
                </td>

                {/* Devoluciones */}
                <td>
                  <div className="metric-group">
                    <div className="metric-main">
                      {month.returns.count} devoluciones
                    </div>
                    <div className="metric-detail">
                      {formatCurrency(month.returns.total)}
                    </div>
                  </div>
                </td>

                {/* Movimientos Cartera */}
                <td>
                  <div className="metric-group">
                    <div className="metric-main">
                      {month.wallet_movements.count} movimientos
                    </div>
                    <div className="metric-detail">
                      Entradas: {formatCurrency(month.wallet_movements.total_in)}
                    </div>
                    <div className="metric-detail">
                      Salidas: {formatCurrency(month.wallet_movements.total_out)}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {monthlyData.length === 0 && (
        <div className="no-data">
          No hay datos históricos disponibles
        </div>
      )}
    </div>
  )
}

export default History
