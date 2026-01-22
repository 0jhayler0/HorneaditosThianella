import React from 'react'
import VerticalMenuLayout from './VerticalMenuLayout';

const DailyProduction = () => {
  const menuItems = [
    { label: 'Producción Hoy', onClick: () => {} },
    { label: 'Historial', onClick: () => {} },
    { label: 'Reportes', onClick: () => {} }
  ];

  return (
    <VerticalMenuLayout menuItems={menuItems}>
      <h2>Producción Diaria</h2>
      <p>Contenido de producción aquí</p>
    </VerticalMenuLayout>
  )
}

export default DailyProduction
