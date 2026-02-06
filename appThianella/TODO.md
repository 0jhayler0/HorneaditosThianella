# TODO: Implementar sistema de tres cajas para pagos y ventas

## Database Changes
- [x] Alter company_wallet table: add 'type' field (caja_menor, caja_mayor, cuenta_bancaria)
- [x] Add payment_method field to payments table
- [x] Change payment_type to payment_method in sales table
- [x] Update wallet_movements table: add wallet_type field

## Backend Changes
- [x] Update payments.js route to handle payment_method and update appropriate wallet
- [x] Update sales.js route to handle payment_method and update appropriate wallet
- [x] Update wallet.js route to return balances for each box and filter movements by wallet_type

## Frontend Changes
- [x] Update Payments.jsx component to select payment_method
- [x] Update Sales.jsx component to select payment_method (change from cash/credit to three options)
- [x] Update Wallet.jsx component to display balances for each of the three boxes

## Testing
- [x] Test payment registration with different methods
- [x] Test sales with different payment methods
- [x] Verify wallet balances update correctly
- [x] Verify movements are logged with correct wallet_type

## Additional Features
- [x] Add edit buttons to supplies table (similar to raw materials)
- [x] Add edit buttons to usable items table (similar to raw materials)

## SQL Scripts to Run
```sql
-- Alter company_wallet table to add type field
ALTER TABLE company_wallet ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'caja_menor';
ALTER TABLE company_wallet ADD CONSTRAINT company_wallet_type_check CHECK (type IN ('caja_menor', 'caja_mayor', 'cuenta_bancaria'));

-- Insert records for the three wallets (run after altering the table)
INSERT INTO company_wallet (balance, type) VALUES (0, 'caja_menor') ON CONFLICT DO NOTHING;
INSERT INTO company_wallet (balance, type) VALUES (0, 'caja_mayor') ON CONFLICT DO NOTHING;
INSERT INTO company_wallet (balance, type) VALUES (0, 'cuenta_bancaria') ON CONFLICT DO NOTHING;

-- Add payment_method to payments table
ALTER TABLE payments ADD COLUMN payment_method VARCHAR(20) DEFAULT 'caja_menor';
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('caja_menor', 'caja_mayor', 'cuenta_bancaria'));

-- Add wallet_type to wallet_movements table
ALTER TABLE wallet_movements ADD COLUMN wallet_type VARCHAR(20);
ALTER TABLE wallet_movements ADD CONSTRAINT wallet_movements_wallet_type_check CHECK (wallet_type IN ('caja_menor', 'caja_mayor', 'cuenta_bancaria'));
```
