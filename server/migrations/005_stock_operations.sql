-- Existing adjustments defined an absolute stock count. Preserve their audit data.
ALTER TABLE movements ADD COLUMN operation text NOT NULL DEFAULT 'count';
ALTER TABLE movements ADD COLUMN quantity_delta integer;
UPDATE movements SET quantity_delta = after_stock - before_stock;
ALTER TABLE movements ALTER COLUMN quantity_delta SET NOT NULL;
ALTER TABLE movements ADD CONSTRAINT movement_operation CHECK (operation IN ('replenishment','loss','count'));
ALTER TABLE movements ADD CONSTRAINT movement_balances CHECK (before_stock BETWEEN 0 AND 999999 AND after_stock BETWEEN 0 AND 999999 AND quantity_delta = after_stock - before_stock);
ALTER TABLE movements ADD CONSTRAINT movement_direction CHECK (
  operation = 'count' OR (operation = 'replenishment' AND quantity_delta > 0) OR (operation = 'loss' AND quantity_delta < 0)
);
