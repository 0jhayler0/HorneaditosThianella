import React, { useEffect, useState } from 'react';
import '../styles/Content.css';
import CreateColaborators from './CreateColaborators'
import VerticalMenuLayout from './VerticalMenuLayout';

const Colaborators = () => {
    const [colaborators, setColaborators] = useState([]);
    const [showCreateColaborators, setShowCreateColaborators] = useState(false);

  useEffect(() => {
    fetchColaborators();
  }, []);

  const fetchColaborators = async () => {
    const res = await fetch('http://localhost:3000/api/colaborators');
    setColaborators(await res.json());
  };

  const payDay = async (id) => {
    if (!window.confirm('Pagar el día a este colaborador?')) return;

    const res = await fetch(
      'http://localhost:3000/api/colaborators/pay-day',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colaborator_id: id })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert('Pago realizado');
  };

  const menuItems = [
    { label: 'Crear colaboradores', onClick: () => setShowCreateColaborators(true)}
  ]

  return (
    <VerticalMenuLayout menuItems={menuItems}>
      <div className="content">
        <h1>Colaboradores</h1>

        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Salario Diario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {colaborators.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.role}</td>
                <td>${c.daily_salary}</td>
                <td>
                  <button onClick={() => payDay(c.id)}>
                    Pagar día
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      <div className={`createClientPanel ${showCreateColaborators ? 'visible' : ''}`}>
            <CreateColaborators onClose={() => setShowCreateColaborators(false)} />
        </div>
      </div>
    </VerticalMenuLayout>
  );
};

export default Colaborators;
