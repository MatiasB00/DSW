import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';
import { conflict } from '@hapi/boom';


export interface productInput {
  nombre: string;
  descripcion: string;
  stock?: number;
  IDProveedor?: number | null;
  IDCategoria?: number | null;
}

interface RawProductQueryRow {
  IDProducto: number | bigint;
  nombre: string;
  descripcion: string;
  stock: number | bigint;
  IDProveedor: number | bigint | null;
  IDCategoria: number | bigint | null;
  categoria: string | null;
  proveedorNombre: string | null;
  precio: Prisma.Decimal | number | bigint;
}

interface ProductQueryRow {
  IDProducto: number;
  nombre: string;
  descripcion: string;
  stock: number;
  IDProveedor: number | null;
  IDCategoria: number | null;
  categoria: string | null;
  proveedorNombre: string | null;
  precio: Prisma.Decimal | number;
}

function toProductQueryRow(row: RawProductQueryRow): ProductQueryRow {
  return {
    ...row,
    IDProducto: Number(row.IDProducto),
    stock: Number(row.stock),
    IDProveedor: row.IDProveedor === null ? null : Number(row.IDProveedor),
    IDCategoria: row.IDCategoria === null ? null : Number(row.IDCategoria),
    precio: typeof row.precio === 'bigint' ? Number(row.precio) : row.precio,
  };
}

export async function findAll(): Promise<ProductQueryRow[]> {
  const rows = await prisma.$queryRaw<RawProductQueryRow[]>`
      SELECT p.IDProducto, p.nombre, p.descripcion, p.stock, p.IDProveedor, c.IDCategoria, c.nombre AS categoria, pr.razonSocial AS proveedorNombre,
    COALESCE((
      SELECT prec.valor
      FROM Precio prec
      WHERE prec.IDProducto = p.IDProducto
      ORDER BY prec.fechaDesde DESC
      LIMIT 1
      ), 0) AS precio
    FROM Producto p 
    LEFT JOIN Proveedor pr ON p.IDProveedor = pr.IDProveedor
    LEFT JOIN Categoria c ON p.IDCategoria = c.IDCategoria 
    ORDER BY p.IDProducto
  `;
  return rows.map(toProductQueryRow);
}

export async function findOne(id: number): Promise<ProductQueryRow | undefined> {
  const found = await prisma.$queryRaw<RawProductQueryRow[]>`
      SELECT p.IDProducto, p.nombre, p.descripcion, p.stock, p.IDProveedor, c.IDCategoria, c.nombre AS categoria, pr.razonSocial AS proveedorNombre,
      COALESCE((
        SELECT prec.valor
        FROM Precio prec
        WHERE prec.IDProducto = p.IDProducto
        ORDER BY prec.fechaDesde DESC
        LIMIT 1
        ), 0) AS precio
      FROM Producto p 
      LEFT JOIN Proveedor pr ON p.IDProveedor = pr.IDProveedor
      LEFT JOIN Categoria c ON p.IDCategoria = c.IDCategoria
      WHERE p.IDProducto = ${id}  
  `
  return found[0] ? toProductQueryRow(found[0]) : undefined;
}

export async function create(product: productInput): Promise<number> {
  try {
    const created = await prisma.producto.create({
      data: {
        nombre: product.nombre,
        descripcion: product.descripcion,
        stock: product.stock ?? 0,
        IDProveedor: product.IDProveedor === undefined ? null : product.IDProveedor,
        IDCategoria: product.IDCategoria === undefined ? null : product.IDCategoria
      }
    });
    return created.IDProducto;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw conflict('El proveedor o la categoría indicados no existen.');
    }
    throw error;
  }
}


export async function update(id: number, product: productInput): Promise<boolean> {
  const data: Prisma.productoUncheckedUpdateInput = {};
  
  if (product.nombre !== undefined) {
    data.nombre = product.nombre;
  }
  if (product.descripcion !== undefined) {
    data.descripcion = product.descripcion;
  }
  if (product.IDProveedor !== undefined) {
    data.IDProveedor = product.IDProveedor;
  }
  if (product.stock !== undefined) {
    data.stock = product.stock;
  }
  if (product.IDCategoria !== undefined) {
    data.IDCategoria = product.IDCategoria;
  }
  try {
    await prisma.producto.update({
      where: { IDProducto: id },
      data,
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return false;
      if (error.code === 'P2003') {
        throw conflict('El proveedor o la categoría indicados no existen.');
      }
    }
    throw error;
  }
}

export async function remove(id: number): Promise<boolean> {
  try {
    await prisma.producto.delete({
      where: {
        IDProducto: id
      }
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return false;
      if (error.code === 'P2003') {
        throw conflict('No se puede eliminar el producto porque está asociado a un pedido.');
      }
    }
    throw error;
  }
}
