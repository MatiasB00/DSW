# API de imprenta mayorista

Backend REST en Node.js, TypeScript, Hapi, Joi y MySQL. La lógica HTTP está en `controllers`, las consultas y transacciones en `models`, y las rutas/esquemas de entrada en `routes`.

## Puesta en marcha

1. Crear el esquema ejecutando `database/schema.sql` con MySQL 8.0.16 o superior.
2. Copiar `.env.example` a `.env`, completar las credenciales de MySQL y reemplazar `JWT_SECRET` por un secreto aleatorio. Se puede generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev` para desarrollo, o `npm run build` y luego `npm start`.

El servidor escucha en `http://localhost:3000` por defecto. Los campos monetarios usan `DECIMAL(12,2)`. Los roles válidos son `cliente` y `admin`; el registro público siempre crea clientes. Para asignar un administrador, actualiza manualmente el campo `Usuario.rol` en la base de datos. El secreto JWT no debe compartirse ni subirse al repositorio.

## API

Todos los endpoints están bajo `/api`.

| Recurso | Operaciones |
| --- | --- |
| `/auth/register`, `/auth/login` | Registro e inicio de sesión públicos |
| `/auth/me` | GET usuario de la sesión actual (requiere token) |
| `/usuarios` | Operaciones administrativas (requieren rol `admin`) |
| `/productos` | GET público; POST, PUT y DELETE requieren rol `admin` |
| `/proveedores` | Operaciones administrativas (requieren rol `admin`) |
| `/categorias` | GET público; POST, PUT y DELETE requieren rol `admin` |
| `/productos/{id}/precios` | GET historial y POST precio (requieren rol `admin`) |
| `/precios-impresiones` | GET público; POST requiere rol `admin` |
| `/precios-impresiones/{tamanio}/{fechaDesde}` | PUT requiere rol `admin`; `fechaDesde` identifica el registro y no se modifica. No existe DELETE |
| Tamaños de impresión | Solo se permiten `A1`, `A2`, `A3`, `A4`, `A5` y `A6` en precios y pedidos |
| `/pedidos` | GET pedidos propios para clientes o todos para admins; POST requiere sesión |
| `/pedidos/impresion` | POST multipart, requiere sesión; acepta PDF de hasta 20 MB |
| `/pedidos/{id}` | GET solo para el dueño del pedido o un admin |
| `/pedidos/{id}/estado` | PATCH de estado, solo para admins |

El PDF se valida durante la solicitud y no se conserva en disco ni en la base de datos. La cantidad de copias se estima en el navegador leyendo las páginas del PDF con PDF.js; para doble faz se divide por dos y se redondea hacia arriba. Después de registrar el pedido el administrador no podrá descargar el archivo. El importe se vuelve a calcular en el servidor con el precio más reciente para el tamaño elegido.

Si ya existe la base de datos, será necesario actualizarla para incorporar los nuevos campos y restricciones definidos en `database/schema.sql`.

Las solicitudes protegidas deben incluir `Authorization: Bearer <token>`. Los tokens vencen a las 8 horas. Una solicitud sin token válido recibe `401`; un usuario autenticado sin permisos recibe `403`. El ID del cliente al crear un pedido se obtiene de la sesión, no del cuerpo enviado por el navegador. Los pedidos no se pueden borrar ni editar; solo un admin puede cambiar su estado.

Ejemplo de pedido de insumos:

```json
{
  "tipo": "insumo",
  "items": [{ "IDProducto": 1, "cantidad": 20 }]
}
```

Los pedidos de impresión se envían como `multipart/form-data` a `/api/pedidos/impresion`, incluyendo `archivo` (PDF), `tamanio`, `tipoColor`, `faz` y `cantCopias`; `observacion` es opcional. El subtotal lo calcula el servidor y no se acepta del cliente.

La base de datos mantiene las claves foráneas y restricciones locales; la regla de especialización total y disjunta (exactamente un subtipo por pedido) se asegura en la creación transaccional de la API, ya que MySQL no admite restricciones diferibles entre tablas.

Los identificadores son autoincrementales. Los pedidos comienzan en estado `en preparacion`; los estados permitidos son `en preparacion`, `entregado` y `cancelado`. El borrado de un usuario con pedidos o de un producto que aparece en pedidos se rechaza por integridad referencial.
