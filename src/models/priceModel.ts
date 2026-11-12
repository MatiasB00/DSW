import { Decimal } from '@prisma/client/runtime/client';
import { prisma } from '../../lib/prisma'
import { PrismaClientKnownRequestError } from '../../generated/prisma/internal/prismaNamespace';
import { conflict } from '@hapi/boom';


export interface PrecioItem {
    IDProducto: number;
    fechaDesde: Date;
    valor: Decimal;
}

export async function findAll(id: number) { //es un findAll, pero recibe ID xq busca todos los precios PARA UN PRODUCTO EN PARTICULAR
    return await prisma.precio.findMany({
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

export async function create(id: number, value: number) {
    try{ 
        await prisma.precio.create({
            data: {
                IDProducto: id,
                valor: value
            },
            select: {
                IDProducto: true
            }
        });
    return;
    } 
    catch(error) {
        if(error instanceof PrismaClientKnownRequestError){
            if (error.code === 'P2003') {
                throw conflict('El ID de producto no existe')
            }
            if (error.code === 'P2002') {
                throw conflict('El precio ya existe')
            }
        }
        throw error
    }
}