import React, { useEffect, useState } from 'react'
import '../styles/Content.css'

const History = () => {
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // New state for detailed history
  const [activeTab, setActiveTab] = useState('monthly')
  const [purchasesData, setPurchasesData] = useState([])
  const [returnsData, setReturnsData] = useState([])
  const [exchangesData, setExchangesData] = useState([])
  const [paymentsData, setPaymentsData] = useState([])
  const [clientPurchasesData, setClientPurchasesData] = useState([])
  const [balancesData, setBalancesData] = useState([])
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    client_id: '',
    type: '',
    payment_method: ''
  })

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

  const fetchDetailedData = async (endpoint) => {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      const res = await fetch(`http://localhost:3000/api/history/${endpoint}?${queryParams}`)
      if (!res.ok) throw new Error(`Error al cargar ${endpoint}`)
      const data = await res.json()

      switch (endpoint) {
        case 'purchases':
          setPurchasesData(data)
          break
        case 'returns':
          setReturnsData(data)
          break
        case 'exchanges':
          setExchangesData(data)
          break
        case 'payments':
          setPaymentsData(data)
          break
        case 'client-purchases':
          setClientPurchasesData(data)
          break
        case 'balances':
          setBalancesData(data)
          break
      }
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (activeTab !== 'monthly') {
      fetchDetailedData(activeTab)
    }
  }, [activeTab, filters])

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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES')
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const renderFilters = () => (
    <div className="filters-container">
      <div className="filter-group">
        <label>Fecha inicio:</label>
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => handleFilterChange('start_date', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>Fecha fin:</label>
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => handleFilterChange('end_date', e.target.value)}
        />
      </div>
      {(activeTab === 'returns' || activeTab === 'exchanges' || activeTab === 'payments' || activeTab === 'client-purchases') && (
        <div className="filter-group">
          <label>ID Cliente:</label>
          <input
            type="number"
            value={filters.client_id}
            onChange={(e) => handleFilterChange('client_id', e.target.value)}
            placeholder="Opcional"
          />
        </div>
      )}
      {activeTab === 'purchases' && (
        <div className="filter-group">
          <label>Tipo:</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="rawmaterials">Materias Primas</option>
            <option value="supplies">Insumos</option>
            <option value="usable">Usables</option>
          </select>
        </div>
      )}
      {activeTab === 'payments' && (
        <div className="filter-group">
          <label>Método de pago:</label>
          <select
            value={filters.payment_method}
            onChange={(e) => handleFilterChange('payment_method', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="caja_menor">Caja Menor</option>
            <option value="caja_mayor">Caja Mayor</option>
            <option value="cuenta_bancaria">Cuenta Bancaria</option>
          </select>
        </div>
      )}
    </div>
  )

  const renderPurchasesTable = () => (
    <table className="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Costo Unitario</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {purchasesData.map((purchase) => (
          <tr key={purchase.id}>
            <td>{formatDate(purchase.purchase_date)}</td>
            <td>{purchase.type}</td>
            <td>{purchase.item_name}</td>
            <td>{purchase.packages}</td>
            <td>{formatCurrency(purchase.unit_cost)}</td>
            <td>{formatCurrency(purchase.total_cost)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderReturnsTable = () => (
    <table className="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Productos</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {returnsData.map((return_) => (
          <tr key={return_.id}>
            <td>{formatDate(return_.return_date)}</td>
            <td>{return_.client_name}</td>
            <td>
              {return_.products?.map((product, index) => (
                <div key={index}>
                  {product.product_name} x{product.quantity} ({formatCurrency(product.subtotal)})
                </div>
              ))}
            </td>
            <td>{formatCurrency(return_.total_amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderExchangesTable = () => (
    <table className="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Productos Recibidos</th>
          <th>Productos Entregados</th>
          <th>Diferencia</th>
        </tr>
      </thead>
      <tbody>
        {exchangesData.map((exchange) => (
          <tr key={exchange.id}>
            <td>{formatDate(exchange.exchange_date)}</td>
            <td>{exchange.client_name}</td>
            <td>
              {exchange.incoming_products?.filter(p => p).map((product, index) => (
                <div key={index}>
                  {product.product_name} x{product.quantity}
                </div>
              ))}
            </td>
            <td>
              {exchange.outgoing_products?.filter(p => p).map((product, index) => (
                <div key={index}>
                  {product.product_name} x{product.quantity}
                </div>
              ))}
            </td>
            <td className={exchange.difference >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(exchange.difference)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderPaymentsTable = () => (
    <table className="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Monto</th>
          <th>Método</th>
          <th>Notas</th>
          <th>Deuda Restante</th>
        </tr>
      </thead>
      <tbody>
        {paymentsData.map((payment) => (
          <tr key={payment.id}>
            <td>{formatDate(payment.payment_date)}</td>
            <td>{payment.client_name}</td>
            <td>{formatCurrency(payment.amount)}</td>
            <td>{payment.payment_method}</td>
            <td>{payment.notes || '-'}</td>
            <td>{formatCurrency(payment.client_debt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderClientPurchasesTable = () => (
    <table className="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Productos</th>
          <th>Total</th>
          <th>Tipo Pago</th>
          <th>Deuda Actual</th>
        </tr>
      </thead>
      <tbody>
        {clientPurchasesData.map((sale) => (
          <tr key={sale.id}>
            <td>{formatDate(sale.sale_date)}</td>
            <td>{sale.client_name}</td>
            <td>
              {sale.products?.map((product, index) => (
                <div key={index}>
                  {product.product_name} x{product.quantity}
                </div>
              ))}
            </td>
            <td>{formatCurrency(sale.total_amount)}</td>
            <td>{sale.payment_type}</td>
            <td>{formatCurrency(sale.client_debt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const renderBalancesTable = () => (
    <table className="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Ventas</th>
          <th>Pagos Recibidos</th>
          <th>Compras</th>
          <th>Devoluciones</th>
          <th>Intercambios</th>
          <th>Flujo Neto</th>
        </tr>
      </thead>
      <tbody>
        {balancesData.map((balance) => (
          <tr key={balance.date}>
            <td>{formatDate(balance.date)}</td>
            <td className="positive">{formatCurrency(balance.sales_total)}</td>
            <td className="positive">{formatCurrency(balance.payments_total)}</td>
            <td className="negative">{formatCurrency(Math.abs(balance.purchases_total))}</td>
            <td className="negative">{formatCurrency(Math.abs(balance.returns_total))}</td>
            <td className={balance.exchanges_total >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(balance.exchanges_total)}
            </td>
            <td className={balance.net_cash_flow >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(balance.net_cash_flow)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  if (loading) return <div className="loading">Cargando historial...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="history-container">
      <h1>Historial y Balances</h1>

      <div className="tabs">
        <button
          className={activeTab === 'monthly' ? 'active' : ''}
          onClick={() => setActiveTab('monthly')}
        >
          Resumen Mensual
        </button>
        <button
          className={activeTab === 'purchases' ? 'active' : ''}
          onClick={() => setActiveTab('purchases')}
        >
          Compras
        </button>
        <button
          className={activeTab === 'returns' ? 'active' : ''}
          onClick={() => setActiveTab('returns')}
        >
          Devoluciones
        </button>
        <button
          className={activeTab === 'exchanges' ? 'active' : ''}
          onClick={() => setActiveTab('exchanges')}
        >
          Intercambios
        </button>
        <button
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          Pagos
        </button>
        <button
          className={activeTab === 'client-purchases' ? 'active' : ''}
          onClick={() => setActiveTab('client-purchases')}
        >
          Compras por Cliente
        </button>
        <button
          className={activeTab === 'balances' ? 'active' : ''}
          onClick={() => setActiveTab('balances')}
        >
          Balances Diarios
        </button>
      </div>

      {activeTab !== 'monthly' && renderFilters()}

      <div className="history-table-container">
        {activeTab === 'monthly' && (
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
        )}

        {activeTab === 'purchases' && renderPurchasesTable()}
        {activeTab === 'returns' && renderReturnsTable()}
        {activeTab === 'exchanges' && renderExchangesTable()}
        {activeTab === 'payments' && renderPaymentsTable()}
        {activeTab === 'client-purchases' && renderClientPurchasesTable()}
        {activeTab === 'balances' && renderBalancesTable()}
      </div>

      {monthlyData.length === 0 && activeTab === 'monthly' && (
        <div className="no-data">
          No hay datos históricos disponibles
        </div>
      )}
    </div>
  )
}

export default History
