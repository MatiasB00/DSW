import { conflict } from '@hapi/boom';
import bcrypt from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import * as userModel from '../models/userModel';

export interface UsuarioRegistroInput {
  nombre: string;
  apellido: string;
  email: string;
  contrasenia: string;
}

function isPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export async function findByEmail(email: string) {
  return prisma.usuario.findUnique({
    where: { email },
    select: {
      IDUsuario: true,
      nombre: true,
      apellido: true,
      email: true,
      contrasenia: true,
      rol: true,
    },
  });
}

export async function findById(id: number) {
  return prisma.usuario.findUnique({
    where: { IDUsuario: id },
    select: {
      IDUsuario: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
    },
  });
}

export async function create(datos: UsuarioRegistroInput) {
  const contraseniaHash = await bcrypt.hash(datos.contrasenia, 10);

  try {
    const IDUsuario = await userModel.create({
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      contraseniaHash,
    });

    return prisma.usuario.findUniqueOrThrow({
      where: { IDUsuario },
      select: {
        IDUsuario: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
    });
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      throw conflict('El email ya está registrado.');
    }
    throw error;
  }
}
