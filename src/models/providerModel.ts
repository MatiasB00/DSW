import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows, SqlValue } from '../db';

export interface providerInput {
  cuit: string,
  razonSocial: string,
  email: string,
  telefono?: string | null
  direccion?: string | null
}


export async function findAll(): Promise<RowDataPacket[]> {
  return databaseOperation(() =>
    rows('SELECT IDProveedor, cuit, razonSocial, email, telefono, direccion FROM Proveedor ORDER BY IDProveedor')
  )
}

export async function findOne(id: number): Promise<RowDataPacket | undefined> {
  const found = await databaseOperation(() =>
    rows<RowDataPacket>('SELECT IDProveedor, cuit, razonSocial, email, telefono, direccion FROM Proveedor WHERE IDProveedor = ?', [id])
  );
  return found[0]
}

export async function create(provider: providerInput): Promise<number> {
  const values: SqlValue[] = [
    provider.cuit,
    provider.razonSocial,
    provider.email,
    provider.telefono ?? null,
    provider.direccion ?? null
  ];

  return databaseOperation(async () => {
    const inserted = (await result(
      'INSERT INTO Proveedor (cuit, razonSocial, email, telefono, direccion) VALUES (?, ?, ?, ?, ?)', values
    )) as ResultSetHeader;
    return inserted.insertId;
  });
}

export async function update(id: number, provider: providerInput): Promise<boolean> {
  
  const campos = ['cuit = ?', 'razonSocial = ?', 'email = ?']
  const values: SqlValue[] = [
    provider.cuit,
    provider.razonSocial,
    provider.email
  ];

  if (provider.telefono !== undefined) {
    campos.push('telefono = ?')
    values.push(provider.telefono)
  }

if (provider.direccion !== undefined) {
    campos.push('direccion = ?')
    values.push(provider.direccion)
  }

  return databaseOperation(async ()=> {
    const updated = await result(
      `UPDATE Proveedor SET ${campos.join(',')} WHERE IDProveedor = ?`,
      [...values, id]
    ) as ResultSetHeader;
    
    if (updated.affectedRows > 0) return true;

    return Boolean(await findOne(id)) // daria true si el update se hizo pero las filas eran iguales. false si no existe el provider
  })
}

export async function remove(id: number): Promise <boolean> {
  return databaseOperation(async () => {
    const deleted = await result(
      'DELETE FROM Provider WHERE IDProveedor = ?', [id]
    ) as ResultSetHeader;

    return deleted.affectedRows > 0;
  })
}