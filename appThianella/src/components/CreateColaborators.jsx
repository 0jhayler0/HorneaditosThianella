import React, { useState } from 'react';
import '../styles/Content.css';

const CreateColaborators = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [dailySalary, setDailySalary] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !dailySalary || dailySalary <= 0) {
      alert('Nombre y salario diario son obligatorios');
      return;
    }

    try {
      const res = await fetch('https://appthianella-backend.onrender.com/api/colaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role,
          daily_salary: Number(dailySalary)
        })
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Error al crear colaborador');
        return;
      }

      alert('Colaborador creado correctamente');
      setName('');
      setRole('');
      setDailySalary('');

      if (onCreated) onCreated();
      onClose();

    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <div className="content">
      <button onClick={onClose} className="closeButton" title="Cerrar">
        ✕
      </button>

      <form onSubmit={handleSubmit}>
        <h1>Crear colaborador</h1>

        <div className="formGroup">
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Nombre del colaborador"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label>Cargo / Rol</label>
          <input
            type="text"
            placeholder="Ej: Cocinero, Auxiliar..."
            value={role}
            onChange={e => setRole(e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label>Salario diario</label>
          <input
            type="number"
            step="0.01"
            placeholder="Monto por día"
            value={dailySalary}
            onChange={e => setDailySalary(e.target.value)}
          />
        </div>

        <button type="submit">Guardar colaborador</button>
      </form>
    </div>
  );
};

export default CreateColaborators;
