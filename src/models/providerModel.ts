import { conflict } from '@hapi/boom';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export interface providerInput {
  cuit: string;
  razonSocial: string;
  email: string;
  telefono?: string | null;
  direccion?: string | null;
}

function isPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export async function findAll() {
  return prisma.proveedor.findMany({
    select: {
      IDProveedor: true,
      cuit: true,
      razonSocial: true,
      email: true,
      telefono: true,
      direccion: true,
    },
    orderBy: { IDProveedor: 'asc' },
  });
}

export async function findOne(id: number) {
  return prisma.proveedor.findUnique({
    select: {
      IDProveedor: true,
      cuit: true,
      razonSocial: true,
      email: true,
      telefono: true,
      direccion: true,
    },
    where: { IDProveedor: id },
  });
}

export async function create(provider: providerInput): Promise<number> {
  try {
    const created = await prisma.proveedor.create({
      data: {
        cuit: provider.cuit,
        razonSocial: provider.razonSocial,
        email: provider.email,
        telefono: provider.telefono ?? null,
        direccion: provider.direccion ?? null,
      },
      select: { IDProveedor: true },
    });
    return created.IDProveedor;
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      throw conflict('Ya existe un proveedor con ese CUIT o email.');
    }
    throw error;
  }
}

export async function update(id:number, provider: providerInput): Promise<boolean> {
  const data: Prisma.proveedorUncheckedUpdateInput = {
    cuit: provider.cuit,
    razonSocial: provider.razonSocial,
    email: provider.email,
    telefono: provider.telefono ?? null,
    direccion: provider.direccion ?? null,
  };

  try {
    await prisma.proveedor.update({
      where: { IDProveedor: id },
      data,
    });
    return true;
  } catch (error) {
    if (isPrismaError(error)) {
      if (error.code === 'P2025') return false;
      if (error.code === 'P2002') {
        throw conflict('Ya existe un proveedor con ese CUIT o email.');
      }
    }
    throw error;
  }
}

export async function remove(id: number): Promise<boolean> {
  try {
    await prisma.proveedor.delete({ where: { IDProveedor: id } });
    return true;
  } catch (error) {
    if (isPrismaError(error)) {
      if (error.code === 'P2025') return false;
      if (error.code === 'P2003') {
        throw conflict('No se puede eliminar un proveedor asociado a productos.');
      }
    }
    throw error;
  }
}
