import React, { useEffect, useState } from 'react';
import '../styles/Content.css';

const Payments = ({ onClose }) => {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/clients')
      .then(res => res.json())
      .then(setClients);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientId || amount <= 0) {
      alert('Datos inválidos');
      return;
    }

    const res = await fetch('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: parseInt(clientId),
        amount: parseFloat(amount),
        notes
      })
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || 'Error al registrar pago');
      return;
    }

    alert('Pago registrado correctamente');
    setClientId('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="content">
      <button className="closeButton" onClick={onClose}>✕</button>

      <form onSubmit={handleSubmit}>
        <h1>Registrar pago</h1>

        <label>Cliente</label>
        <select value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">Seleccionar...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} — Deuda: ${c.currentdbt}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Monto del abono"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <textarea
          placeholder="Notas (opcional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <button type="submit">Guardar pago</button>
      </form>
    </div>
  );
};

export default Payments;
