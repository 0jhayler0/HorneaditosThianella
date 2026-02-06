import React, { useState } from 'react';

const CreateFinishedProducts = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '',
    price: ''
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3000/api/finishedproducts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Error al crear producto terminado');

      alert('Producto terminado creado exitosamente');
      setForm({
        name: '',
        price: '',
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al crear producto terminado: ' + err.message);
    }
  };

  return (
    <div>
      <button onClick={onClose} className="closeButton">✕</button>

      <form className="formGroup" onSubmit={handleSubmit}>
        <h1>Creación de productos terminados</h1>

        <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" />
        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Precio" />

        <button type="submit">
          Crear Producto Terminado
        </button>
      </form>
    </div>
  );
};

export default CreateFinishedProducts;
