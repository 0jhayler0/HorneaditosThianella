import React, { useState } from 'react'

import '../styles/Content.css';

const Createclient = ({ onClientCreated, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    CedulaONit: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    correo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.nombre,
          document: formData.CedulaONit,
          addres: formData.direccion,
          city: formData.ciudad,
          tel: formData.telefono,
          email: formData.correo
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear el cliente');
      }

      const newClient = await response.json();
      setSuccess('¡Cliente creado exitosamente!');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        CedulaONit: '',
        direccion: '',
        ciudad: '',
        telefono: '',
        correo: ''
      });

      // Notificar al componente padre
      if (onClientCreated) {
        onClientCreated(newClient);
      }

      // Limpiar mensaje de éxito después de 2 segundos
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='createClientForm' style={{ position: 'relative' }}>
      <button
        onClick={onClose}
        className='closeButton'
        title="Cerrar"
      >
        ✕
      </button>

      <form onSubmit={handleSubmit}>
        <h1>CREAR NUEVO CLIENTE</h1>
        
        {error && <div className='errorMessage'>{error}</div>}
        {success && <div className='successMessage'>{success}</div>}
        
        <div className='formGroup'>
          <label htmlFor="nombre">Nombre:</label>
          <input 
            type="text" 
            id="nombre" 
            name="nombre" 
            placeholder='Ingrese el nombre completo'
            value={formData.nombre}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="CedulaONit">Cedula o Nit:</label>
          <input 
            type="text" 
            id="CedulaONit" 
            name="CedulaONit" 
            placeholder='Ingrese la cedula o NIT'
            value={formData.CedulaONit}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="direccion">Direccion:</label>
          <input 
            type="text" 
            id="direccion" 
            name="direccion" 
            placeholder='Ingrese la direccion completa'
            value={formData.direccion}
            onChange={handleChange}
            required
          /> 
          
          <label htmlFor="ciudad">Ciudad:</label>
          <input 
            type="text" 
            id="ciudad" 
            name="ciudad" 
            placeholder='Ingrese la ciudad'
            value={formData.ciudad}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="telefono">Telefono:</label>
          <input 
            type="text" 
            id="telefono" 
            name="telefono" 
            placeholder='Ingrese el numero de telefono'
            value={formData.telefono}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="correo">Correo:</label>
          <input 
            type="email" 
            id="correo" 
            name="correo" 
            placeholder='Ingrese el correo electronico'
            value={formData.correo}
            onChange={handleChange}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creando cliente...' : 'Crear Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Createclient
