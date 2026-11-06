ALTER TABLE PreciosImpresiones
  ADD CONSTRAINT chk_preciosimpresiones_tamanio
  CHECK (tamanio IN ('A1', 'A2', 'A3', 'A4', 'A5', 'A6'));

ALTER TABLE PedidoImpresion
  ADD CONSTRAINT chk_pedidoimpresion_tamanio
  CHECK (tamanio IN ('A1', 'A2', 'A3', 'A4', 'A5', 'A6'));
