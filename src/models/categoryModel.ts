import { prisma } from '../../lib/prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { conflict } from '@hapi/boom';

export interface CategoryInput {
    nombre: string;
}

export async function findAll() {
    return await prisma.categoria.findMany({
        select: {
            IDCategoria: true,
            nombre: true
        },
        orderBy: {
            nombre: 'asc'
        },
    });
}

export async function findOne(id: number) {
    return await prisma.categoria.findUnique({
        select: {
            IDCategoria: true,
            nombre: true
        },
        where: {
            IDCategoria: id
        }
    });
}

export async function create(category: CategoryInput): Promise<number> {
    try {
        const created = await prisma.categoria.create({
            data: {
                nombre: category.nombre
            },
            select: {
                IDCategoria: true
            }
        })
    return created.IDCategoria;
} 
    catch(error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            throw conflict('Ya existe una categoria con ese nombre.')
        }
        throw error;
    }
}

export async function update(id: number, category: CategoryInput) {
    try {
        await prisma.categoria.update({
            data: {
                nombre: category.nombre
            },
            where: {
                IDCategoria: id
            }
        });
    return true;
    } catch(error) {
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') return false;
            if (error.code === 'P2002') {
                throw conflict('Ya existe una categoría con ese nombre')
            }
        }
        throw error
    }
}

export async function remove(id:number): Promise<Boolean>{
    try {
        await prisma.categoria.delete({
            where: {
                IDCategoria: id
            }
        });
    return true;
    }
    catch(error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return false;
        }
        throw error;
    }
}