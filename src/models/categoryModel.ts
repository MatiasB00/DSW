import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows, SqlValue } from '../db';
import { prisma } from '../../lib/prisma'
import { Prisma } from '../../generated/prisma/client';
import { conflict } from '@hapi/boom';

export interface CategoryInput {
    nombre: string;
}
//
//export async function findAll(): Promise<RowDataPacket[]> {
//    return databaseOperation(() =>
//        rows('SELECT IDCategoria, nombre FROM Categoria ORDER BY nombre ASC')
//    );
//}
//
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


//export async function findOne(id: number): Promise<RowDataPacket | undefined> {
//    const found = await databaseOperation(() =>
//        rows<RowDataPacket>('SELECT IDCategoria, nombre FROM Categoria WHERE IDCategoria = ?', [id])
//    );
//    return found[0];
//}

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


//export async function create(category: CategoryInput): Promise<number> {
//    return databaseOperation(async () => {
//        const inserted = (await result(
//            'INSERT INTO Categoria (nombre) VALUES (?)',
//            [category.nombre]
//        )) as ResultSetHeader;
//        return inserted.insertId;
//    });
//}

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
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            throw conflict('Ya existe una categoría con ese nombre.');
        }
        throw error;
    }
}

export async function update(id: number, category: CategoryInput): Promise<boolean> {
    return databaseOperation(async () => {
        const updated = (await result(
            'UPDATE Categoria SET nombre = ? WHERE IDCategoria = ?',
            [category.nombre, id]
        )) as ResultSetHeader;

        if (updated.affectedRows > 0) return true;
        return Boolean(await findOne(id));
    });
}

export async function remove(id: number): Promise<boolean> {
    return databaseOperation(async () => {
        const deleted = (await result(
            'DELETE FROM Categoria WHERE IDCategoria = ?',
            [id]
        )) as ResultSetHeader;
        return deleted.affectedRows > 0;
    });
}