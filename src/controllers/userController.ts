import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as user from '../models/userModel';

export function list() {
  return async (_request: Request, h: ResponseToolkit) =>
    h.response(await user.findAll()).code(200);
}

export function get() {
  return async (request: Request, h: ResponseToolkit) => {
    const record = await user.findOne(Number(request.params.id));
    if (!record) throw Boom.notFound('No se encontró el registro solicitado.');
    return h.response(record).code(200);
  };
}

export function create() {
  return async (request: Request, h: ResponseToolkit) => {
    const id = await user.create(request.payload as user.userInput);
    return h.response({ id }).code(201);
  };
}

export function update() {
  return async (request: Request, h: ResponseToolkit) => {
    const updated = await user.update(
      Number(request.params.id),
      request.payload as user.userInput,
    );
    if (!updated) throw Boom.notFound('No se encontró el registro solicitado.');
    return h.response({ message: 'Registro actualizado.' }).code(200);
  };
}

export function remove() {
  return async (request: Request, h: ResponseToolkit) => {
    const removed = await user.remove(Number(request.params.id));
    if (!removed) throw Boom.notFound('No se encontró el registro solicitado.');
    return h.response().code(204);
  };
}
