# 📋 ANÁLISIS COMPLETO DEL PROYECTO - ERRORES Y DISCREPANCIAS

## 🔴 PROBLEMAS CRÍTICOS ENCONTRADOS

---

## 1️⃣ **sales.js** - MÚLTIPLES INCONSISTENCIAS

### Problema 1: Payment Method vs Payment Type
**Línea 46 (POST):**
```javascript
const { client_id, products, payment_method, discount = 0 } = req.body;
```
**Línea 63:**
```javascript
[client_id, payment_method, discount]
```
**TABLA DE BD:** `sales` usa `payment_type` (NO `payment_method`)
- ❌ El destructuring usa `payment_method` pero debería ser `payment_type`
- ❌ El INSERT intenta guardar en `payment_type` pero con variable wrongly named

**Línea 163 (PUT):**
```javascript
const { discount, payment_type } = req.body;
```
**INCONCISTENCIA:** El POST espera `payment_method` pero el PUT espera `payment_type`

### Problema 2: Campos no usados
- `status` (existe en tabla) - nunca se usa
- `notes` (existe en tabla) - nunca se usa

**SOLUCIÓN:** 
- Cambiar todos `payment_method` a `payment_type`
- Aceptar `status` y `notes` opcionales en POST y PUT
- Usar valores válidos: `'credit'`, `'caja_menor'`, `'caja_mayor'`, `'cuenta_bancaria'`

---

## 2️⃣ **purchases.js** - ESTRUCTURA DE TABLA INCORRECTA

### Problema 1: Campo "packages_qty" NO EXISTE
**Tabla real:** `purchases` tiene `packages` (INT) y `units` (INT)
**Código:** Usa `packages_qty` en TODAS partes

Líneas afectadas:
- 8: `packages_qty`
- 52: `packages_qty`
- 56: `packages_qty`
- 75: `packages_qty`  
- 155: `packages_qty`
- 230: `packages_qty`
- 255: `packages_qty`

### Problema 2: INSERT en purchases NO EXISTE
El código actualiza stock de rawmaterials/supplies pero **NUNCA inserta un registro en la tabla `purchases`**
```javascript
// FALTA esto:
await client.query(
  `INSERT INTO purchases (type, item_id, packages, units, unit_cost, total_cost, purchase_date)
   VALUES ($1, $2, $3, $4, $5, $6, NOW())`
);
```

### Problema 3: Query GET espera campo inexistente
```javascript
const result = await pool.query(`
  SELECT id, type, item_id, packages_qty, total_cost, purchase_date 
  FROM purchases 
```
❌ `packages_qty` NO EXISTE

**SOLUCIÓN:**
- Decidir si usar `packages` o combinar `packages * uds`
- Añadir INSERT faltante en tabla purchases
- Actualizar todos los SELECT

---

## 3️⃣ **wallet.js** - INIT ENDPOINT ROMPE

### Problema: Falta campo `type` obligatorio
```javascript
await pool.query(`
  INSERT INTO company_wallet (balance)
  VALUES (0)
`);
```
**TABLA:** `company_wallet` tiene CHECK: `type IN ('caja_menor', 'caja_mayor', 'cuenta_bancaria')`
❌ Campo `type` es NOT NULL y no tiene DEFAULT

### Problema 2: Búsqueda de 'cash' inexistente
```javascript
WHERE payment_type = 'cash'
```
❌ En sales NO existe `payment_type = 'cash'`
✅ Valores correctos: `'credit'`, `'caja_menor'`, `'caja_mayor'`, `'cuenta_bancaria'`

**SOLUCIÓN:**
- Insertar con `type = 'caja_menor'` (o los 3 tipos)
- Cambiar búsqueda de `'cash'` a `'caja_menor'`, `'caja_mayor'`, `'cuenta_bancaria'`

---

## 4️⃣ **history.js** - MÚLTIPLES ERRORES

### Problema 1: Campo inexistente "packages_qty"
```javascript
SELECT ... packages_qty ...
FROM purchases
```
❌ Campo no existe en tabla

### Problema 2: Búsqueda de 'cash'
```javascript
WHERE payment_type = 'cash'
```
❌ Valor incorrecto

### Problema 3: Campo 'active' en clients
```javascript
WHERE active = true
```
❌ Campo `active` NO EXISTE en tabla `clients`

**SOLUCIÓN:**
- Remover búsqueda de `'cash'` y usar valores válidos
- Remover filtro `active = true`
- Cambiar `packages_qty` a nombres de campos correctos

---

## 5️⃣ **recipes.js** - VALIDACIÓN INCORRECTA

### Problema: Items con tipo 'usable' son rechazados
**Tabla `recipe_items`:** CHECK constraint: `item_type = ANY ('rawmaterial', 'supply')`
```javascript
else if (item.item_type === 'usable') {
  const usableCheck = await client.query(...);
  itemExists = usableCheck.rows.length > 0;
}
```
❌ El código permite `'usable'` pero la tabla lo rechaza

**SOLUCIÓN:**
- Remover validación de `'usable'`
- Solo aceptar `'rawmaterial'` y `'supply'`

---

## 6️⃣ **dailyproduction.js** - BÚSQUEDAS HARDCODEADAS FRÁGILES

### Problema 1: Búsqueda de Harina
```javascript
WHERE LOWER(name) LIKE '%Harina de Trigo%'
```
❌ Si el nombre es ligeramente diferente, FALLA

### Problema 2: Búsqueda de Masa Madre
```javascript
WHERE LOWER(name) = 'masa madre'
```
❌ Búsqueda exacta, sensible a espacios/mayúsculas

**SOLUCIÓN:**
- Crear tabla de "constantes de materias primas" O
- Permitir que el usuario especifique IDs en el request O
- Hacer búsquedas más robustas con ILIKE

---

## 7️⃣ **clients.js** - CAMPO INEXISTENTE

### Problema: Búsqueda de 'active' inexistente
```javascript
WHERE active = true
```
❌ Campo `active` NO EXISTE en tabla `clients`

**SOLUCIÓN:**
- Remover filtro en history.js que lo usa
- Si necesitas marcar clientes como inactivos, ADD COLUMN `active` a tabla

---

## 📊 RESUMEN DE CORRECCIONES NECESARIAS

| Archivo | Problema | Criticidad |
|---------|----------|-----------|
| **sales.js** | payment_method → payment_type | 🔴 CRÍTICA |
| **purchases.js** | packages_qty no existe, falta INSERT | 🔴 CRÍTICA |
| **wallet.js** | init sin type, búsqueda 'cash' | 🔴 CRÍTICA |
| **history.js** | packages_qty, 'cash', active | 🔴 CRÍTICA |
| **recipes.js** | Permite 'usable' cuando no debería | 🟡 MEDIA |
| **dailyproduction.js** | Búsquedas hardcodeadas frágiles | 🟡 MEDIA |
| **clients.js** | Usa campo 'active' inexistente | 🟡 MEDIA |

---

## ✅ ACCIONES RECOMENDADAS

1. **Priority 1 - CRÍTICA:** Corregir sales, purchases, wallet, history
2. **Priority 2 - MEDIA:** Corregir recipes, dailyproduction, clients
3. **Priority 3 - MEJORA:** Refactorizar searchs hardcodeadas en dailyproduction
