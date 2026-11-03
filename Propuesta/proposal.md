# Propuesta TP DSW

## Grupo
### Integrantes
* 48009 - Matias Bilicich
* 50301 - Franco Sartirana

### Repositorios
* [monorepo](https://github.com/MatiasB00/DSW)

## Tema
### Descripción
Portal web de un comercio de imprenta mayorista, desde el cual se pueden crear y gestionar pedidos, tanto de insumos como de impresión.


### Modelo

<img width="1255" height="542" alt="DiagramaDSW drawio (1)" src="https://github.com/user-attachments/assets/8a3fd066-cb67-4e79-aa4c-6881a00d3ed2" />


## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Usuario<br>2. CRUD Proveedores<br>3. CRUD Productos<br>4. CRUD Categorías|
|CRUD dependiente|1. CRUD Pedido {depende de} CRUD Usuario<br>2. CRUD Precio {depende de} CRUD Producto|
|Listado<br>+<br>detalle| 1. Listado de productos filtrado por nombre y categoría, con ordenamiento por precio => Detalle muestra info completa. <br> 2. Listado de proveedores, buscables por razón social o CUIT => se muestra el proveedor con sus datos y respectivos botones.|
|CUU/Epic|1. Registro e inicio de sesión de un usuario<br>2. Agregar productos al carrito y gestión de cantidades|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Usuario<br>2. CRUD Proveedores<br>3. CRUD Productos<br>4. CRUD Categorías<br>5. CRUD Precio<br>6. CRUD Pedido<br>7. CRUD Contacto<br>|
|CUU/Epic|1. Registro e inicio de sesión de un usuario<br>2. Agregar productos al carrito y gestión de cantidades<br>3. Realizar el check-out y facturación de pedido completo|


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. En panel admin, filtrado de proveedores por nombre. <br>2. En portal de cliente, listado de pedidos anteriores con detalle, filtrables por id, tipo y precio.|
|CUU/Epic|1. Consumir servicios<br>2. Cancelación de pedido|
|Otros|1. Envío de recordatorio de reserva por email|
