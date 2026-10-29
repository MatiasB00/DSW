import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows, SqlValue } from '../db';

export interface userInput {
  nombre: string,
  apellido: string,
  email: string,
  contraseniaHash: string,
  rol?: string
}


export async function findAll(): Promise<RowDataPacket[]> {
  return databaseOperation(() =>
    rows('SELECT IDUsuario, nombre, apellido, email, rol FROM Usuario ORDER BY IDUsuario')
  )
}

export async function findOne(id: number): Promise<RowDataPacket | undefined> {
  const found = await databaseOperation(() =>
    rows<RowDataPacket>('SELECT IDUsuario, nombre, apellido, email, rol FROM Usuario WHERE IDUsuario = ?', [id])
  );
  return found[0]
}

export async function create(user: userInput): Promise<number> {
  const values: SqlValue[] = [
    user.nombre,
    user.apellido,
    user.email,
    user.contraseniaHash,
    user.rol === undefined ? 'cliente' : user.rol
  ];

  return databaseOperation(async () => {
    const inserted = (await result(
      'INSERT INTO Usuario (nombre, apellido, email, contrasenia, rol) VALUES (?, ?, ?, ?, ?)', values
    )) as ResultSetHeader;
    return inserted.insertId;
  });
}

export async function update(id: number, user: userInput): Promise<boolean> {
  const values: SqlValue[] = [
    user.nombre,
    user.apellido,
    user.email,
    user.contraseniaHash,
    user.rol === undefined ? 'cliente' : user.rol
  ];

  return databaseOperation(async ()=> {
    const updated = await result(
      'UPDATE usuario SET nombre = ?, apellido = ?, email = ?, contrasenia = ?, rol = ? WHERE IDUsuario = ?',
      [...values, id]
    ) as ResultSetHeader;
    
    if (updated.affectedRows > 0) return true;

    return Boolean(await findOne(id)) // daria true si el update se hizo pero las filas eran iguales. false si no existe el user
  })
}

export async function remove(id: number): Promise <boolean> {
  return databaseOperation(async () => {
    const deleted = await result(
      'DELETE FROM usuario WHERE IDUsuario = ?', [id]
    ) as ResultSetHeader;

    return deleted.affectedRows > 0;
  })
}