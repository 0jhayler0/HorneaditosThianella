# 🔴 Problemas Encontrados en AppThianella

## 1. ❌ CRÍTICO: Falta endpoint GET para listar compras
**Ubicación:** `backend/routes/purchases.js`
**Problema:** EditPurchases.jsx intenta hacer `GET /api/purchases` para listar compras, pero no existe este endpoint.
**Endpoints disponibles actualmente:**
- `GET /api/purchases/items/:type` ← Solo items por tipo
- `POST /api/purchases` ← Crear
- `PUT /api/purchases/:id` ← Editar
- `DELETE /api/purchases/:id` ← Eliminar
**FALTA:**
- `GET /api/purchases` ← Listar todas las compras

**Frontend afectado:** `src/components/EditPurchases.jsx` línea 21
```javascript
fetch('https://appthianella-backend.onrender.com/api/purchases') // ❌ FALLA
```

---

## 2. ⚠️ Endpoint auth montado dos veces
**Ubicación:** `backend/src/index.js`
**Problema:** authRouter está montado en `/api` sin prefijo AND usuarios esperan `/api/users`
```javascript
app.use('/api', authRouter);  // Se monta en /api
// authRouter tiene: router.post('/users', ...)
// Resultado: POST /api/users ✅ Funciona correctamente
```
**Estatus:** ✅ Funciona, pero es confuso

---

## 3. ⚠️ Problemas potenciales de validación
**Ubicación:** Múltiples rutas
**Items sin validación de entrada:**
- `backend/routes/inventory.js` línea 25: `0 || null` es lógicamente incorrecto, siempre resulta en `0`
- `backend/routes/inventory.js` - Falta validación en múltiples endpoints PUT/DELETE

**Rutas sin validación:**
- `backend/routes/returns.js` - Sin validaciones de cantidad o stock
- `backend/routes/exchanges.js` - Sin validaciones

---

## 4. 🔴 Inconsistencia en respuestas API: Tabla `usable` vs `usables`
**Ubicación:** Múltiples rutas
**Problema:** Hay inconsistencia en el nombre de la tabla:
- `backend/routes/inventory.js`: usa `usable` (línea 76)
- `backend/routes/purchases.js`: usa `usable` (línea 15)
- `src/components/EditPurchases.jsx`: espera `usable` (línea 24)

**Pero en frontend:**
- `src/components/Inventory.jsx` línea 98: fetch `/api/usable` ✅
- Parece haber inconsistencia entre `usable` y `usables` en la BD

---

## 5. ⚠️ Validación incompleta en EditRecipes
**Ubicación:** `src/components/EditRecipes.jsx`
**Problema:**
- No valida si los ingredientes está duplicados
- No valida `quantity_per_unit > 0` antes de enviar
- No tiene manejo de errores si el fetch falla

---

## 6. 🟡 EditSales solo permite editar descuento y tipo de pago
**Ubicación:** `src/components/EditSales.jsx`
**Problema:** No se pueden editar:
- Cantidad de productos
- Productos incluidos en la venta
- Cliente de la venta

**Limitaciones en backend:** `backend/routes/sales.js` línea 159-169 solo actualiza `discount` y `payment_type`

---

## 7. 🟡 EditClients permite editar `currentdbt` (deuda)
**Ubicación:** `src/components/EditClients.jsx` línea 160
**Problema:** Permite editar la deuda manualmente, lo cual puede causar inconsistencias contables
```javascript
<input type='number' name='currentdbt' value={formData.currentdbt || 0} />
```

---

## 8. ⚠️ Sin manejo de errores HTTP en algunos fetch
**Ubicación:** `src/components/EditPurchases.jsx` línea 27-31
**Problema:** 
```javascript
const purchasesData = await purchasesRes.json() || [];
// ❌ Si purchasesRes NO es OK, still intenta parsear como JSON
// ✅ Debería: if (!purchasesRes.ok) throw error
```

---

## 9. 🔴 Falta endpoint GET `/api/purchases` (PRINCIPAL)
**Necesita agregarse en `backend/routes/purchases.js`:**
```javascript
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, type, item_id, packages_qty, total_cost, purchase_date 
      FROM purchases 
      ORDER BY purchase_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 10. 🟡 SQL Injection Risk: Query dinámica en inventory.js
**Ubicación:** `backend/routes/purchases.js` línea 25
**Problema:**
```javascript
const result = await pool.query(
  `SELECT * FROM ${tables[type]} ORDER BY name` // ← Validado, pero mejor usar parámetros
);
```

---

## RESUMEN DE PRIORIDADES:

### 🔴 CRÍTICO - Fix NOW:
1. Agregar `GET /api/purchases` endpoint para listar compras
2. Validación de entrada en todos los endpoints

### ⚠️ IMPORTANTE - Fix Soon:
3. Validar respuestas HTTP en frontend
4. Inconsistencia de tabla `usable` en BD

### 🟡 MINOR - Fix Later:
5. Mejorar EditSales para editar productos
6. No permitir editar `currentdbt` directamente
7. Agregar validación de duplicados en recetas
