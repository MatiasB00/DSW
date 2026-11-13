import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';
import * as orderController from './controllers/orderController';
import * as priceController from './controllers/priceController';
import * as printingPriceController from './controllers/printingPriceController';
import * as authController from './auth/authController';
import * as userController from './controllers/userController';
import * as productController from './controllers/productController';
import * as providerController from './controllers/providerController';
import * as categoryController from './controllers/categoryController';
import { ORDER_STATUSES } from './models/orderModel';
import { PRINTING_SIZES } from './shared/printingSizes';

const idParams = Joi.object({
  id: Joi.number().integer().positive().max(4294967295).required(),
});

const usuarioSchema = Joi.object({
  nombre: Joi.string().trim().min(1).max(100).required(),
  apellido: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(254).required(),
  contraseniaHash: Joi.string().trim().min(6).max(20).required()
}).unknown(false);

const registroSchema = Joi.object({
  nombre: Joi.string().trim().min(1).max(100).required(),
  apellido: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(254).required(),
  contrasenia: Joi.string().trim().min(6).max(128).required()
}).unknown(false);

const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(254).required(),
  contrasenia: Joi.string().required(),
})


const proveedorSchema = Joi.object({
  cuit: Joi.string().trim().min(1).max(20).required(),
  razonSocial: Joi.string().trim().min(1).max(150).required(),
  email: Joi.string().trim().email().max(254).required(),
  telefono: Joi.string().trim().max(50).allow('', null).optional(),
  direccion: Joi.string().trim().max(255).allow('', null).optional(),
});

const productoSchema = Joi.object({
  nombre: Joi.string().trim().min(1).max(150).required(),
  descripcion: Joi.string().allow('').required(),
  stock: Joi.number().integer().min(0).default(0).optional(),
  IDProveedor: Joi.number().integer().positive().allow(null).optional(),
  IDCategoria: Joi.number().integer().positive().allow(null).optional()
});

const precioSchema = Joi.object({
  valor: Joi.number().precision(2).min(0).max(9999999999.99).required(),
});

const printingPriceFields = {
  tamanio: Joi.string().trim().valid(...PRINTING_SIZES).required(),
  precioTamanio: Joi.number().precision(2).min(0).max(9999999999.99).required(),
  precioByN: Joi.number().precision(2).min(0).max(9999999999.99).required(),
  precioColor: Joi.number().precision(2).min(0).max(9999999999.99).required(),
  factorGanancia: Joi.number().precision(2).min(1).max(10).default(1),
};

const printingPriceCreateSchema = Joi.object(printingPriceFields).unknown(false);
const printingPriceUpdateSchema = Joi.object(printingPriceFields).unknown(false);
const printingPriceParams = Joi.object({
  tamanio: Joi.string().trim().valid(...PRINTING_SIZES).required(),
  fechaDesde: Joi.string().isoDate().required(),
});

const orderFields = {
  fecha: Joi.string().isoDate().optional()
};

const itemSchema = Joi.object({
  IDProducto: Joi.number().integer().positive().max(4294967295).required(),
  cantidad: Joi.number().integer().positive().max(4294967295).required(),
});

const orderSchema = Joi.object({
  ...orderFields,
  tipo: Joi.string().valid('insumo').required(),
  items: Joi.array().items(itemSchema).min(1).required(),
  impresion: Joi.forbidden(),
}).unknown(false);

const updateOrderStatusSchema = Joi.object({
  estado: Joi.string().valid(...ORDER_STATUSES).required(),
}).unknown(false);

const categoriaSchema = Joi.object({
  nombre: Joi.string().trim().min(1).max(30).required(),
});

export const routes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/api/auth/register',
    options: { validate: { payload: registroSchema } },
    handler: authController.register,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    options: { validate: { payload: loginSchema } },
    handler: authController.login,
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    options: { auth: { strategy: 'jwt' } },
    handler: authController.me,
  },

  {
    method: 'GET',
    path: '/api/proveedores',
    options: { auth: { strategy: 'jwt', scope: ['admin'] } },
    handler: providerController.findAll()
  },

  {
    method: 'GET',
    path: '/api/proveedores/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams } },
    handler: providerController.findOne()
  },

  {
    method: 'POST',
    path: '/api/proveedores',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { payload: proveedorSchema } },
    handler: providerController.create()
  },

  {
    method: 'PUT',
    path: '/api/proveedores/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams, payload: proveedorSchema } },
    handler: providerController.update()
  },

  {
    method: 'DELETE',
    path: '/api/proveedores/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams } },
    handler: providerController.remove()
  },

  {
    method: 'GET',
    path: '/api/usuarios',
    options: { auth: { strategy: 'jwt', scope: ['admin'] } },
    handler: userController.findAll()
  },

  {
    method: 'GET',
    path: '/api/usuarios/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams } },
    handler: userController.findOne()
  },

  {
    method: 'POST',
    path: '/api/usuarios',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { payload: usuarioSchema } },
    handler: userController.create()
  },

  {
    method: 'PUT',
    path: '/api/usuarios/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams, payload: usuarioSchema } },
    handler: userController.update()
  },

  {
    method: 'DELETE',
    path: '/api/usuarios/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams } },
    handler: userController.remove()
  },

  {
    method: 'GET',
    path: '/api/productos',
    handler: productController.findAll()
  },

  {
    method: 'GET',
    path: '/api/productos/{id}',
    options: { validate: { params: idParams } },
    handler: productController.findOne()
  },

  {
    method: 'POST',
    path: '/api/productos',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { payload: productoSchema } },
    handler: productController.create()
  },

  {
    method: 'PUT',
    path: '/api/productos/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams, payload: productoSchema } },
    handler: productController.update()
  },

  {
    method: 'DELETE',
    path: '/api/productos/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams } },
    handler: productController.remove()
  },

  {
    method: 'GET',
    path: '/api/pedidos',
    options: { auth: { strategy: 'jwt' } },
    handler: orderController.findAll
  },
  {
    method: 'GET',
    path: '/api/productos/{id}/precios',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams } },
    handler: priceController.findAll,
  },
  {
    method: 'POST',
    path: '/api/productos/{id}/precios',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams, payload: precioSchema } },
    handler: priceController.create,
  },
  {
    method: 'GET',
    path: '/api/precios-impresiones',
    handler: printingPriceController.findAll,
  },
  {
    method: 'POST',
    path: '/api/precios-impresiones',
    options: {
      auth: { strategy: 'jwt', scope: ['admin'] },
      validate: { payload: printingPriceCreateSchema },
    },
    handler: printingPriceController.create,
  },
  {
    method: 'PUT',
    path: '/api/precios-impresiones/{tamanio}/{fechaDesde}',
    options: {
      auth: { strategy: 'jwt', scope: ['admin'] },
      validate: { params: printingPriceParams, payload: printingPriceUpdateSchema },
    },
    handler: printingPriceController.update,
  },
  {
    method: 'GET',
    path: '/api/categorias',
    handler: categoryController.findAll()
  },
  {
    method: 'GET',
    path: '/api/categorias/{id}',
    options: { validate: { params: idParams } },
    handler: categoryController.findOne()
  },
  {
    method: 'POST',
    path: '/api/categorias',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { payload: categoriaSchema } },
    handler: categoryController.create()
  },
  {
    method: 'PUT',
    path: '/api/categorias/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams, payload: categoriaSchema } },
    handler: categoryController.update()
  },
  {
    method: 'DELETE',
    path: '/api/categorias/{id}',
    options: { auth: { strategy: 'jwt', scope: ['admin'] }, validate: { params: idParams } },
    handler: categoryController.remove()
  },

  {
    method: 'GET',
    path: '/api/pedidos/{id}',
    options: { auth: { strategy: 'jwt' }, validate: { params: idParams } },
    handler: orderController.findOne,
  },
  {
    method: 'POST',
    path: '/api/pedidos',
    options: { auth: { strategy: 'jwt' }, validate: { payload: orderSchema } },
    handler: orderController.create,
  },
  {
    method: 'POST',
    path: '/api/pedidos/impresion',
    options: {
      auth: { strategy: 'jwt' },
      payload: {
        maxBytes: 20 * 1024 * 1024 + 64 * 1024,
        multipart: { output: 'stream' },
      },
    },
    handler: orderController.createPrint,
  },
  {
    method: 'PATCH',
    path: '/api/pedidos/{id}/estado',
    options: {
      auth: { strategy: 'jwt', scope: ['admin'] },
      validate: { params: idParams, payload: updateOrderStatusSchema },
    },
    handler: orderController.update,
  },
];
