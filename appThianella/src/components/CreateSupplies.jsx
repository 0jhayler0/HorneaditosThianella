import React, { useState } from 'react'

const CreateSupplies = ({ onClose }) => {
    const [form, setForm] = useState({
        name: '',
        price: '',
        uds: ''
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
            const res = await fetch('https://appthianella-backend.onrender.com/api/supplies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) throw new Error('Error al crear insumo');

            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <button onClick={onClose} className="closeButton">✕</button>

            <form className="formGroup" onSubmit={handleSubmit}>
                <h1>Creación de insumos</h1>

                <input name="name" onChange={handleChange} placeholder="Nombre" />
                <input name="price" type="number" onChange={handleChange} placeholder="Precio" />
                <input name="uds" onChange={handleChange} placeholder="Unidad de medida" />

                <button type="submit">
                    Crear Insumo
                </button>
            </form>
        </div>
    )
}

export default CreateSupplies
