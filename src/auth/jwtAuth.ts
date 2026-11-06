import Boom from '@hapi/boom';
import Hapi from '@hapi/hapi';
import jwt, { JwtPayload } from 'jsonwebtoken';
import * as authModel from './authModel';
import { getJwtSecret } from './jwtsecret';

export interface AuthCredentials {
  IDUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'cliente' | 'admin';
  scope: string[];
}

export function getAuthCredentials(value: unknown): AuthCredentials {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('IDUsuario' in value) ||
    !('nombre' in value) ||
    !('apellido' in value) ||
    !('email' in value) ||
    !('rol' in value) ||
    !('scope' in value)
  ) {
    throw Boom.unauthorized('No se pudo identificar al usuario autenticado.');
  }

  const { IDUsuario, nombre, apellido, email, rol, scope } = value;
  if (
    typeof IDUsuario !== 'number' ||
    typeof nombre !== 'string' ||
    typeof apellido !== 'string' ||
    typeof email !== 'string' ||
    (rol !== 'cliente' && rol !== 'admin') ||
    !Array.isArray(scope) ||
    !scope.every((entry) => typeof entry === 'string')
  ) {
    throw Boom.unauthorized('Las credenciales del usuario no son válidas.');
  }

  return { IDUsuario, nombre, apellido, email, rol, scope };
}

export function registerJwtAuth(server: Hapi.Server): void {
  const secret = getJwtSecret();

  server.auth.scheme('jwt', () => ({
    authenticate: async (request, h) => {
      const authorization = request.headers.authorization;
      const match = typeof authorization === 'string'
        ? /^Bearer\s+(.+)$/i.exec(authorization)
        : null;

      const token = match?.[1];
      if (!token) {
        throw Boom.unauthorized('Se requiere un token Bearer.');
      }

      let payload: string | JwtPayload;
      try {
        payload = jwt.verify(token, secret, {
          algorithms: ['HS256'],
        });
      } catch {
        throw Boom.unauthorized('El token no es válido o venció.');
      }

      if (
        typeof payload === 'string' ||
        typeof payload.IDUsuario !== 'number' ||
        !Number.isInteger(payload.IDUsuario)
      ) {
        throw Boom.unauthorized('El token no contiene un usuario válido.');
      }

      const usuario = await authModel.findById(payload.IDUsuario);
      if (!usuario) {
        throw Boom.unauthorized('La cuenta asociada al token ya no existe.');
      }
      if (usuario.rol !== 'cliente' && usuario.rol !== 'admin') {
        throw Boom.forbidden('La cuenta tiene un rol no válido.');
      }

      const credentials: AuthCredentials = {
        IDUsuario: usuario.IDUsuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        scope: [usuario.rol],
      };

      return h.authenticated({ credentials });
    },
  }));

  server.auth.strategy('jwt', 'jwt');
}