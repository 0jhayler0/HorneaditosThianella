import React, { useState } from 'react';

const CreateRawMaterials = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '',
    price: '',
    brand: '',
    stock: 0,
    measure: '',
    packageweight: '',
    description: ''
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
      const res = await fetch('https://appthianella-backend.onrender.com/api/rawmaterials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Error al crear materia prima');

      alert('Materia prima creada exitosamente');
      setForm({
        name: '',
        price: '',
        brand: '',
        stock: 0,
        measure: '',
        packageweight: '',
        description: ''
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al crear materia prima: ' + err.message);
    }
  };

  return (
    <div>
      <button onClick={onClose} className="closeButton">✕</button>

      <form className="formGroup" onSubmit={handleSubmit}>
        <h1>Creación de materias primas</h1>

        <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" />
        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Precio por paquete" />
        <input name="brand" value={form.brand} onChange={handleChange} placeholder="Marca" />

        <input
          name="packageweight"
          type="number"
          value={form.packageweight}
          onChange={handleChange}
          placeholder="Peso por paquete"
        />

        <input
          name="measure"
          value={form.measure}
          onChange={handleChange}
          placeholder="Unidad de medida (gr/ml)"
        />

        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Descripción"
        />

        <button type="submit">
          Crear Materia Prima
        </button>
      </form>
    </div>
  );
};

export default CreateRawMaterials;
