-- Preserve existing movements; allow the distinct opening balance recorded
-- atomically when a listing is created. Manual adjustments still allow 3 types.
ALTER TABLE movements DROP CONSTRAINT movement_operation;
ALTER TABLE movements DROP CONSTRAINT movement_direction;
ALTER TABLE movements ADD CONSTRAINT movement_operation CHECK (operation IN ('replenishment','loss','count','initial'));
ALTER TABLE movements ADD CONSTRAINT movement_direction CHECK (
  operation = 'count' OR (operation = 'replenishment' AND quantity_delta > 0) OR
  (operation = 'loss' AND quantity_delta < 0) OR
  (operation = 'initial' AND before_stock = 0 AND quantity_delta > 0)
);
