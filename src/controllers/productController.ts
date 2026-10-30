import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as product from '../models/productModel';

export function list() {
  return async (_request: Request, h: ResponseToolkit) =>
    h.response(await product.findAll()).code(200);
}

export function get() {
  return async (request: Request, h: ResponseToolkit) => {
    const record = await product.findOne(Number(request.params.id));
    if (!record) throw Boom.notFound('No se encontró el producto solicitado.');
    return h.response(record).code(200);
  };
}

export function create() {
  return async (request: Request, h: ResponseToolkit) => {
    const id = await product.create(request.payload as product.productInput);
    return h.response({ id }).code(201);
  };
}

export function update() {
  return async (request: Request, h: ResponseToolkit) => {
    const updated = await product.update(
      Number(request.params.id),
      request.payload as product.productInput,
    );
    if (!updated) throw Boom.notFound('No se encontró el producto solicitado.');
    return h.response({ message: 'Producto actualizado.' }).code(200);
  };
}

export function remove() {
  return async (request: Request, h: ResponseToolkit) => {
    const removed = await product.remove(Number(request.params.id));
    if (!removed) throw Boom.notFound('No se encontró el producto solicitado.');
    return h.response().code(204);
  };
}
