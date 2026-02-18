# ✅ CHECKLIST VERIFICACIÓN PRODUCCIÓN - Render

## 1. VERIFICAR VARIABLES DE ENTORNO EN RENDER

### Para el Backend (appthianella-backend):
Ir a: **Render Dashboard → Select Service → Environment**

Debe tener:
```
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://[usuario]:[password]@dpg-d639llm8alac739un920-a:5432/[database_name]
```

❓ **TU DATABASE_URL DEBERÍA SER:**
```
DATABASE_URL=postgresql://[tu_usuario]:[tu_password]@dpg-d639llm8alac739un920-a.onrender.com:5432/[tu_db_name]
```

---

## 2. VERIFICAR QUE LOS CAMBIOS ESTÁN EN RENDER

### Los 6 cambios críticos que hicimos deben estar en producción:

#### ✅ Backend Changes Deployed:
- [ ] `backend/routes/purchases.js` → INSERT statement agregado (línea ~92)
- [ ] `backend/routes/sales.js` → payment_type (no payment_method)
- [ ] `backend/routes/wallet.js` → 3 cajas (caja_menor, caja_mayor, cuenta_bancaria)
- [ ] `backend/routes/history.js` → Campos corregidos (packages, sin cash)
- [ ] `backend/routes/recipes.js` → Validación 'usable' removida
- [ ] `backend/routes/dailyproduction.js` → Búsquedas flexibles

#### ✅ Frontend Changes Deployed:
- [ ] `src/components/Purchases.jsx` → POST usa 'packages' (no packages_qty)
- [ ] `src/components/EditPurchases.jsx` → 4 correcciones aplicadas
- [ ] `src/components/Sales.jsx` → Reset a 'caja_menor' (no 'cash')
- [ ] `src/components/EditSales.jsx` → Default 'caja_menor' (no 'cash')

---

## 3. TESTING EN PRODUCCIÓN

### Test 1: Backend Connectivity
```bash
curl https://appthianella-backend.onrender.com/api/clients/
Expected: Lista de clientes JSON (2xx status)
```

### Test 2: Wallet 3-Cajas ✅ CRITICAL
```bash
curl https://appthianella-backend.onrender.com/api/wallet/balance
Expected Response:
{
  "caja_menor": XXXX,
  "caja_mayor": XXXX,
  "cuenta_bancaria": XXXX,
  "total": XXXX
}
```
**Si FALLA:** Wallet no se inicializó correctamente

### Test 3: Compra POST ✅ CRITICAL  
```bash
curl -X POST https://appthianella-backend.onrender.com/api/purchases/ \
  -H "Content-Type: application/json" \
  -d '{"type":"rawmaterials","item_id":26,"packages":2}'
  
Expected: {"message":"Compra registrada correctamente"}
Status: 200
```
**Si FALLA:** El INSERT de purchases no está funcionando

### Test 4: Frontend Load
```
https://appthianella.onrender.com
Expected: App carga sin errores
Check Console: No debe haber errores de API_URL
```

---

## 4. SI HAY PROBLEMAS EN PRODUCCIÓN

### Problema: "Cannot connect to database"
**Solución:**
1. Verificar DATABASE_URL en Render tiene URL correcta
2. Asegurar que dpg-d639llm8alac739un920-a está activo
3. Test conexión: `psql [DATABASE_URL]`

### Problema: "Wallet no tiene 3 cajas"
**Solución:**
1. En Render, ejecutar: 
```sql
DELETE FROM company_wallet;
INSERT INTO company_wallet (tipo, balance) VALUES ('caja_menor', 0);
INSERT INTO company_wallet (tipo, balance) VALUES ('caja_mayor', 0);
INSERT INTO company_wallet (tipo, balance) VALUES ('cuenta_bancaria', 0);
```

### Problema: "Compra POST devuelve error"
**Solución:**
1. Verificar que purchases.js en Render tiene el INSERT (línea ~92)
2. Revisar logs: `Render → Select Backend → Logs`
3. Buscar errores SQL

### Problema: "Frontend devuelve 404 al API"
**Solución:**
1. Verificar que .env.production apunta a:
```
VITE_API_URL=https://appthianella-backend.onrender.com
```
2. Rebuild en Render (redeploy)

---

## 5. COMANDO PARA TESTEAR RÁPIDO (desde CLI)

```powershell
# Test todos los endpoints críticos
$backend = "https://appthianella-backend.onrender.com"

# 1. Clients
Invoke-WebRequest -Uri "$backend/api/clients/" -UseBasicParsing

# 2. Wallet Balance (verificar 3 cajas)
(Invoke-WebRequest -Uri "$backend/api/wallet/balance" -UseBasicParsing).Content | ConvertFrom-Json

# 3. CREATE PURCHASE
$data = '{"type":"rawmaterials","item_id":26,"packages":2}'
Invoke-WebRequest -Uri "$backend/api/purchases/" -Method POST `
  -Headers @{"Content-Type"="application/json"} -Body $data -UseBasicParsing
```

---

## 6. CHECKLIST FINAL

- [ ] DATABASE_URL configurada en Render (apunta a dpg-d639llm8alac739un920-a)
- [ ] 6 cambios backend están en código deployado
- [ ] 4 cambios frontend están en código deployado
- [ ] `/api/clients/` responde 200 OK
- [ ] `/api/wallet/balance` tiene 3 cajas (no 'cash')
- [ ] `POST /api/purchases/` devuelve 200 OK
- [ ] Frontend carga sin errores
- [ ] Frontend puede hacer login
- [ ] Crear compra → Se guarda en BD
- [ ] Crear venta → Se calcula payment_type correctamente

---

## 7. STATUS ACTUAL

**Si todo pasa en testing anterior:**
```
✅ PRODUCCIÓN LISTA
✅ TODOS LOS CAMBIOS DESPLEGADOS
✅ SISTEMA OPERATIVO
```

**Si hay fallos:**
```
⚠️ Revisar Render configuration
⚠️ Verificar DATABASE_URL
⚠️ Re-deploy si necesario
```

---

**¿Qué necesitas que verifique específicamente?**
