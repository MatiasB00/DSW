import bycript from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseOperation, result, rows } from '../db';
import * as userModel from './userModel'

export interface UsuarioRow extends RowDataPacket {
    IDUsuario: number;
    nombre: string;
    apellido: string;
    email: string;
    contrasenia: string;
    rol: string;
}


export interface UsuarioRegistroInput {
    nombre: string;
    apellido: string;
    email: string;
    contrasenia: string;
    rol?: string;
}

export async function buscarPorEmail(email: string): Promise<UsuarioRow | null> {
    return databaseOperation(async () => {
        const listado = await rows<UsuarioRow>(
            'SELECT IDUsuario, nombre, apellido, email, contrasenia, rol  FROM Usuario WHERE email = ?',
            [email]
        );
        return listado.length > 0 ? listado[0] : null;
    })
}

export async function registrarUsuario(datos: UsuarioRegistroInput) {
    return databaseOperation(async () => {
        const contraseniaHash = await bycript.hash(datos.contrasenia, 10);

        const IDUsuario = await userModel.create({
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            contraseniaHash,
            rol: datos.rol
            
        })

        return {
            IDUsuario,
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            rol: datos.rol ?? 'cliente'
        };
    })
}