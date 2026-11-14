import { conflict } from '@hapi/boom';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export interface userInput {
  nombre: string;
  apellido: string;
  email: string;
  contraseniaHash: string;
}

function isPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export async function findAll() {
  return prisma.usuario.findMany({
    select: {
      IDUsuario: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
    },
    orderBy: { IDUsuario: 'asc' },
  });
}

export async function findOne(id: number) {
  return prisma.usuario.findUnique({
    select: {
      IDUsuario: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
    },
    where: { IDUsuario: id },
  });
}

export async function create(user: userInput): Promise<number> {
  try {
    const created = await prisma.usuario.create({
      data: {
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        contrasenia: user.contraseniaHash,
      },
      select: { IDUsuario: true },
    });
    return created.IDUsuario;
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      throw conflict('Ya existe un usuario con ese email.');
    }
    throw error;
  }
}

export async function update(id: number, user: userInput): Promise<boolean> {
  try {
    await prisma.usuario.update({
      where: { IDUsuario: id },
      data: {
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        contrasenia: user.contraseniaHash,
      },
    });
    return true;
  } catch (error) {
    if (isPrismaError(error)) {
      if (error.code === 'P2025') return false;
      if (error.code === 'P2002') {
        throw conflict('Ya existe un usuario con ese email.');
      }
    }
    throw error;
  }
}

export async function remove(id: number): Promise<boolean> {
  try {
    await prisma.usuario.delete({ where: { IDUsuario: id } });
    return true;
  } catch (error) {
    if (isPrismaError(error)) {
      if (error.code === 'P2025') return false;
      if (error.code === 'P2003') {
        throw conflict('No se puede eliminar un usuario que tiene pedidos.');
      }
    }
    throw error;
  }
}
