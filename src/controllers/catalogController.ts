import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as catalog from '../models/catalogModel';

export function list(resource: catalog.CatalogResource) {
  return async (_request: Request, h: ResponseToolkit) =>
    h.response(await catalog.list(resource)).code(200);
}

export function get(resource: catalog.CatalogResource) {
  return async (request: Request, h: ResponseToolkit) => {
    const record = await catalog.find(resource, Number(request.params.id));
    if (!record) throw Boom.notFound('No se encontró el registro solicitado.');
    return h.response(record).code(200);
  };
}

export function create(resource: catalog.CatalogResource) {
  return async (request: Request, h: ResponseToolkit) => {
    const id = await catalog.create(resource, request.payload as catalog.CatalogInput);
    return h.response({ id }).code(201);
  };
}

export function update(resource: catalog.CatalogResource) {
  return async (request: Request, h: ResponseToolkit) => {
    const updated = await catalog.update(
      resource,
      Number(request.params.id),
      request.payload as catalog.CatalogInput,
    );
    if (!updated) throw Boom.notFound('No se encontró el registro solicitado.');
    return h.response({ message: 'Registro actualizado.' }).code(200);
  };
}

export function remove(resource: catalog.CatalogResource) {
  return async (request: Request, h: ResponseToolkit) => {
    const removed = await catalog.remove(resource, Number(request.params.id));
    if (!removed) throw Boom.notFound('No se encontró el registro solicitado.');
    return h.response().code(204);
  };
}
