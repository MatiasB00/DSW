import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows, SqlValue } from '../db';


export interface productInput {
  nombre: string,
  descripcion: string,
  IDProveedor?: number | null
}

export async function findAll(): Promise <RowDataPacket[]> {
  return databaseOperation(()=>
    rows(`
      SELECT p.IDProducto, p.nombre, p.descripcion, p.IDProveedor, pr.razonSocial AS proveedorNombre,
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
      `
    )
  );
}

export async function findOne(id: number): Promise<RowDataPacket | undefined> {
  const found = await databaseOperation(()=>
    rows<RowDataPacket>(`
      SELECT p.IDProducto, p.nombre, p.descripcion, p.IDProveedor, pr.razonSocial AS proveedorNombre,
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
      `, [id]
    )
  );
  return found[0];
}

export async function create(product: productInput): Promise<number> {
  const values: SqlValue[] = [
    product.nombre,
    product.descripcion,
    product.IDProveedor === undefined ? null : product.IDProveedor
  ];

  return databaseOperation(async()=> {
    const inserted = (await result(
      'INSERT INTO Producto (nombre, descripcion, IDProveedor) VALUES (?, ?, ?)', values
    )) as ResultSetHeader;
    return inserted.insertId;
  })
}

export async function update(id: number, product: productInput): Promise<boolean> {
  
  const campos = ['nombre = ?', 'descripcion = ?']
  const valores: SqlValue[] = [
    product.nombre,
     product.descripcion
    ] 

if (product.IDProveedor !== undefined) { //si al producto le mandaron un proveedor en el update se actualiza, si no no se toca
  campos.push('IDProvedor = ?'); 
  valores.push(product.IDProveedor)
}

  return databaseOperation(async()=> {
    const updated = await result(
      `UPDATE Producto SET ${campos.join(', ')} WHERE IDProducto = ?`, [...valores, id]
    ) as ResultSetHeader;

    if (updated.affectedRows > 0) return true;

    return Boolean(await findOne(id))
  })
}

export async function remove(id:number): Promise <boolean> {
  return databaseOperation(async()=> {
    const deleted = await result(
      'DELETE FROM Producto WHERE IDProducto = ?', [id]
    ) as ResultSetHeader;
    return deleted.affectedRows > 0;
  })

}