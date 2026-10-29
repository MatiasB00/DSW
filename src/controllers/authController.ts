import { Request, ResponseToolkit } from "@hapi/hapi";
import Boom from '@hapi/boom';
import bycript from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authModel from "../models/authModel";


//secret para firma de tokens, dsp en prod va al .env
const JWT_SECRET = process.env.JWT_SECRET || 'dsw_imprenta_2026';

export async function register(request: Request, h: ResponseToolkit) {
    const payload = request.payload as authModel.UsuarioRegistroInput;

    const usuarioExistente = await authModel.buscarPorEmail(payload.email);
    if (usuarioExistente) {
        throw Boom.conflict('El email ya está registrado');
    };

    const nuevoUsuario = await authModel.registrarUsuario(payload);

    const token = jwt.sign(
        {
            IDUsuario: nuevoUsuario.IDUsuario,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            nombre: nuevoUsuario.nombre,
            apellido: nuevoUsuario.apellido
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

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

    const usuario = await authModel.buscarPorEmail(email);
    if (!usuario) {
        throw Boom.unauthorized('Credenciales inválidas');
    }

    const esValida = await bycript.compare(contrasenia, usuario.contrasenia);
    if (!esValida) {
        throw Boom.unauthorized('Credenciales inválidas');
    }

    const token = jwt.sign(
        {
            IDUsuario: usuario.IDUsuario,
            email: usuario.email,
            rol: usuario.rol,
            nombre: usuario.nombre,
            apellido: usuario.apellido
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

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