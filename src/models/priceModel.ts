import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { databaseOperation, rows, result } from '../db';

export interface PrecioItem {
    IDProducto: number;
    fechaDesde: string;
    valor: number;
}

export async function getHistorial(idProducto: number): Promise<RowDataPacket[]> {
    return databaseOperation(() =>
        rows(
            `SELECT IDProducto, fechaDesde, valor 
       FROM Precio 
       WHERE IDProducto = ? 
       ORDER BY fechaDesde DESC`,
            [idProducto]
        )
    );
}

export async function registrarNuevoPrecio(idProducto: number, valor: number): Promise<void> {
    return databaseOperation(async () => {
        await result(
            `INSERT INTO Precio (IDProducto, fechaDesde, valor) VALUES (?, NOW(), ?)`,
            [idProducto, valor]
        );
    });
}
