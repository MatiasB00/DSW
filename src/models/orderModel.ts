import Boom from '@hapi/boom';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows, SqlValue, transaction } from '../db';

const MAX_MONEY_CENTS = 999_999_999_999;

export interface OrderItemInput {
  IDProducto: number;
  cantidad: number;
}

export interface PrintOrderInput {
  cantCopias: number;
  faz: string;
  tamanio: string;
  archivo: string;
  observacion?: string | null;
  subtotal: number;
}

export type UpdatePrintOrderInput = Partial<PrintOrderInput>;

export interface CreateOrderInput {
  IDUsuario: number;
  fecha?: string;
  estado: string;
  tipo: 'insumo' | 'impresion';
  items?: OrderItemInput[];
  impresion?: PrintOrderInput;
}

export interface UpdateOrderInput {
  IDUsuario?: number;
  fecha?: string;
  estado?: string;
}

function toCents(value: string | number): number {
  const normalized = String(value);
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) throw Boom.badRequest('El importe debe tener hasta dos decimales.');
  return ensureMoney(
    Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')),
  );
}

function ensureMoney(cents: number): number {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_MONEY_CENTS) {
    throw Boom.badRequest('El importe supera el máximo permitido por la base de datos.');
  }
  return cents;
}

function fromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

async function insertItems(
  connection: PoolConnection,
  orderId: number,
  items: OrderItemInput[],
): Promise<number> {
  let totalCents = 0;
  for (const item of items) {
    const products = await rows<RowDataPacket>(
      'SELECT precio FROM Producto WHERE IDProducto = ? FOR UPDATE',
      [item.IDProducto],
      connection,
    );
    if (!products[0]) {
      throw Boom.notFound(`No existe el producto ${item.IDProducto}.`);
    }
    const subtotalCents = ensureMoney(
      toCents(products[0].precio as string) * item.cantidad,
    );
    totalCents = ensureMoney(totalCents + subtotalCents);
    await result(
      'INSERT INTO ProdPed (IDPedido, IDProducto, cantidad, subtotal) VALUES (?, ?, ?, ?)',
      [orderId, item.IDProducto, item.cantidad, fromCents(subtotalCents)],
      connection,
    );
  }
  return totalCents;
}

async function ensureUser(connection: PoolConnection, userId: number): Promise<void> {
  const users = await rows<RowDataPacket>(
    'SELECT IDUsuario FROM Usuario WHERE IDUsuario = ?',
    [userId],
    connection,
  );
  if (!users[0]) throw Boom.notFound(`No existe el usuario ${userId}.`);
}

export async function list(): Promise<RowDataPacket[]> {
  return databaseOperation(() =>
    rows(
      `SELECT p.*, u.nombre AS usuarioNombre,
        CASE WHEN pi.IDPedido IS NOT NULL THEN 'impresion'
             WHEN pin.IDPedido IS NOT NULL THEN 'insumo' END AS tipo
       FROM Pedido p
       JOIN Usuario u ON u.IDUsuario = p.IDUsuario
       LEFT JOIN PedidoInsumo pin ON pin.IDPedido = p.IDPedido
       LEFT JOIN PedidoImpresion pi ON pi.IDPedido = p.IDPedido
       ORDER BY p.IDPedido`,
    ),
  );
}

export async function find(id: number): Promise<RowDataPacket | undefined> {
  const found = await databaseOperation(() =>
    rows<RowDataPacket>(
      `SELECT p.*, u.nombre AS usuarioNombre,
        CASE WHEN pi.IDPedido IS NOT NULL THEN 'impresion'
             WHEN pin.IDPedido IS NOT NULL THEN 'insumo' END AS tipo,
        pi.cantCopias, pi.faz, pi.tamanio, pi.archivo, pi.observacion,
        pi.subtotal AS impresionSubtotal
       FROM Pedido p
       JOIN Usuario u ON u.IDUsuario = p.IDUsuario
       LEFT JOIN PedidoInsumo pin ON pin.IDPedido = p.IDPedido
       LEFT JOIN PedidoImpresion pi ON pi.IDPedido = p.IDPedido
       WHERE p.IDPedido = ?`,
      [id],
    ),
  );
  const order = found[0];
  if (!order) return undefined;
  if (order.tipo === 'insumo') {
    order.items = await databaseOperation(() =>
      rows(
        `SELECT pp.IDProducto, pr.nombre, pp.cantidad, pr.precio, pp.subtotal
         FROM ProdPed pp JOIN Producto pr ON pr.IDProducto = pp.IDProducto
         WHERE pp.IDPedido = ? ORDER BY pp.IDProducto`,
        [id],
      ),
    );
  }
  return order;
}

export async function create(input: CreateOrderInput): Promise<number> {
  return databaseOperation(() =>
    transaction(async (connection) => {
      await ensureUser(connection, input.IDUsuario);
      const inserted = (await result(
        'INSERT INTO Pedido (fecha, estado, total, IDUsuario) VALUES (?, ?, 0, ?)',
        [input.fecha ? new Date(input.fecha) : new Date(), input.estado, input.IDUsuario],
        connection,
      )) as ResultSetHeader;
      const orderId = inserted.insertId;
      let totalCents: number;
      if (input.tipo === 'insumo') {
        await result('INSERT INTO PedidoInsumo (IDPedido) VALUES (?)', [orderId], connection);
        totalCents = await insertItems(connection, orderId, input.items ?? []);
      } else {
        const print = input.impresion!;
        totalCents = toCents(print.subtotal);
        await result(
          `INSERT INTO PedidoImpresion
            (IDPedido, cantCopias, faz, tamanio, archivo, observacion, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            print.cantCopias,
            print.faz,
            print.tamanio,
            print.archivo,
            print.observacion ?? null,
            fromCents(totalCents),
          ],
          connection,
        );
      }
      await result('UPDATE Pedido SET total = ? WHERE IDPedido = ?', [
        fromCents(totalCents),
        orderId,
      ], connection);
      return orderId;
    }),
  );
}

export async function update(id: number, input: UpdateOrderInput): Promise<boolean> {
  return databaseOperation(() =>
    transaction(async (connection) => {
      const current = await rows<RowDataPacket>(
        'SELECT IDPedido, IDUsuario FROM Pedido WHERE IDPedido = ? FOR UPDATE',
        [id],
        connection,
      );
      if (!current[0]) return false;
      if (input.IDUsuario !== undefined) await ensureUser(connection, input.IDUsuario);
      const assignments: string[] = [];
      const values: SqlValue[] = [];
      if (input.IDUsuario !== undefined) {
        assignments.push('IDUsuario = ?');
        values.push(input.IDUsuario);
      }
      if (input.fecha !== undefined) {
        assignments.push('fecha = ?');
        values.push(new Date(input.fecha));
      }
      if (input.estado !== undefined) {
        assignments.push('estado = ?');
        values.push(input.estado);
      }
      if (assignments.length) {
        await result(`UPDATE Pedido SET ${assignments.join(', ')} WHERE IDPedido = ?`, [
          ...values,
          id,
        ], connection);
      }
      return true;
    }),
  );
}

export async function remove(id: number): Promise<boolean> {
  return databaseOperation(async () => {
    const deleted = (await result('DELETE FROM Pedido WHERE IDPedido = ?', [id])) as ResultSetHeader;
    return deleted.affectedRows > 0;
  });
}

export async function addItem(
  orderId: number,
  item: OrderItemInput,
): Promise<boolean> {
  return databaseOperation(() =>
    transaction(async (connection) => {
      const order = await rows<RowDataPacket>(
        `SELECT p.IDPedido, pin.IDPedido AS insumo
         FROM Pedido p JOIN PedidoInsumo pin ON pin.IDPedido = p.IDPedido
         WHERE p.IDPedido = ? FOR UPDATE`,
        [orderId],
        connection,
      );
      if (!order[0]) throw Boom.notFound('No existe un pedido de insumos con ese ID.');
      const total = await insertItems(connection, orderId, [item]);
      const current = await rows<RowDataPacket>(
        'SELECT total FROM Pedido WHERE IDPedido = ?',
        [orderId],
        connection,
      );
      const updatedCents = ensureMoney(toCents(current[0].total as string) + total);
      await result('UPDATE Pedido SET total = ? WHERE IDPedido = ?', [
        fromCents(updatedCents),
        orderId,
      ], connection);
      return true;
    }),
  );
}

export async function updateItem(
  orderId: number,
  productId: number,
  quantity: number,
): Promise<boolean> {
  return databaseOperation(() =>
    transaction(async (connection) => {
      const order = await rows<RowDataPacket>(
        `SELECT p.total FROM Pedido p JOIN PedidoInsumo pin ON pin.IDPedido = p.IDPedido
         WHERE p.IDPedido = ? FOR UPDATE`,
        [orderId],
        connection,
      );
      if (!order[0]) throw Boom.notFound('No existe un pedido de insumos con ese ID.');
      const lines = await rows<RowDataPacket>(
        `SELECT pp.subtotal, pr.precio FROM ProdPed pp
         JOIN Producto pr ON pr.IDProducto = pp.IDProducto
         WHERE pp.IDPedido = ? AND pp.IDProducto = ? FOR UPDATE`,
        [orderId, productId],
        connection,
      );
      if (!lines[0]) throw Boom.notFound('El producto no está incluido en este pedido.');
      const newLineCents = ensureMoney(toCents(lines[0].precio as string) * quantity);
      const newTotalCents = ensureMoney(
        toCents(order[0].total as string) -
        toCents(lines[0].subtotal as string) +
        newLineCents,
      );
      await result(
        'UPDATE ProdPed SET cantidad = ?, subtotal = ? WHERE IDPedido = ? AND IDProducto = ?',
        [quantity, fromCents(newLineCents), orderId, productId],
        connection,
      );
      await result('UPDATE Pedido SET total = ? WHERE IDPedido = ?', [
        fromCents(newTotalCents),
        orderId,
      ], connection);
      return true;
    }),
  );
}

export async function removeItem(orderId: number, productId: number): Promise<boolean> {
  return databaseOperation(() =>
    transaction(async (connection) => {
      const order = await rows<RowDataPacket>(
        `SELECT p.total FROM Pedido p JOIN PedidoInsumo pin ON pin.IDPedido = p.IDPedido
         WHERE p.IDPedido = ? FOR UPDATE`,
        [orderId],
        connection,
      );
      if (!order[0]) throw Boom.notFound('No existe un pedido de insumos con ese ID.');
      const lines = await rows<RowDataPacket>(
        'SELECT subtotal FROM ProdPed WHERE IDPedido = ? AND IDProducto = ? FOR UPDATE',
        [orderId, productId],
        connection,
      );
      if (!lines[0]) throw Boom.notFound('El producto no está incluido en este pedido.');
      const remaining = await rows<RowDataPacket>(
        'SELECT COUNT(*) AS cantidad FROM ProdPed WHERE IDPedido = ?',
        [orderId],
        connection,
      );
      if (Number(remaining[0].cantidad) <= 1) {
        throw Boom.conflict('Un pedido de insumos debe contener al menos un producto.');
      }
      await result('DELETE FROM ProdPed WHERE IDPedido = ? AND IDProducto = ?', [
        orderId,
        productId,
      ], connection);
      await result('UPDATE Pedido SET total = ? WHERE IDPedido = ?', [
        fromCents(
          ensureMoney(
            toCents(order[0].total as string) - toCents(lines[0].subtotal as string),
          ),
        ),
        orderId,
      ], connection);
      return true;
    }),
  );
}

export async function updatePrintDetails(
  orderId: number,
  input: UpdatePrintOrderInput,
): Promise<boolean> {
  return databaseOperation(() =>
    transaction(async (connection) => {
      const current = await rows<RowDataPacket>(
        `SELECT pi.IDPedido FROM PedidoImpresion pi
         WHERE pi.IDPedido = ? FOR UPDATE`,
        [orderId],
        connection,
      );
      if (!current[0]) throw Boom.notFound('No existe un pedido de impresión con ese ID.');

      const fields: Array<keyof PrintOrderInput> = [
        'cantCopias',
        'faz',
        'tamanio',
        'archivo',
        'observacion',
        'subtotal',
      ];
      const assignments: string[] = [];
      const values: SqlValue[] = [];
      for (const field of fields) {
        const value = input[field];
        if (value === undefined) continue;
        assignments.push(`${field} = ?`);
        values.push(field === 'subtotal' ? fromCents(toCents(value as number)) : value);
      }
      if (assignments.length) {
        await result(
          `UPDATE PedidoImpresion SET ${assignments.join(', ')} WHERE IDPedido = ?`,
          [...values, orderId],
          connection,
        );
      }
      if (input.subtotal !== undefined) {
        await result('UPDATE Pedido SET total = ? WHERE IDPedido = ?', [
          fromCents(toCents(input.subtotal)),
          orderId,
        ], connection);
      }
      return true;
    }),
  );
}
