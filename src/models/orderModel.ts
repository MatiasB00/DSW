import Boom from '@hapi/boom';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

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

function toCents(value: string | number | Prisma.Decimal): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw Boom.badRequest('El importe debe tener hasta dos decimales.');
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_MONEY_CENTS) {
    throw Boom.badRequest('El importe ingresado está fuera de los límites permitidos.');
  }
  return cents;
}

function ensureTotal(cents: number): number {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_MONEY_CENTS) {
    throw Boom.badRequest('El subtotal del pedido supera el máximo permitido.');
  }
  return cents;
}

function fromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

function printSubtotalCents(
  copies: number,
  price: {
    precioTamanio: Prisma.Decimal;
    precioByN: Prisma.Decimal;
    precioColor: Prisma.Decimal;
    factorGanancia: Prisma.Decimal;
  },
  tipoColor: PrintOrderInput['tipoColor'],
): number {
  const sizePriceCents = toCents(price.precioTamanio);
  const copyPriceCents = toCents(
    tipoColor === 'color' ? price.precioColor : price.precioByN,
  );
  const factorHundredths = toCents(price.factorGanancia);
  const subtotalCents =
    (BigInt(copies) * BigInt(sizePriceCents + copyPriceCents) *
      BigInt(factorHundredths) + 50n) / 100n;

  if (subtotalCents > BigInt(MAX_MONEY_CENTS)) {
    throw Boom.badRequest('El subtotal del pedido supera el máximo permitido.');
  }
  return Number(subtotalCents);
}

export async function findAll(userId?: number) {
  const orders = await prisma.pedido.findMany({
    where: userId === undefined ? undefined : { IDUsuario: userId },
    select: {
      IDPedido: true,
      fecha: true,
      estado: true,
      total: true,
      IDUsuario: true,
      usuario: {
        select: {
          nombre: true,
          apellido: true,
          email: true,
        },
      },
      pedidoimpresion: { select: { IDPedido: true } },
      pedidoinsumo: { select: { IDPedido: true } },
    },
    orderBy: { IDPedido: 'desc' },
  });

  return orders.map((order) => ({
    IDPedido: order.IDPedido,
    fecha: order.fecha,
    estado: order.estado,
    total: order.total,
    IDUsuario: order.IDUsuario,
    usuarioNombre: order.usuario.nombre,
    usuarioApellido: order.usuario.apellido,
    usuarioEmail: order.usuario.email,
    tipo: order.pedidoimpresion ? 'impresion' as const : 'insumo' as const,
  }));
}

export async function findOne(id: number) {
  const order = await prisma.pedido.findUnique({
    where: { IDPedido: id },
    select: {
      IDPedido: true,
      fecha: true,
      estado: true,
      total: true,
      IDUsuario: true,
      usuario: { select: { nombre: true } },
      pedidoimpresion: {
        select: {
          cantCopias: true,
          faz: true,
          tamanio: true,
          tipoColor: true,
          fechaPrecioDesde: true,
          observacion: true,
          subtotal: true,
        },
      },
      pedidoinsumo: {
        select: {
          prodped: {
            select: {
              IDProducto: true,
              cantidad: true,
              subtotal: true,
              producto: { select: { nombre: true } },
            },
            orderBy: { IDProducto: 'asc' },
          },
        },
      },
    },
  });
  if (!order) return undefined;

  if (order.pedidoimpresion) {
    return {
      IDPedido: order.IDPedido,
      fecha: order.fecha,
      estado: order.estado,
      total: order.total,
      IDUsuario: order.IDUsuario,
      usuarioNombre: order.usuario.nombre,
      tipo: 'impresion' as const,
      cantCopias: order.pedidoimpresion.cantCopias,
      faz: order.pedidoimpresion.faz,
      tamanio: order.pedidoimpresion.tamanio,
      tipoColor: order.pedidoimpresion.tipoColor === 'blanco_y_negro'
        ? 'blanco y negro'
        : 'color',
      fechaPrecioDesde: order.pedidoimpresion.fechaPrecioDesde,
      observacion: order.pedidoimpresion.observacion,
      impresionSubtotal: order.pedidoimpresion.subtotal,
    };
  }

  return {
    IDPedido: order.IDPedido,
    fecha: order.fecha,
    estado: order.estado,
    total: order.total,
    IDUsuario: order.IDUsuario,
    usuarioNombre: order.usuario.nombre,
    tipo: 'insumo' as const,
    items: (order.pedidoinsumo?.prodped ?? []).map((item) => ({
      IDProducto: item.IDProducto,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio: Number(item.subtotal.div(item.cantidad).toFixed(2)),
      subtotal: item.subtotal,
    })),
  };
}

export async function create(input: CreateOrderInput): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.usuario.findUnique({
      where: { IDUsuario: input.IDUsuario },
      select: { IDUsuario: true },
    });
    if (!user) throw Boom.notFound(`No existe el usuario ${input.IDUsuario}.`);

    const order = await tx.pedido.create({
      data: {
        fecha: input.fecha ? new Date(input.fecha) : new Date(),
        estado: INITIAL_ORDER_STATUS,
        total: '0.00',
        IDUsuario: input.IDUsuario,
      },
      select: { IDPedido: true },
    });

    let totalCents: number;
    if (input.tipo === 'insumo') {
      if (!input.items?.length) {
        throw Boom.badRequest('El pedido de insumos debe incluir al menos un producto.');
      }

      await tx.pedidoinsumo.create({
        data: { IDPedido: order.IDPedido },
      });

      totalCents = 0;
      for (const item of input.items) {
        const product = await tx.producto.findUnique({
          where: { IDProducto: item.IDProducto },
          select: { nombre: true },
        });
        if (!product) {
          throw Boom.notFound(`No existe el producto ${item.IDProducto}.`);
        }

        const stockUpdate = await tx.producto.updateMany({
          where: {
            IDProducto: item.IDProducto,
            stock: { gte: item.cantidad },
          },
          data: { stock: { decrement: item.cantidad } },
        });
        if (stockUpdate.count === 0) {
          const current = await tx.producto.findUnique({
            where: { IDProducto: item.IDProducto },
            select: { stock: true },
          });
          if (!current) throw Boom.notFound(`No existe el producto ${item.IDProducto}.`);
          throw Boom.badRequest(
            `Stock insuficiente para "${product.nombre}". Stock disponible: ${current.stock}, solicitado: ${item.cantidad}.`,
          );
        }

        const price = await tx.precio.findFirst({
          where: { IDProducto: item.IDProducto },
          orderBy: { fechaDesde: 'desc' },
          select: { valor: true },
        });
        if (!price) {
          throw Boom.notFound(`No existe precio configurado para el producto ${item.IDProducto}.`);
        }

        const subtotalCents = ensureTotal(toCents(price.valor) * item.cantidad);
        totalCents = ensureTotal(totalCents + subtotalCents);
        await tx.prodped.create({
          data: {
            IDPedido: order.IDPedido,
            IDProducto: item.IDProducto,
            cantidad: item.cantidad,
            subtotal: fromCents(subtotalCents),
          },
        });
      }
    } else {
      const print = input.impresion;
      if (!print) throw Boom.badRequest('Faltan los datos del pedido de impresión.');

      const price = await tx.preciosimpresiones.findFirst({
        where: { tamanio: print.tamanio },
        orderBy: { fechaDesde: 'desc' },
        select: {
          fechaDesde: true,
          precioTamanio: true,
          precioByN: true,
          precioColor: true,
          factorGanancia: true,
        },
      });
      if (!price) {
        throw Boom.badRequest(`No hay precios configurados para el tamaño ${print.tamanio}.`);
      }

      totalCents = printSubtotalCents(print.cantCopias, price, print.tipoColor);
      await tx.pedidoimpresion.create({
        data: {
          IDPedido: order.IDPedido,
          cantCopias: print.cantCopias,
          faz: print.faz,
          tamanio: print.tamanio,
          tipoColor: print.tipoColor === 'blanco y negro' ? 'blanco_y_negro' : 'color',
          fechaPrecioDesde: price.fechaDesde,
          observacion: print.observacion ?? null,
          subtotal: fromCents(totalCents),
        },
      });
    }

    await tx.pedido.update({
      where: { IDPedido: order.IDPedido },
      data: { total: fromCents(totalCents) },
    });

    return order.IDPedido;
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw Boom.conflict('El pedido contiene productos repetidos.');
      }
      if (error.code === 'P2003') {
        throw Boom.conflict('No se puede completar el pedido por una relación inválida.');
      }
    }
    throw error;
  });
}

export async function update(id: number, estado: OrderStatus): Promise<boolean> {
  if (!ORDER_STATUSES.includes(estado)) {
    throw Boom.badRequest('El estado del pedido no es válido.');
  }

  try {
    await prisma.pedido.update({
      where: { IDPedido: id },
      data: { estado },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return false;
    }
    throw error;
  }
}
