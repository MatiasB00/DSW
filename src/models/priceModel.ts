import { conflict } from '@hapi/boom';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';


export interface PrecioItem {
    IDProducto: number;
    fechaDesde: Date;
    valor: Prisma.Decimal;
}

export async function findAll(id: number) {
    return prisma.precio.findMany({
        select: {
            IDProducto: true,
            fechaDesde: true,
            valor: true
        },
        where: {
            IDProducto: id
        },
        orderBy: {
            fechaDesde: 'desc'
        }
    });
}

export async function create(id: number, value: number): Promise<void> {
    try {
        await prisma.precio.create({
            data: {
                IDProducto: id,
                valor: value
            },
            select: {
                IDProducto: true
            }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                throw conflict('El ID de producto no existe.');
            }
            if (error.code === 'P2002') {
                throw conflict('El precio ya existe.');
            }
        }
        throw error;
    }
}