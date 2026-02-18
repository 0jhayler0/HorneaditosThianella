# 🧪 GUÍA DE TESTING - ENDPOINTS Y FLUJOS

## INICIALIZACIÓN REQUERIDA

### 1️⃣ Inicializar Cartera
```bash
POST /api/wallet/init
```
Crea las 3 cajas: caja_menor, caja_mayor, cuenta_bancaria

---

## 📋 TESTEO POR MÓDULO

### CLIENTES - clients.js ✅

```bash
# Listar clientes
GET /api/clients/

# Crear cliente
POST /api/clients/
{
  "name": "Mi Cliente",
  "document": "12345678",
  "addres": "Calle 123",
  "city": "Ciudad",
  "tel": "123456789",
  "email": "cliente@example.com"
}

# Actualizar cliente  
PUT /api/clients/:id
{
  "name": "Nuevo Nombre",
  "currentdbt": 500.00
}

# Eliminar cliente
DELETE /api/clients/:id
```

---

### VENTAS - sales.js ✅ (CORREGIDO)

```bash
# Listar ventas
GET /api/sales/

# Crear venta (AHORA CON payment_type CORRECTO)
POST /api/sales/
{
  "client_id": 1,
  "payment_type": "caja_menor",  // ✅ CORRECTO (era payment_method)
  "discount": 5,
  "status": "pending",           // ✅ NUEVO
  "notes": "Compra especial",    // ✅ NUEVO
  "products": [
    {
      "type": "finishedproducts",
      "product_id": 1,
      "quantity": 5
    }
  ]
}

# VALORES VÁLIDOS para payment_type:
- "credit"        # A crédito (aumenta deuda cliente)
- "caja_menor"    # Efectivo - caja menor
- "caja_mayor"    # Efectivo - caja mayor
- "cuenta_bancaria" # Transferencia bancaria

# Actualizar venta
PUT /api/sales/:id
{
  "discount": 10,
  "payment_type": "caja_mayor",  // ✅ CORRECTO
  "status": "completed",          // ✅ NUEVO
  "notes": "Actualizado"          // ✅ NUEVO
}

# Eliminar venta
DELETE /api/sales/:id
```

---

### COMPRAS - purchases.js ✅ (CRÍTICO - AHORA GUARDA)

```bash
# Listar compras (AHORA CON packages CORRECTO)
GET /api/purchases/

# Registrar compra
POST /api/purchases/
{
  "type": "rawmaterials",  // rawmaterials | supplies | usable
  "item_id": 1,
  "packages": 5            // ✅ CORRECTO (era packages_qty)
}

# Actualizar compra
PUT /api/purchases/:id
{
  "type": "supplies",
  "item_id": 2,
  "packages": 10
}

# Eliminar compra
DELETE /api/purchases/:id
```

**IMPORTANTE:** Ahora las compras se guardan en tabla `purchases` (antes no se guardaban!)

---

### INVENTARIO - inventory.js ✅

```bash
# Productos terminados
GET /api/finishedproducts
POST /api/finishedproducts
PUT /api/finishedproducts/:id/price
PUT /api/finishedproducts/:id/stock

# Materias primas
GET /api/rawmaterials
POST /api/rawmaterials
PUT /api/rawmaterials/:id
PUT /api/rawmaterials/:id/stock

# Insumos
GET /api/supplies
POST /api/supplies
PUT /api/supplies/:id/price
PUT /api/supplies/:id/stock

# Usables
GET /api/usable
PUT /api/usable/:id/stock
```

---

### DEVOLUCIONES - returns.js ✅

```bash
# Registrar devolución
POST /api/returns/
{
  "client_id": 1,
  "products": [
    {
      "product_id": 5,
      "quantity": 2
    }
  ]
}
```

---

### INTERCAMBIOS - exchanges.js ✅

```bash
# Registrar cambio/intercambio
POST /api/exchanges/
{
  "client_id": 1,
  "incoming": [      // Productos que ENTREGA el cliente
    {
      "product_id": 1,
      "quantity": 3
    }
  ],
  "outgoing": [      // Productos que RECIBE el cliente
    {
      "product_id": 2,
      "quantity": 2
    }
  ]
}
```

---

### PAGOS - payments.js ✅

```bash
# Listar pagos
GET /api/payments/

# Registrar pago
POST /api/payments/
{
  "client_id": 1,
  "amount": 500.00,
  "notes": "Abono",
  "payment_method": "caja_menor"  // caja_menor | caja_mayor | cuenta_bancaria
}
```

---

### RECETAS - recipes.js ✅ (CORREGIDO)

```bash
# Crear/actualizar receta
POST /api/recipes/
{
  "finishedproductid": 1,
  "items": [
    {
      "item_type": "rawmaterial",  // ✅ AHORA SIN "usable"
      "item_id": 1,
      "quantity_per_unit": 100
    },
    {
      "item_type": "supply",
      "item_id": 2,
      "quantity_per_unit": 50
    }
  ]
}

# VALORES VÁLIDOS para item_type:
- "rawmaterial"   ✅
- "supply"        ✅
- "usable"        ❌ REMOVIDO (no permitido)

# Obtener receta
GET /api/recipes/:finishedproductid

# Eliminar receta
DELETE /api/recipes/:finishedproductid
```

---

### COLABORADORES - colaborators.js ✅

```bash
# Listar colaboradores
GET /api/colaborators/

# Crear colaborador
POST /api/colaborators/
{
  "name": "Juan",
  "role": "Panadero",
  "daily_salary": 100.00,
  "hourly_rate": 15.00
}

# Pagar día
POST /api/colaborators/pay-day
{
  "colaborator_id": 1
}

# Pagar por horas
POST /api/colaborators/pay-hours
{
  "colaborator_id": 1,
  "hours": 8
}

# Actualizar colaborador
PUT /api/colaborators/:id
{
  "name": "Juan",
  "daily_salary": 120.00,
  "hourly_rate": 16.00
}
```

---

### PRODUCCIÓN DIARIA - dailyproduction.js ✅ (MEJORADO)

```bash
# Producción con receta
POST /api/dailyProduction
{
  "finishedproduct_id": 1,
  "quantity": 10       // Cantidad a producir
}

# Producción masa madre
POST /api/dailyProduction
{
  "masa_madre": 5      // Cantidad de masa madre
  // OPCIONAL: Si las búsquedas fallan, puedes especificar:
  // "flour_id": 3,
  // "masa_madre_id": 4
}
```

---

### CARTERA - wallet.js ✅ (CORREGIDO)

```bash
# Obtener resumen
GET /api/wallet/summary
# Retorna: balances por caja, cuentas por cobrar, ventas al contado, etc.

# Obtener saldos actuales
GET /api/wallet/balance
# Retorna: { caja_menor: X, caja_mayor: Y, cuenta_bancaria: Z, total: T }

# Obtener movimientos
GET /api/wallet/movements
# Lista todos los movimientos registrados

# Inicializar cartera (SOLO UNA VEZ)
POST /api/wallet/init
# Crea automáticamente: caja_menor, caja_mayor, cuenta_bancaria
```

---

### HISTORIA - history.js ✅ (CORREGIDO)

```bash
# Resumen mensual
GET /api/history/monthly
# Retorna: ventas, pagos, compras, cambios, devoluciones por mes

# Historial de compras
GET /api/history/purchases
# Ahora con campos: packages, units (NO packages_qty)

# Historial de devoluciones
GET /api/history/returns

# Historial de cambios
GET /api/history/exchanges

# Historial de pagos
GET /api/history/payments

# Historial de compras por cliente
GET /api/history/client-purchases

# Historial de saldos
GET /api/history/balances
# Ahora sin filtro "active = true" (campo no existe)
# Retorna todas las cajas y todos los clientes
```

---

### AUTENTICACIÓN - auth.js ✅

```bash
# Login
POST /api/users
{
  "username": "admin",
  "password": "123456"
}
```

---

## 📊 FLUJO COMPLETO DE VENTA

```javascript
// 1. Crear venta
POST /api/sales/
{
  "client_id": 1,
  "payment_type": "credit",    // ✅ payment_type (era payment_method)
  "products": [
    { "type": "finishedproducts", "product_id": 1, "quantity": 5 }
  ]
}
// ✓ Stock descontado
// ✓ Si credit: aumenta currentdbt del cliente
// ✓ Si efectivo: ingreso registrado en cartera

// 2. Cliente paga parcialmente
POST /api/payments/
{
  "client_id": 1,
  "amount": 200,
  "payment_method": "caja_menor"
}
// ✓ Deuda reducida
// ✓ Dinero registrado en cartera

// 3. Cliente devuelve productos
POST /api/returns/
{
  "client_id": 1,
  "products": [{ "product_id": 1, "quantity": 1 }]
}
// ✓ Stock aumentado
// ✓ Deuda reducida

// 4. Cliente cambia productos
POST /api/exchanges/
{
  "client_id": 1,
  "incoming": [{ "product_id": 1, "quantity": 1 }],  // Entrega
  "outgoing": [{ "product_id": 2, "quantity": 1 }]   // Recibe
}
// ✓ Stock ajustado
// ✓ Deuda ajustada por diferencia
```

---

## ✨ VALIDACIONES IMPORTANTES

Todos los endpoints ahora validan:
- ✅ Tipos de datos correctos (numéricos, booleanos)
- ✅ Campos obligatorios
- ✅ Valores válidos para campos con restricciones
- ✅ Stock suficiente antes de operaciones
- ✅ Clientes/productos existen en BD
- ✅ Transacciones atómicas (COMMIT/ROLLBACK)

---

## 🚀 PRÓXIMA REVISIÓN RECOMENDADA

Verificar componentes frontend correspondientes para asegurar que:
1. Usan `payment_type` en lugar de `payment_method` ← CRÍTICO
2. Envían datos con estructura correcta
3. Manejan respuestas correctamente
4. Especifican `flour_id` y `masa_madre_id` si es necesario
