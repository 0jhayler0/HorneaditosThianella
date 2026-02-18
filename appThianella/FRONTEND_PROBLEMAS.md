# 🔍 ANÁLISIS FRONTEND - PROBLEMAS ENCONTRADOS

## Estado: ⚠️ 4 PROBLEMAS CRÍTICOS ENCONTRADOS

---

## 1️⃣ **Purchases.jsx** - 🔴 CRÍTICO

### Problema:
Envía `packages_qty` al backend pero backend espera `packages`

**Línea 39:**
```javascript
// ❌ INCORRECTO - Campo no existe en backend
body: JSON.stringify({
  type,
  item_id: parseInt(itemId),
  packages_qty: parseFloat(packagesQty)  // ← CAMPO EQUIVOCADO
})
```

### Solución:
Cambiar `packages_qty` a `packages`

```javascript
// ✅ CORRECTO
body: JSON.stringify({
  type,
  item_id: parseInt(itemId),
  packages: parseFloat(packagesQty)  // ← CORRECTO
})
```

### Impacto:
❌ Las compras **fallarán** con error 400 o serán rechazadas

---

## 2️⃣ **EditPurchases.jsx** - 🔴 CRÍTICO

### Problema:
Intenta recibir y enviar `packages_qty` que el backend ahora retorna como `packages`

**Línea 72:** Recibe data del backend
```javascript
// ❌ El backend ahora retorna 'packages', no 'packages_qty'
setFormData({
  type: purchase.type,
  item_id: purchase.item_id,
  packages_qty: purchase.packages_qty  // ← No existe, es 'packages'
});
```

**Línea 80:** Procesa el campo
```javascript
// ❌ Usa campo equivocado
[name]: name === 'packages_qty' ? parseFloat(value) : value
```

**Línea 214-215:** Input del formulario
```javascript
// ❌ Campo incorrecto
<input
  name='packages_qty'  // ← Debería ser 'packages'
  value={formData.packages_qty}  // ← Debería ser formData.packages
/>
```

**Línea 244:** Mostrar en tabla
```javascript
// ❌ Campo no existe
<td>{purchase.packages_qty}</td>  // ← Debería ser purchase.packages
```

### Solución:
Cambiar TODAS las referencias de `packages_qty` a `packages`

```javascript
// ✅ CORRECTO - En formData
setFormData({
  type: purchase.type,
  item_id: purchase.item_id,
  packages: purchase.packages  // ← CORRECTO
});

// ✅ CORRECTO - En handleChange
[name]: name === 'packages' ? parseFloat(value) : value

// ✅ CORRECTO - En input
<input name='packages' value={formData.packages} />

// ✅ CORRECTO - En tabla
<td>{purchase.packages}</td>
```

### Impacto:
❌ **No puede editar compras** - Los campos serán undefined

---

## 3️⃣ **Sales.jsx** - 🔴 CRÍTICO

### Problema:
Usa `'cash'` como valor de payment_type pero no existe en backend

**Línea 121:**
```javascript
// ❌ INCORRECTO - Valor 'cash' no existe en BD
setPaymentType('cash');
```

### Contexto:
- Línea 18: Inicia con `setPaymentType('caja_menor')`
- Línea 121: Pero luego lo resetea a `'cash'`
- Línea 105: Envía payment_type al backend

**Valores válidos en BD:**
- `'credit'` - A crédito
- `'caja_menor'` - Caja menor
- `'caja_mayor'` - Caja mayor
- `'cuenta_bancaria'` - Banco

### Solución:
```javascript
// ✅ CORRECTO - Usar valor válido
setPaymentType('caja_menor');
```

### Impacto:
⚠️ Las ventas podrían ser rechazadas si payment_type = 'cash'

---

## 4️⃣ **EditSales.jsx** - 🔴 CRÍTICO

### Problema:
Usa `'cash'` como default para payment_type

**Línea 36:**
```javascript
// ❌ INCORRECTO - Valor 'cash' no existe
payment_type: sale.payment_type || 'cash'
```

### Solución:
```javascript
// ✅ CORRECTO - Usar valor válido
payment_type: sale.payment_type || 'caja_menor'
```

### Impacto:
⚠️ Al editar una venta sin payment_type, asignaría 'cash' (inválido)

---

## 5️⃣ **History.jsx** - ⚠️ POTENCIAL PROBLEMA

### Observación:
Define filtro `payment_method` en línea 22:
```javascript
payment_method: ''
```

Pero el endpoint de `/api/history/payments` retorna `payment_method` según la BD.
Esto está **PROBABLEMENTE BIEN** porque:
- La tabla `payments` en BD tiene `payment_method` (no `payment_type`)
- El filtro es local en frontend

**Verificar:** Que el backend de history.js no intente buscar por `payment_type` en tabla `payments`

---

## 📊 RESUMEN DE CORRECCIONES NECESARIAS

| Archivo | Campo | Antes | Después | Línea |
|---------|-------|-------|---------|-------|
| **Purchases.jsx** | POST body | `packages_qty` | `packages` | 39 |
| **EditPurchases.jsx** | formData | `packages_qty` | `packages` | 72, 80, 214, 244 |
| **Sales.jsx** | setPaymentType | `'cash'` | `'caja_menor'` | 121 |
| **EditSales.jsx** | default value | `'cash'` | `'caja_menor'` | 36 |

---

## 🎯 PRIORIDAD

### 🔴 CRÍTICA (Rompe funcionalidad)
1. Purchases.jsx - Las compras no se registran
2. EditPurchases.jsx - No se pueden editar compras
3. Sales.jsx - Posible error en nuevas ventas
4. EditSales.jsx - Posible error al editar ventas

### 🟡 MEDIA (Verificar)
5. History.jsx - Revisar endpoint `/api/history/payments`

---

## ✅ CORRECCIONES A REALIZAR

### 1. Purchases.jsx - Línea 39
```javascript
// ANTES:
packages_qty: parseFloat(packagesQty)

// DESPUÉS:
packages: parseFloat(packagesQty)
```

### 2. EditPurchases.jsx - 4 cambios
```javascript
// ANTES (Línea 72):
packages_qty: purchase.packages_qty

// DESPUÉS:
packages: purchase.packages

---

// ANTES (Línea 80):
[name]: name === 'packages_qty' ? parseFloat(value) : value

// DESPUÉS:
[name]: name === 'packages' ? parseFloat(value) : value

---

// ANTES (Línea 214-215):
name='packages_qty'
value={formData.packages_qty}

// DESPUÉS:
name='packages'
value={formData.packages}

---

// ANTES (Línea 244):
<td>{purchase.packages_qty}</td>

// DESPUÉS:
<td>{purchase.packages}</td>
```

### 3. Sales.jsx - Línea 121
```javascript
// ANTES:
setPaymentType('cash');

// DESPUÉS:
setPaymentType('caja_menor');
```

### 4. EditSales.jsx - Línea 36
```javascript
// ANTES:
payment_type: sale.payment_type || 'cash'

// DESPUÉS:
payment_type: sale.payment_type || 'caja_menor'
```

---

## 🔗 REFERENCIAS

- Backend: `sales.js` - Valida `payment_type IN ('credit', 'caja_menor', 'caja_mayor', 'cuenta_bancaria')`
- Backend: `purchases.js` - Usa `packages` e `units` (NO `packages_qty`)
- BD: `payments.payment_method` - Válido en esta tabla
- BD: `sales.payment_type` - Es el campo correcto

---

## ⚠️ PRÓXIMOS PASOS

1. ✅ Aplicar estas 4 correcciones
2. ✅ Probar crear compra
3. ✅ Probar editar compra
4. ✅ Probar crear venta
5. ✅ Probar editar venta
6. ⏳ Verificar History.jsx para payments
