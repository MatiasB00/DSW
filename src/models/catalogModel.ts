import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows, SqlValue } from '../db';

export type CatalogResource = 'usuarios' | 'productos' | 'proveedores';

export interface CatalogInput {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
  descripcion?: string;
  cuit?: string;
  razonSocial?: string;
  telefono?: string;
  direccion?: string;
  IDProveedor?: number;
}

const resources = {
  usuarios: {
    table: 'Usuario',
    id: 'IDUsuario',
    fields: ['nombre', 'apellido', 'email', 'rol'],
  },
  proveedores: {
    table: 'Proveedor',
    id: 'IDProveedor',
    fields: ['cuit', 'razonSocial', 'email', 'telefono', 'direccion'],
  },
  productos: {
    table: 'Producto',
    id: 'IDProducto',
    fields: ['nombre', 'descripcion', 'IDProveedor'],
  },
} as const;

export async function list(resource: CatalogResource): Promise<RowDataPacket[]> {
  if (resource === 'productos') {
    return databaseOperation(() =>
      rows(`
        SELECT 
          p.IDProducto,
          p.nombre,
          p.descripcion,
          p.IDProveedor,
          pr.razonSocial AS proveedorNombre,
          COALESCE((
            SELECT prec.valor 
            FROM Precio prec 
            WHERE prec.IDProducto = p.IDProducto 
            ORDER BY prec.fechaDesde DESC 
            LIMIT 1
          ), 0) AS precio
        FROM Producto p
        LEFT JOIN Proveedor pr ON p.IDProveedor = pr.IDProveedor
        ORDER BY p.IDProducto
      `)
    );
  }

  const definition = resources[resource];
  return databaseOperation(() =>
    rows(`SELECT * FROM ${definition.table} ORDER BY ${definition.id}`),
  );
}

export async function find(
  resource: CatalogResource,
  id: number,
): Promise<RowDataPacket | undefined> {
  if (resource === 'productos') {
    const found = await databaseOperation(() =>
      rows<RowDataPacket>(
        `
        SELECT 
          p.IDProducto,
          p.nombre,
          p.descripcion,
          p.IDProveedor,
          pr.razonSocial AS proveedorNombre,
          COALESCE((
            SELECT prec.valor 
            FROM Precio prec 
            WHERE prec.IDProducto = p.IDProducto 
            ORDER BY prec.fechaDesde DESC 
            LIMIT 1
          ), 0) AS precio
        FROM Producto p
        LEFT JOIN Proveedor pr ON p.IDProveedor = pr.IDProveedor
        WHERE p.IDProducto = ?
      `,
        [id],
      ),
    );
    return found[0];
  }

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
  const values = fields.map((field) => {
    const val = input[field as keyof CatalogInput];
    return (val === undefined ? null : val) as SqlValue;
  });
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
  const values = fields.map((field) => {
    const val = input[field as keyof CatalogInput];
    return (val === undefined ? null : val) as SqlValue;
  });
  return databaseOperation(async () => {
    const updated = (await result(
      `UPDATE ${definition.table} SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE ${definition.id} = ?`,
      [...values, id],
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
