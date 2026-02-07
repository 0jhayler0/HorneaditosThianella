import React, { useEffect, useState } from 'react';
import '../styles/Content.css';
import CreateColaborators from './CreateColaborators'
import VerticalMenuLayout from './VerticalMenuLayout';

const Colaborators = () => {
  const [colaborators, setColaborators] = useState([]);
  const [showCreateColaborators, setShowCreateColaborators] = useState(false);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    role: '',
    daily_salary: '',
    hourly_rate: ''
  });

  useEffect(() => {
    fetchColaborators();
  }, []);

  const fetchColaborators = async () => {
    const res = await fetch('http://localhost:3000/api/colaborators');
    setColaborators(await res.json());
  };

  const payDay = async (id) => {
    if (!window.confirm('Pagar el día?')) return;

    await fetch('http://localhost:3000/api/colaborators/pay-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colaborator_id: id })
    });

    alert('Pago diario realizado');
  };

  const payHours = async (id) => {
    const hours = prompt('Cuántas horas trabajó?');
    if (!hours || hours <= 0) return;

    const res = await fetch('http://localhost:3000/api/colaborators/pay-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colaborator_id: id, hours: Number(hours) })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error);

    alert(`Pago realizado: $${data.total}`);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      role: c.role || '',
      daily_salary: c.daily_salary,
      hourly_rate: c.hourly_rate
    });
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const saveEdit = async () => {
    const res = await fetch(`http://localhost:3000/api/colaborators/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        role: form.role,
        daily_salary: Number(form.daily_salary),
        hourly_rate: Number(form.hourly_rate)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert('Colaborador actualizado');
    closeEdit();
    fetchColaborators();
  };

  const menuItems = [
    { label: 'Crear colaboradores', onClick: () => setShowCreateColaborators(true)}
  ];

  return (
      <div className="content">
        <table>
          <thead>
            <th className='tableTittle' colSpan={5}>
              Colaboradores
              </th>
          </thead>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Salario Diario</th>
              <th>Valor Hora</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {colaborators.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.role}</td>
                <td>${c.daily_salary}</td>
                <td>${c.hourly_rate}</td>
                <td>
                  <button className='saveButton' onClick={() => payDay(c.id)}>Pagar día</button>
                  <button className='cancelButton' onClick={() => payHours(c.id)}>Pagar horas</button>
                  <button className='editButton' onClick={() => openEdit(c)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MODAL EDITAR */}
        {editing && (
          <div className="modalOverlay">
            <div className="modal">
              <h2>Editar colaborador</h2>

              <label>Nombre</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />

              <label>Cargo</label>
              <input
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              />

              <label>Salario diario</label>
              <input
                type="number"
                value={form.daily_salary}
                onChange={e => setForm({ ...form, daily_salary: e.target.value })}
              />

              <label>Valor por hora</label>
              <input
                type="number"
                value={form.hourly_rate}
                onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
              />

              <div className="modalButtons">
                <button onClick={saveEdit}>Guardar</button>
                <button onClick={closeEdit}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className={`createClientPanel ${showCreateColaborators ? 'visible' : ''}`}>
          <CreateColaborators onClose={() => setShowCreateColaborators(false)} />
        </div>
        <VerticalMenuLayout menuItems={menuItems} />
      </div>
    
  );
};

export default Colaborators;
