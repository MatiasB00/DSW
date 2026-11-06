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
  faz: 'simple' | 'doble';
  tamanio: string;
  tipoColor: 'blanco y negro' | 'color';
  observacion?: string | null;
}

export const ORDER_STATUSES = ['en preparacion', 'entregado', 'cancelado'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
const INITIAL_ORDER_STATUS: OrderStatus = 'en preparacion';

export interface CreateOrderInput {
  IDUsuario: number;
  fecha?: string;
  tipo: 'insumo' | 'impresion';
  items?: OrderItemInput[];
  impresion?: PrintOrderInput;
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
    throw Boom.badRequest('El importe ingresado está fuera de los límites permitidos.');
  }
  return cents;
}

function fromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

function printSubtotalCents(copies: number, price: RowDataPacket, tipoColor: 'blanco y negro' | 'color'): number {
  const sizePriceCents = toCents(price.precioTamanio as string);
  const copyPriceCents = toCents(
    (tipoColor === 'color' ? price.precioColor : price.precioByN) as string,
  );
  const factorHundredths = toCents(price.factorGanancia as string);
  const subtotalCents =
    (BigInt(copies) * BigInt(sizePriceCents + copyPriceCents) * BigInt(factorHundredths) + 50n) /
    100n;

  if (subtotalCents > BigInt(MAX_MONEY_CENTS)) {
    throw Boom.badRequest('El subtotal del pedido supera el máximo permitido.');
  }
  return Number(subtotalCents);
}

async function insertItems(
  connection: PoolConnection,
  orderId: number,
  items: OrderItemInput[],
): Promise<number> {
  let totalCents = 0;
  for (const item of items) {
    const productsStock = await rows<RowDataPacket>(
      'SELECT nombre, stock FROM Producto WHERE IDProducto = ? FOR UPDATE',
      [item.IDProducto],
      connection,
    );
    if (!productsStock[0]) {
      throw Boom.notFound(`El producto ${item.IDProducto} no tiene stock.`);
    }
    const prodActual = productsStock[0];
    if (prodActual.stock < item.cantidad) {
      throw Boom.badRequest(
        `Stock insuficiente para "${prodActual.nombre}". Stock disponible: ${prodActual.stock}, solicitado: ${item.cantidad}.`
      );
    }
    await result(
      'UPDATE Producto SET stock = stock - ? WHERE IDProducto = ?',
      [item.cantidad, item.IDProducto],
      connection,
    );
    const products = await rows<RowDataPacket>(
      `SELECT prec.valor AS precio
       FROM Precio prec
       WHERE prec.IDProducto = ?
       ORDER BY prec.fechaDesde DESC
       LIMIT 1
       FOR UPDATE`,
      [item.IDProducto],
      connection,
    );
    if (!products[0]) {
      throw Boom.notFound(`No existe precio configurado para el producto ${item.IDProducto}.`);
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

export async function findAll(userId?: number): Promise<RowDataPacket[]> {
  const whereClause = userId ? 'WHERE p.IDUsuario = ?' : '';
  const params: SqlValue[] = userId ? [userId] : [];
  return databaseOperation(() =>
    rows(
      `SELECT p.*, u.nombre AS usuarioNombre, u.apellido AS usuarioApellido, u.email AS usuarioEmail,
        CASE WHEN pi.IDPedido IS NOT NULL THEN 'impresion'
             WHEN pin.IDPedido IS NOT NULL THEN 'insumo' END AS tipo
       FROM Pedido p
       JOIN Usuario u ON u.IDUsuario = p.IDUsuario
       LEFT JOIN PedidoInsumo pin ON pin.IDPedido = p.IDPedido
       LEFT JOIN PedidoImpresion pi ON pi.IDPedido = p.IDPedido
       ${whereClause}
       ORDER BY p.IDPedido DESC`,
      params,
    ),
  );
}

export async function findOne(id: number): Promise<RowDataPacket | undefined> {
  const found = await databaseOperation(() =>
    rows<RowDataPacket>(
      `SELECT p.*, u.nombre AS usuarioNombre,
        CASE WHEN pi.IDPedido IS NOT NULL THEN 'impresion'
             WHEN pin.IDPedido IS NOT NULL THEN 'insumo' END AS tipo,
        pi.cantCopias, pi.faz, pi.tamanio, pi.tipoColor, pi.fechaPrecioDesde,
        pi.observacion,
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
        `SELECT pp.IDProducto, pr.nombre, pp.cantidad, ROUND(pp.subtotal / pp.cantidad, 2) AS precio, pp.subtotal
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
        [input.fecha ? new Date(input.fecha) : new Date(), INITIAL_ORDER_STATUS, input.IDUsuario],
        connection,
      )) as ResultSetHeader;
      const orderId = inserted.insertId;
      let totalCents: number;
      if (input.tipo === 'insumo') {
        await result('INSERT INTO PedidoInsumo (IDPedido) VALUES (?)', [orderId], connection);
        totalCents = await insertItems(connection, orderId, input.items ?? []);
      } else {
        const print = input.impresion!;
        const prices = await rows<RowDataPacket>(
          `SELECT DATE_FORMAT(fechaDesde, '%Y-%m-%d %H:%i:%s') AS fechaPrecioDesde,
                  precioTamanio, precioByN, precioColor, factorGanancia
           FROM PreciosImpresiones
           WHERE tamanio = ?
           ORDER BY fechaDesde DESC
           LIMIT 1
           FOR UPDATE`,
          [print.tamanio],
          connection,
        );
        if (!prices[0]) {
          throw Boom.badRequest(`No hay precios configurados para el tamaño ${print.tamanio}.`);
        }
        const price = prices[0];
        totalCents = printSubtotalCents(print.cantCopias, price, print.tipoColor);
        const subtotal = fromCents(totalCents);
        await result(
          `INSERT INTO PedidoImpresion
            (IDPedido, cantCopias, faz, tamanio, tipoColor, fechaPrecioDesde,
             observacion, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            print.cantCopias,
            print.faz,
            print.tamanio,
            print.tipoColor,
            price.fechaPrecioDesde as string,
            print.observacion ?? null,
            subtotal,
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

export async function update(id: number, estado: OrderStatus): Promise<boolean> {
  if (!ORDER_STATUSES.includes(estado)) {
    throw Boom.badRequest('El estado del pedido no es válido.');
  }
  return databaseOperation(() =>
    transaction(async (connection) => {
      const current = await rows<RowDataPacket>(
        'SELECT IDPedido FROM Pedido WHERE IDPedido = ? FOR UPDATE',
        [id],
        connection,
      );
      if (!current[0]) return false;
      await result('UPDATE Pedido SET estado = ? WHERE IDPedido = ?', [estado, id], connection);
      return true;
    }),
  );
}
