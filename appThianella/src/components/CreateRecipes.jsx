import React, { useEffect, useState } from 'react'
import '../styles/Content.css'

const CreateRecipes = ({ onClose }) => {
  const [finishedProducts, setFinishedProducts] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [supplies, setSupplies] = useState([])

  const [finishedProductId, setFinishedProductId] = useState('')
  const [items, setItems] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [fp, rm, sp] = await Promise.all([
      fetch('http://localhost:3000/api/finishedproducts').then(r => r.json()),
      fetch('http://localhost:3000/api/rawmaterials').then(r => r.json()),
      fetch('http://localhost:3000/api/supplies').then(r => r.json())
    ])

    setFinishedProducts(fp)
    setRawMaterials(rm)
    setSupplies(sp)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        item_type: '',
        item_id: '',
        quantity_per_unit: ''
      }
    ])
  }

  const updateItem = (id, field, value) => {
    setItems(items.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    ))
  }

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!finishedProductId || items.length === 0) {
      alert('Completa producto y receta')
      return
    }

    const payload = {
      finishedproductid: Number(finishedProductId),
      items: items.map(i => ({
        item_type: i.item_type,
        item_id: Number(i.item_id),
        quantity_per_unit: Number(i.quantity_per_unit)
      }))
    }

    const res = await fetch('http://localhost:3000/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await res.json()

    if (!res.ok) {
      alert(result.error || 'Error al guardar receta')
      return
    }

    alert('Receta guardada correctamente')
    setItems([])
    setFinishedProductId('')
  }

  return (
    <div className="content">
      <button onClick={onClose} className="closeButton">✕</button>

      <h1>Crear / Editar Receta</h1>

      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label>Producto terminado</label>
          <select
            value={finishedProductId}
            onChange={e => setFinishedProductId(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {finishedProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {items.map(i => (
          <div key={i.id} className="formGroup">
            <button type="button" onClick={() => removeItem(i.id)}>✕</button>

            <select
              value={i.item_type}
              onChange={e => updateItem(i.id, 'item_type', e.target.value)}
            >
              <option value="">Tipo</option>
              <option value="rawmaterial">Materia prima</option>
              <option value="supply">Insumo</option>
            </select>

            <select
              value={i.item_id}
              onChange={e => updateItem(i.id, 'item_id', e.target.value)}
              disabled={!i.item_type}
            >
              <option value="">Item</option>

              {i.item_type === 'rawmaterial' &&
                rawMaterials.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}

              {i.item_type === 'supply' &&
                supplies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            <input
              type="number"
              step="0.0001"
              placeholder="Cantidad por unidad"
              value={i.quantity_per_unit}
              onChange={e => updateItem(i.id, 'quantity_per_unit', e.target.value)}
            />
          </div>
        ))}

        <button type="button" onClick={addItem}>
          Agregar ingrediente
        </button>

        <button type="submit">
          Guardar Receta
        </button>
      </form>
    </div>
  )
}

export default CreateRecipes
