import { conflict } from '@hapi/boom';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export interface PrintingPriceInput {
  tamanio: string;
  precioTamanio: number;
  precioByN: number;
  precioColor: number;
  factorGanancia?: number;
}

function isPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export async function findAll() {
  return prisma.preciosimpresiones.findMany({
    select: {
      fechaDesde: true,
      tamanio: true,
      precioTamanio: true,
      precioByN: true,
      precioColor: true,
      factorGanancia: true,
    },
    orderBy: [{ tamanio: 'asc' }, { fechaDesde: 'desc' }],
  });
}

export async function create(input: PrintingPriceInput): Promise<void> {
  const now = new Date();
  now.setMilliseconds(0);

  try {
    await prisma.$transaction(async (tx) => {
      const latest = await tx.preciosimpresiones.findFirst({ //encontrame el ultimo precio para este tamaño
        where: { tamanio: input.tamanio },
        orderBy: { fechaDesde: 'desc' },
        select: { fechaDesde: true },
      });

      const nextAfterLatest = latest // verifica si hubo un precio antes para ese tamaño o no. si existio, pone fecha de ese + 1 seg
        ? new Date(latest.fechaDesde.getTime() + 1000) //si nunca hubo, le pone la fecha y hora de ahora
        : now;
      const fechaDesde = nextAfterLatest > now ? nextAfterLatest : now;

      await tx.preciosimpresiones.create({
        data: {
          fechaDesde,
          tamanio: input.tamanio,
          precioTamanio: input.precioTamanio,
          precioByN: input.precioByN,
          precioColor: input.precioColor,
          factorGanancia: input.factorGanancia ?? 1,
        },
        select: { tamanio: true },
      });
    });
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      throw conflict('Ya existe un precio para ese tamaño y fecha.');
    }
    throw error;
  }
}

export async function update(
  originalSize: string,
  fechaDesde: string,
  input: PrintingPriceInput,
): Promise<boolean> {
  const fechaPrisma = new Date(fechaDesde);

  try {
    return await prisma.$transaction(async (tx) => {

      const current = await tx.preciosimpresiones.findUnique({ //checkea que existe para updatear
        where: {
          tamanio_fechaDesde: {
            tamanio: originalSize,
            fechaDesde: fechaPrisma
          }
        },
        select: { tamanio: true },
      });
      if (!current) return false;

      await tx.preciosimpresiones.update({ //hace el update 
        where: {
          tamanio_fechaDesde: {
            tamanio: originalSize,
            fechaDesde: fechaPrisma
          }
        },
        data: {
          tamanio: input.tamanio,
          precioTamanio: input.precioTamanio,
          precioByN: input.precioByN,
          precioColor: input.precioColor,
          factorGanancia: input.factorGanancia ?? 1,
        },
        select: { tamanio: true },
      });
      return true;
    });
  } catch (error) {
    if (isPrismaError(error)) {
      if (error.code === 'P2002') {
        throw conflict('Ya existe un precio para ese tamaño y fecha.');
      }
      if (error.code === 'P2003') {
        throw conflict('No se puede cambiar el tamaño: hay pedidos que usan este precio.');
      }
      if (error.code === 'P2025') return false;
    }
    throw error;
  }
}
