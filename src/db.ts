import mysql, { PoolConnection, QueryResult, RowDataPacket } from 'mysql2/promise';
import Boom from '@hapi/boom';

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'imprenta_mayorista',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: false,
});

export type SqlValue = string | number | Date | null;

export async function rows<T extends RowDataPacket>(
  sql: string,
  values: SqlValue[] = [],
  connection: PoolConnection | typeof pool = pool,
): Promise<T[]> {
  const [result] = await connection.execute<T[]>(sql, values);
  return result;
}

export async function result(
  sql: string,
  values: SqlValue[] = [],
  connection: PoolConnection | typeof pool = pool,
): Promise<QueryResult> {
  const [queryResult] = await connection.execute(sql, values);
  return queryResult;
}

export async function transaction<T>(
  action: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const value = await action(connection);
    await connection.commit();
    return value;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function databaseOperation<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ER_DUP_ENTRY') {
      throw Boom.conflict('Ya existe un registro con esos datos.');
    }
    if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_NO_REFERENCED_ROW_2') {
      throw Boom.conflict('La operación no se puede realizar por las relaciones existentes.');
    }
    if (
      code === 'ECONNREFUSED' ||
      code === 'ER_ACCESS_DENIED_ERROR' ||
      code === 'ENOTFOUND'
    ) {
      throw Boom.serverUnavailable(
        'No fue posible conectarse a MySQL. Verifique la configuración de conexión.',
      );
    }
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
