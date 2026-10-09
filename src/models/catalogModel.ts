import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows, SqlValue } from '../db';

export type CatalogResource = 'usuarios' | 'productos';

export interface CatalogInput {
  nombre: string;
  apellido?: string;
  email?: string;
  rol?: string;
  descripcion?: string;
  precio?: number;
}

const resources = {
  usuarios: {
    table: 'Usuario',
    id: 'IDUsuario',
    fields: ['nombre', 'apellido', 'email', 'rol'],
  },
  productos: {
    table: 'Producto',
    id: 'IDProducto',
    fields: ['nombre', 'descripcion', 'precio'],
  },
} as const;

export async function list(resource: CatalogResource): Promise<RowDataPacket[]> {
  const definition = resources[resource];
  return databaseOperation(() =>
    rows(`SELECT * FROM ${definition.table} ORDER BY ${definition.id}`),
  );
}

export async function find(
  resource: CatalogResource,
  id: number,
): Promise<RowDataPacket | undefined> {
  const definition = resources[resource];
  const found = await databaseOperation(() =>
    rows<RowDataPacket>(
      `SELECT * FROM ${definition.table} WHERE ${definition.id} = ?`,
      [id],
    ),
  );
  return found[0];
}

export async function create(
  resource: CatalogResource,
  input: CatalogInput,
): Promise<number> {
  const definition = resources[resource];
  const fields = definition.fields;
  const values = fields.map((field) => input[field as keyof CatalogInput] as SqlValue);
  return databaseOperation(async () => {
    const inserted = (await result(
      `INSERT INTO ${definition.table} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
      values,
    )) as ResultSetHeader;
    return inserted.insertId;
  });
}

export async function update(
  resource: CatalogResource,
  id: number,
  input: CatalogInput,
): Promise<boolean> {
  const definition = resources[resource];
  const fields = definition.fields;
  return databaseOperation(async () => {
    const updated = (await result(
      `UPDATE ${definition.table} SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE ${definition.id} = ?`,
      [...fields.map((field) => input[field as keyof CatalogInput] as SqlValue), id],
    )) as ResultSetHeader;
    if (updated.affectedRows > 0) return true;
    return Boolean(await find(resource, id));
  });
}

export async function remove(resource: CatalogResource, id: number): Promise<boolean> {
  const definition = resources[resource];
  return databaseOperation(async () => {
    const deleted = (await result(
      `DELETE FROM ${definition.table} WHERE ${definition.id} = ?`,
      [id],
    )) as ResultSetHeader;
    return deleted.affectedRows > 0;
  });
}
