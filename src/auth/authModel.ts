import bycript from 'bcryptjs';
import { RowDataPacket } from 'mysql2/promise';
import { databaseOperation, rows } from '../db';
import * as userModel from '../models/userModel'

export interface UsuarioRow extends RowDataPacket {
    IDUsuario: number;
    nombre: string;
    apellido: string;
    email: string;
    contrasenia: string;
    rol: string;
}

export interface AuthIdentity extends RowDataPacket {
    IDUsuario: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
}


export interface UsuarioRegistroInput {
    nombre: string;
    apellido: string;
    email: string;
    contrasenia: string;
}

export async function findByEmail(email: string): Promise<UsuarioRow | null> {
    return databaseOperation(async () => {
        const listado = await rows<UsuarioRow>(
            'SELECT IDUsuario, nombre, apellido, email, contrasenia, rol  FROM Usuario WHERE email = ?',
            [email]
        );
        return listado.length > 0 ? listado[0] : null;
    })
}

export async function findById(id: number): Promise<AuthIdentity | null> {
    const found = await databaseOperation(() => 
        rows<AuthIdentity>(
            'SELECT IDUsuario, nombre, apellido, email, rol FROM Usuario WHERE IDUsuario = ?',
            [id]
        )
    );
    return found[0] ?? null;
}

export async function create(datos: UsuarioRegistroInput) {
    return databaseOperation(async () => {
        const contraseniaHash = await bycript.hash(datos.contrasenia, 10);

        const IDUsuario = await userModel.create({
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            contraseniaHash 
        })

        return {
            IDUsuario,
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            rol: 'cliente'
        };
    })
}