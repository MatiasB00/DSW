import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as provider from '../models/providerModel';

export function list() {
  return async (_request: Request, h: ResponseToolkit) =>
    h.response(await provider.findAll()).code(200);
}

export function get() {
  return async (request: Request, h: ResponseToolkit) => {
    const record = await provider.findOne(Number(request.params.id));
    if (!record) throw Boom.notFound('No se encontró el provider solicitado.');
    return h.response(record).code(200);
  };
}

export function create() {
  return async (request: Request, h: ResponseToolkit) => {
    const id = await provider.create(request.payload as provider.providerInput);
    return h.response({ id }).code(201);
  };
}

export function update() {
  return async (request: Request, h: ResponseToolkit) => {
    const updated = await provider.update(
      Number(request.params.id),
      request.payload as provider.providerInput,
    );
    if (!updated) throw Boom.notFound('No se encontró el provider solicitado.');
    return h.response({ message: 'providero actualizado.' }).code(200);
  };
}

export function remove() {
  return async (request: Request, h: ResponseToolkit) => {
    const removed = await provider.remove(Number(request.params.id));
    if (!removed) throw Boom.notFound('No se encontró el provider solicitado.');
    return h.response().code(204);
  };
}
