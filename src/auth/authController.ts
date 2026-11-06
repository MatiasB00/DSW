import { Request, ResponseToolkit } from "@hapi/hapi";
import Boom from '@hapi/boom';
import bycript from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authModel from "./authModel";
import { getJwtSecret } from './jwtsecret';
import { getAuthCredentials } from './jwtAuth';

function createToken(user: {
    IDUsuario: number;
    email: string;
}) {
    return jwt.sign(
        { IDUsuario: user.IDUsuario, email: user.email },
        getJwtSecret(),
        { expiresIn: '8h', algorithm: 'HS256' },
    );
}

export async function register(request: Request, h: ResponseToolkit) {
    const payload = request.payload as authModel.UsuarioRegistroInput;

    const usuarioExistente = await authModel.findByEmail(payload.email);
    if (usuarioExistente) {
        throw Boom.conflict('El email ya está registrado');
    };

    const nuevoUsuario = await authModel.create(payload);

    const token = createToken(nuevoUsuario);

    return h.response({
        mensaje: 'Usuario registrado exitosamente',
        token,
        usuario: nuevoUsuario
    }).code(201);
}


export async function login(request: Request, h: ResponseToolkit) {
    const { email, contrasenia } = request.payload as {
        email: string,
        contrasenia: string
    }

    const usuario = await authModel.findByEmail(email);
    if (!usuario) {
        throw Boom.unauthorized('Credenciales inválidas');
    }

    const esValida = await bycript.compare(contrasenia, usuario.contrasenia);
    if (!esValida) {
        throw Boom.unauthorized('Credenciales inválidas');
    }

    const token = createToken(usuario);

    return h.response({
        mensaje: 'Inicio de sesion exitoso',
        token,
        usuario: {
            IDUsuario: usuario.IDUsuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol
        }
    }).code(200);
}

export async function me(request: Request, h: ResponseToolkit) {
    const { IDUsuario, nombre, apellido, email, rol } =
        getAuthCredentials(request.auth.credentials);

    return h.response({ IDUsuario, nombre, apellido, email, rol }).code(200);
}