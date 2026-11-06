import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as category from '../models/categoryModel';

export function findAll() {
    return async (_request: Request, h: ResponseToolkit) =>
        h.response(await category.findAll()).code(200);
}

export function findOne() {
    return async (request: Request, h: ResponseToolkit) => {
        const record = await category.findOne(Number(request.params.id));
        if (!record) throw Boom.notFound('No se encontró la categoría solicitada.');
        return h.response(record).code(200);
    };
}

export function create() {
    return async (request: Request, h: ResponseToolkit) => {
        const id = await category.create(request.payload as category.CategoryInput);
        return h.response({ id }).code(201);
    };
}

export function update() {
    return async (request: Request, h: ResponseToolkit) => {
        const updated = await category.update(
            Number(request.params.id),
            request.payload as category.CategoryInput
        );
        if (!updated) throw Boom.notFound('No se encontró la categoría solicitada.');
        return h.response({ message: 'Categoría actualizada con éxito.' }).code(200);
    };
}

export function remove() {
    return async (request: Request, h: ResponseToolkit) => {
        const removed = await category.remove(Number(request.params.id));
        if (!removed) throw Boom.notFound('No se encontró la categoría solicitada.');
        return h.response().code(204);
    };
}