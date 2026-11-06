import Boom from '@hapi/boom';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows, transaction } from '../db';

export interface PrintingPriceInput {
  tamanio: string;
  precioTamanio: number;
  precioByN: number;
  precioColor: number;
  factorGanancia?: number;
}

export interface PrintingPriceRow extends RowDataPacket {
  fechaDesde: string;
  tamanio: string;
  precioTamanio: string | number;
  precioByN: string | number;
  precioColor: string | number;
  factorGanancia: string | number;
}

export async function findAll(): Promise<PrintingPriceRow[]> {
  return databaseOperation(() =>
    rows<PrintingPriceRow>(
      `SELECT DATE_FORMAT(fechaDesde, '%Y-%m-%d %H:%i:%s') AS fechaDesde,
              tamanio, precioTamanio, precioByN, precioColor, factorGanancia
       FROM PreciosImpresiones
       ORDER BY tamanio, fechaDesde DESC`,
    ),
  );
}

export async function create(input: PrintingPriceInput): Promise<void> {
  await databaseOperation(async () => {
    await result(
      `INSERT INTO PreciosImpresiones
         (fechaDesde, tamanio, precioTamanio, precioByN, precioColor, factorGanancia)
       SELECT GREATEST(
                CURRENT_TIMESTAMP,
                COALESCE(DATE_ADD(MAX(fechaDesde), INTERVAL 1 SECOND), CURRENT_TIMESTAMP)
              ),
              ?, ?, ?, ?, ?
       FROM PreciosImpresiones
       WHERE tamanio = ?`,
      [
        input.tamanio,
        input.precioTamanio,
        input.precioByN,
        input.precioColor,
        input.factorGanancia ?? 1,
        input.tamanio,
      ],
    );
  });
}

export async function update(
  originalTamanio: string,
  fechaDesde: string,
  input: PrintingPriceInput,
): Promise<boolean> {
  return databaseOperation(() =>
    transaction(async (connection) => {
      const current = await rows<RowDataPacket>(
        `SELECT tamanio FROM PreciosImpresiones
         WHERE tamanio = ? AND fechaDesde = ? FOR UPDATE`,
        [originalTamanio, fechaDesde],
        connection,
      );
      if (!current[0]) return false;

      if (input.tamanio !== originalTamanio) {
        const duplicate = await rows<RowDataPacket>(
          `SELECT tamanio FROM PreciosImpresiones
           WHERE tamanio = ? AND fechaDesde = ? FOR UPDATE`,
          [input.tamanio, fechaDesde],
          connection,
        );
        if (duplicate[0]) {
          throw Boom.conflict('Ya existe un precio para ese tamaño y fecha.');
        }
      }

      const updated = (await result(
        `UPDATE PreciosImpresiones
         SET tamanio = ?, precioTamanio = ?, precioByN = ?, precioColor = ?, factorGanancia = ?
         WHERE tamanio = ? AND fechaDesde = ?`,
        [
          input.tamanio,
          input.precioTamanio,
          input.precioByN,
          input.precioColor,
          input.factorGanancia ?? 1,
          originalTamanio,
          fechaDesde,
        ],
        connection,
      )) as ResultSetHeader;

      return updated.affectedRows > 0 || Boolean(current[0]);
    }),
  );
}
