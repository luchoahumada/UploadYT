Mediastream Platform API
============

#General
Toda solicitud debe incluir un **token** de autenticaci&oacute;n. La creaci&oacute;n de tokens se debe realizar manualmente en la secci&oacute;n [Account](http://streammanager.co/account).

Las peticiones de tipo GET requieren que el token utilizado posea permisos de lectura, sin embargo, las peticiones de tipo POST o DEL requieren permisos de escritura.

#Respuesta

La respuesta es entregada en formato JSON y considera 2 elementos: *status* y *data*

**status** entrega el estado de la respuesta y existen 2 opciones: *OK* y *ERROR*. Si la respuesta es *OK*, entonces **data** incluir&aacute; un arreglo del/los objeto(s) encontrado(s), de lo contrario la API acusar&aacute; un error.

#Errores

Los errores son entregados de 2 maneras: a) a través de errores HTTP y b) en el payload JSON.

El error HTTP proporciona una respuesta amplia mientras que el payload JSON devuelve un mensaje con mayor detalle.

Posibles errores:

**HTTP 401 - No autorizado**: Falta de token o uso de token no v&aacute;lido.

**HTTP 404 - No encontrado**: El recurso solicitado no fue encontrado.

**HTTP 500 - Error interno**: No fue posible responder a la solicitud por un error interno (de servidor).

**Ejemplo**

HTTP 500
```json
{
  "status": "ERROR",
  "data": "DATABASE_ERROR"
}
```

#[Ad](http://streammanager.co/docs/es/api.html#ad)

>###GET /api/ad

Obtiene el listado de *Ads* asociados a la cuenta del cliente.

**Par&aacute;metros Requeridos**

| Param | Descripci&oacute;n              |
| ----- | ------------------------------- |
| token | (String) Token de Autenticación |

**Par&aacute;metros Opcionales**

| Param | Descripci&oacute;n                                                                               |
| ----- | ------------------------------------------------------------------------------------------------ |
| query | (String) Texto de búsqueda libre, busca coincidencias por nombre de *Ad*                         |
| sort  | (String) Campo de ordenaci&oacute;n de los resultados                                            |
| limit | (Entero) Define cu&aacute;ntos registros ser&aacute;n devueltos                                  |
| skip  | (Entero) Define a partir de qu&eacute; registro ser&aacute;n devueltos los datos                 |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/ad?token=eece62ac37bdf1a6e1c006e3ced5fa4d&query=example&sort=-date_created&limit=5
```

**Respuesta**
```json
{
  "status": "OK",
  "data": [
    {
      "_id": "51e952644f1d81c11f000490",
      "date_created": "2013-07-19T14:51:19.466Z",
      "is_enabled": true,
      "name": "Example Ad",
      "type": "vast"
    }
  ]
}
```

>###GET /api/ad/{ad_id}

Devuelve informaci&oacute;n del *Ad* especificado por **{ad_id}**.

**Par&aacute;metros Requeridos**

| Param | Descripci&oacute;n                        |
| ----- | ----------------------------------------- |
| token | (String) Token de Autenticación           |
| ad_id | (String) Identificador del Ad a obtener   |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/ad/51e952644f1d81c11f000490?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**

```json
{
  "status": "OK",
  "data": {
    "_id": "51e952644f1d81c11f000490",
    "account": "514a9db27207f311260fac04",
    "categories": [],
    "date_created": "2013-07-19T14:51:19.466Z",
    "is_enabled": true,
    "name": "Example Ad",
    "preroll_skip_at": 1,
    "referers": [],
    "schedule": {
      "post": {
        "tag": null
      },
      "pre": {
        "tag": null
      }
    },
    "tags": [],
    "type": "vast"
  }
}
```

>###POST /api/ad/new

Agrega un nuevo *Ad* a la cuenta del cliente.

**Par&aacute;metros Requeridos**

| Param | Descripci&oacute;n              |
| ----- | ------------------------------- |
| token | (String) Token de Autenticación |
| name  | (String) Nombre del nuevo *Ad*  |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "name=First Ad" https://api.streammanager.co/api/ad/new
```

**Respuesta**

```json
{
  "status": "OK",
  "data": {
    "_id": "51e952644f1d81c11f000490",
    "account": "514a9db27207f311260fac04",
    "categories": [],
    "date_created": "2013-07-19T14:51:19.466Z",
    "is_enabled": true,
    "name": "First Ad",
    "preroll_skip_at": 1,
    "referers": [],
    "schedule": {
      "post": {
        "tag": null
      },
      "pre": {
        "tag": null
      }
    },
    "tags": [],
    "type": "vast"
  }
}
```

>###POST /api/ad/{ad_id}

Actualiza el *Ad* especificado por **{ad_id}**.

**Par&aacute;metros Requeridos**

| Param | Descripci&oacute;n                |
| ----- | --------------------------------- |
| token | (String) Token de Autenticación   |

**Par&aacute;metros Opcionales**

| Param                      | Descripci&oacute;n                              |
| -------------------------- | ----------------------------------------------- |
| name                       | (String) Nombre para el *Ad*                    |
| type                       | (String) Tipo de *Ad*. Opciones: vast, googleima, local  |
| is_enabled                 | (Booleano) Estado del *Ad*. Opciones: true, false |
| preroll_skip_at            | (Entero) Cantidad de segundos antes de que se pueda saltar el *Ad* |
| schedule -> pre -> media   |                      |
| schedule -> pre -> tag     |                      |
| schedule -> post -> media  |                      |
| schedule -> post -> tag    |                      |
| categories                 | (Array) Ids de Categor&iacute;as para las cuales aplica el *Ad* |
| tags                       | (Array) Tags para los cuales aplica el *Ad*                     |
| referers                   | (Array) Referers en los cuales aplica el *Ad*                   |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/ad/51e952644f1d81c11f000490
```

**Respuesta**

```json
{
  "status": "OK",
  "data": {
    "_id": "51e952644f1d81c11f000490",
    "account": "514a9db27207f311260fac04",
    "categories": [],
    "date_created": "2013-07-19T14:51:19.466Z",
    "is_enabled": true,
    "name": "Example Ad",
    "preroll_skip_at": 1,
    "referers": [],
    "schedule": {
      "post": {
        "tag": null
      },
      "pre": {
        "tag": null
      }
    },
    "tags": [],
    "type": "vast"
  }
}
```

>###DEL /api/ad/{ad_id}

Elimina el *Ad* especificado por **{ad_id}**.

**Par&aacute;metros Requeridos**

| Param | Descripci&oacute;n            |
| ----- | ----------------------------- |
| token | (String) Token de Autenticación   |
| ad_id | (String) Identificador del Ad |

**Ejemplo**

```bash
curl -X "DELETE" -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/ad/5af34343234123feafef290
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

#[Category](http://streammanager.co/docs/es/api.html#category)

>###GET /api/category

Obtiene listado de *Categor&iacute;as*.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                          |

**Par&aacute;metros Opcionales**

| Param         | Descripci&oacute;n                                                 |
| ------------- | ------------------------------------------------------------------ |
| category_name | (Array) Nombres espec&iacute;ficos de *Categor&iacute;as* a buscar |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/category?token=eece62ac37bdf1a6e1c006e3ced5fa4d&category_name=[Music,Videos]
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "parent": {
        "name": "root",
        "_id": "52fb777ca2be13d57907b2aa",
        "date_created": "2014-08-25T17:50:52.103Z"
      },
      "description": "Music Videos",
      "name": "Music",
      "_id": "53fb779da2be13d57907b1aa",
      "date_created": "2014-08-25T17:51:25.022Z"
    },
    {
      "parent": {
        "name": "music-videos",
        "_id": "52fb779da2be13d57907b1aa",
        "date_created": "2014-08-25T17:50:52.103Z"
      },
      "description": "Videos",
      "name": "Videos",
      "_id": "51fb77b8a2be13d57907b2be",
      "date_created": "2014-08-25T17:51:52.713Z"
    }
  ]
}
```

>###POST /api/category

Permite la creaci&oacute;n de una *categor&iacute;a*.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                           |
| ------------- | ------------------------------------------------------------ |
| token         | (String) Token de Autenticación.                             |
| name          | (String) Nombre de la *Categor&iacute;a* a crear.            |

**Par&aacute;metros Opcionales**

| Param         | Descripci&oacute;n                                    |
| ------------- | ----------------------------------------------------- |
| description   | (String) Descripci&oacute;n de la *Categor&iacute;a*. |
| parent        | (String) ID de la *Categor&iacute;a* padre.           |

**Ejemplo:**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "name=Videos" -d "description=All Videos" https://api.streammanager.co/api/category
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "parent": {},
      "description": "All Videos",
      "name": "Videos",
      "_id": "51fb77b8a2be13d57907b2be",
      "account": "51fb77b8a2be13d57907a1aa",
      "date_created": "2014-08-25T17:51:52.713Z"
    }
  ]
}
```

>###POST /api/category/{category_id}

Permite actualizar la *Categor&iacute;a* especificada por **{category_id}**.

**Par&aacute;metros Requeridos**

| Param        | Descripci&oacute;n                       |
| ------------ | ---------------------------------------- |
| token        | (String) Token de Autenticación          |
| name         | (String) Nombre de la *Categor&iacute;a* |

**Par&aacute;metros Opcionales**

| Param        | Descripci&oacute;n                                       |
| ------------ | -------------------------------------------------------- |
| description  | (String) Descripci&oacute;n de la *Categor&iacute;a*     |
| parent       | (String) ID de la *Categor&iacute;a* padre               |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "name=Videos2" -d "description=Listado%20de%20Videos" https://api.streammanager.co/api/category/51fb77b8a2be13d57907b2be
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "parent": {},
      "description": "Listado de Videos",
      "name": "Videos2",
      "_id": "51fb77b8a2be13d57907b2be",
      "account": "51fb77b8a2be13d57907a1aa",
      "date_created": "2014-08-25T17:51:52.713Z"
    }
  ]
}
```

>###DEL /api/category/{category_id}

Permite borrar la *Categor&iacute;a* especificada por **{category_id}**.

**Par&aacute;metros Requeridos**

| Param | Descripci&oacute;n                |
| ----- | --------------------------------- |
| token | (String) Token de Autenticación   |

**Ejemplo**

```bash
curl -X "DELETE" -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/category/51fb77b8a2be13d57907b2be
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

#[Coupon Group](http://streammanager.co/docs/es/api.html#coupongroup)

>###GET /api/coupon-group

Obtiene listado de *Grupo de Cupones* existentes en la Cuenta.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                          |

**Par&aacute;metros Opcionales**

| Param                | Descripci&oacute;n                                        |
| -------------------- | --------------------------------------------------------- |
| created_start_date   | (Fecha ISO8601) Filtrar cupones creados despu&eacute;s de    |
| created_end_date     | (Fecha ISO8601) Filtrar cupones creados antes de             |
| available_start_date | (Fecha ISO8601) Filtrar cupones disponibles despu&eacute;s de|
| available_end_date   | (Fecha ISO8601) Filtrar cupones disponibles antes de         |
| detail               | (String) Detalle de los cupones a mostrar                 |
| sort                 | (String) Campo de ordenaci&oacute;n de los resultados     |
| limit                | (Entero) Define n&uacute;mero de registros a devolver     |
| skip                 | (Entero) Define a partir de qu&eacute; registro ser&aacute;n devueltos los datos |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/coupon-group?token=eece62ac37bdf1a6e1c006e3ced5fa4d&detail=Main%20Group&sort=date_created
```

**Respuesta**
```json
{
  "status": "OK",
  "data": [
    {
      "_id": "5384f0dafada13dd52c6c14e",
      "_name": "main group",
      "account": "514a9db27207f311260fac04",
      "coupon_total": 4,
      "coupon_used_total": 2,
      "date_created": "2014-05-27T20:09:03.937Z",
      "name": "Main Group"
    }
  ]
}
```

>###POST /api/coupon-group

Crea un nuevo *Grupo de Cupones*.

**Par&aacute;metros Requeridos**

| Param             |  Descripci&oacute;n                                |
| ----------------- | -------------------------------------------------- |
| token             | (String) Token de Autenticación                          |
| coupon_group_name | (String) Nombre para el Grupo de Cupones           |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "coupon_group_name=Main%20Group" https://api.streammanager.co/api/coupon-group
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "5384f0dafada13dd52c6c14e",
      "_name": "main group",
      "account": "514a9db27207f311260fac04",
      "coupon_total": 4,
      "coupon_used_total": 2,
      "date_created": "2014-05-27T20:09:03.937Z",
      "name": "Main Group"
    }
  ]
}
```

#[Coupon](http://streammanager.co/docs/es/api.html#coupon)

>###GET /api/coupon

Obtiene listado de *cupones* existentes en la Cuenta.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                          |

**Par&aacute;metros Opcionales**

| Param                | Descripci&oacute;n                                                        |
| -------------------- | ------------------------------------------------------------------------- |
| created_start_date   | (Fecha ISO8601) Filtrar cupones creados despu&eacute;s de                 |
| created_end_date     | (Fecha ISO8601) Filtrar cupones creados antes de                          |
| available_start_date | (Fecha ISO8601) Filtrar cupones disponibles despu&eacute;s de             |
| available_end_date   | (Fecha ISO8601) Filtrar cupones disponibles antes de                      |
| code                 | (String) Código de cupones a devolver                                     |
| detail               | (String) Detalle de cupones a devolver                                    |
| group                | (String) Identificador de *Grupo de Cupones*. Devolver&aacute; todos los cupones pertenecientes a dicho grupo |
| sort                 | (String) Campo de ordenaci&oacute;n de los resultados     |
| limit                | (Entero) Define n&uacute;mero de registros a devolver     |
| skip                 | (Entero) Define a partir de qu&eacute; registro ser&aacute;n devueltos los datos

**Ejemplo**

```bash
curl https://api.streammanager.co/api/coupon?token=eece62ac37bdf1a6e1c006e3ced5fa4d&group=5384f0dafada13dd52c6c14e&sort=date_created
```

**Respuesta**
```json
{
  "status": "OK",
  "data": [
    {
        "_code": "m-aaa-122-sd",
        "_detail": "coupon 1",
        "_id": "5426ad1a5e2af1e255de8b98",
        "account": "514a9db27207f311260fac04",
        "code": "M-AAA-122-SD",
        "date_created": "2014-09-16T15:28:26.021Z",
        "detail": "Coupon 1",
        "group": {
          "_id": "5384f0dafada13dd52c6c14e",
          "name": "Main Group"
        },
        "is_active": true,
        "is_reusable": false,
        "is_used": false,
        "is_valid": true,
        "percent": 100,
        "type": "ppv"
    },
    {
        "_code": "mns-90-lk-12",
        "_detail": "coupon 2",
        "_id": "5419b60b2a91e68112b12392",
        "account": "514a9db27207f311260fac04",
        "code": "MNS-90-LK-12",
        "date_created": "2014-09-17T16:25:47.832Z",
        "detail": "Coupon 2",
        "group": {
          "_id": "5384f0dafada13dd52c6c14e",
          "name": "Main Group"
        },
        "id": "5419b60b2a91e68112b12392",
        "is_active": true,
        "is_reusable": false,
        "is_used": false,
        "is_valid": true,
        "percent": 100,
        "type": "ppv"
    }
  ]
}
```

>###POST /api/coupon

Permite la creaci&oacute;n de *Cupones*.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                        |

**Par&aacute;metros Opcionales**

| Param                 | Descripci&oacute;n                                                                |
| --------------------- | --------------------------------------------------------------------------------- |
| group                 | (String) Identiicador de Grupo de Cupones al que asociar el nuevo *cup&oacute;n*. |
| is_reusable           | (Booleano) Determina si el cup&oacute;n ser&aacute; reutilizable.                 |
| custom_code           | (String) C&oacute;digo a utilizar para el cup&oacute;n (s&oacute;lo para *cupones reutilizables*). |
| detail                | (String) Descripción para el nuevo cupón. |
| is_valid              | (Booleano) Determina si el cupón será válido o no. |
| quantity              | (Entero) Cantidad de cupones a generar (en caso de *cupones reutilizables* este número será siempre 1). |
| valid_from            | (Fecha ISO8601) Fecha desde la cuál será válido el cupón generado. |
| valid_to              | (Fecha ISO8601) Fecha hasta la cuál será válido el cupón generado. |
| type                  | (String) Tipo de cupón a agenerar: ppv, subscription. |
| discount_type         | (String) Tipo de descuento a entregar al usuario: percent, days |
| days                  | (Entero) Cantidad de días a entregar al usuario que active éste cupón (válido sólo para cupones de tipo **subscription**) |
| percent               | (Entero) Porcentaje de descuento a entregar al usuaro que active éste cupón (válido sólo para cupones de tipo **subscription**)

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/coupon
```

**Respuesta**
```json
{
  "status": "OK",
  "data": [
    {
        "_code": "m-aaa-122-sd",
        "_detail": "coupon 1",
        "_id": "5426ad1a5e2af1e255de8b98",
        "account": "514a9db27207f311260fac04",
        "code": "M-AAA-122-SD",
        "date_created": "2014-09-16T15:28:26.021Z",
        "detail": "Coupon 1",
        "group": {
          "_id": "5384f0dafada13dd52c6c14e",
          "name": "Main Group"
        }, 
        "is_active": true,
        "is_reusable": false,
        "is_used": false,
        "is_valid": true,
        "percent": 100,
        "type": "ppv"
    }
  ]
}
```

>###GET /api/coupon/{coupon_id}

Devuelve información del cupón especificado por **{coupon_id}**.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                    |
| coupon_id     | (String) Identificador del *cupón*                 |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/coupon/5426ad1a5e2af1e255de8b98?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**
```json
{
  "status": "OK",
  "data": [
    {
        "_code": "m-aaa-122-sd",
        "_detail": "coupon 1",
        "_id": "5426ad1a5e2af1e255de8b98",
        "account": "514a9db27207f311260fac04",
        "code": "M-AAA-122-SD",
        "date_created": "2014-09-16T15:28:26.021Z",
        "detail": "Coupon 1",
        "group": {
          "_id": "5384f0dafada13dd52c6c14e",
          "name": "Main Group"
        }, 
        "is_active": true,
        "is_reusable": false,
        "is_used": false,
        "is_valid": true,
        "percent": 100,
        "type": "ppv"
    }
  ]
}
```

>###POST /api/coupon/{coupon_id}

Permite la actualización del *cupón* especificado por **{coupon_id}**.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                    |
| coupon_id     | (String) Identificador del cupón a actualizar	     |

**Par&aacute;metros Opcionales**

| Param                | Descripci&oacute;n                                        |
| -------------------- | --------------------------------------------------------- |
| group                | (String) Identificador del Grupo de Cupones al que asociar el nuevo cup&oacute;n.    |
| detail               | Descripción para el nuevo cupón. |
| is_valid             | Determina si el cupón será válido o no. |
| valid_from           | Fecha desde la cuál será válido el cupón generado. |
| valid_to             | Fecha hasta la cuál será válido el cupón generado. |
| type                 | Tipo de cupón a agenerar: ppv, subscription. |
| days                 | Cantidad de días a entregar al usuario que active éste cupón (válido sólo para cupones de tipo **subscription**) |
| percent              | Porcentaje de descuento a entregar al usuaro que active éste cupón (válido sólo para cupones de tipo **subscription**) |


**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "detail=Promo 1 Coupon" https://api.streammanager.co/api/coupon/5426ad1a5e2af1e255de8b98
```

**Respuesta**
```json
{
  "status": "OK",
  "data": [
    {
        "_code": "m-aaa-122-sd",
        "_detail": "promo 1 coupon",
        "_id": "5426ad1a5e2af1e255de8b98",
        "account": "514a9db27207f311260fac04",
        "code": "M-AAA-122-SD",
        "date_created": "2014-09-16T15:28:26.021Z",
        "detail": "Promo 1 Coupon",
        "group": {
          "_id": "5384f0dafada13dd52c6c14e",
          "name": "Main Group"
        },
        "is_active": true,
        "is_reusable": false,
        "is_used": false,
        "is_valid": true,
        "percent": 100,
        "type": "ppv"
    }
  ]
}
```

#[Customer](http://streammanager.co/docs/es/api.html#customer)

>###GET /api/customer

Obtiene listado de *Customers* relacionados a la cuenta del cliente.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                          |

**Par&aacute;metros Opcionales**

| Param         | Descripci&oacute;n                                        |
| ------------- | --------------------------------------------------------- |
| id 			| (String) Identificador del *customer* a devolver |
| email 		| (String) Email del *customer* a devolver |
| first_name 	| (String) Primer nombre del *customer* a devolver |
| last_name 	| (String) Apellido del *customer* a devolver |
| status 		| (String) Filtra el listado de *customers* según su estado: **active** / **inactive** |
| start 		| (Fecha ISO8601) Devolverá los *customers* creados después de la fecha pasada como parámetro |
| end 			| (Fecha ISO8601) Devolverá los *customers* creados antes de la fecha pasada como parámetro |
| sort          | (String) Campo de ordenaci&oacute;n de los resultados     |
| limit         | (Entero) Define n&uacute;mero de registros a devolver     |
| skip          | (Entero) Define a partir de qué registro serán devueltos los datos

**Ejemplo**

```bash
curl https://api.streammanager.co/api/customer?token=eece62ac37bdf1a6e1c006e3ced5fa4d&status=active&sort=date_created
```

**Respuesta**
```json
{
  "status": "OK",
  "data": [
    {
        "_id": "519b28ec2808dd092aabdcd1",
        "account": "514a9db27207f311260fac04",
        "date_created": "2013-11-30T18:05:32.433Z",
        "first_name": "User Name",
        "has_active_purchase": false,
        "id": "519b28ec2808dd092aabdcd1",
        "last_name": "User Last Name",
        "obsolete": false,
        "status": "ACTIVE"
    },
    {
        "_id": "519b28ec2808dd092aabdcd2",
        "account": "514a9db27207f311260fac04",
        "date_created": "2013-11-30T20:26:32.401Z",
        "first_name": "New User Name",
        "has_active_purchase": true,
        "id": "519b28ec2808dd092aabdcd2",
        "last_name": "New User Last Name",
        "obsolete": false,
        "status": "ACTIVE"
    }
  ]
}
```

>###GET /api/customer/{customer_id}

Obtiene detalles del *customer* especificado por **{customer_id}**.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                          |
| customer_id   | (String) Identificador del *customer* a devolver   |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/customer/519b28ec2808dd092aabdcd2?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**
```json
{
  "status": "OK",
  "data": [
    {
      "_id": "519b28ec2808dd092aabdcd2",
      "account": "514a9db27207f311260fac04",
      "date_created": "2013-11-30T20:26:32.401Z",
      "first_name": "New User Name",
      "has_active_purchase": true,
      "id": "519b28ec2808dd092aabdcd2",
      "last_name": "New User Last Name",
      "obsolete": false,
      "status": "ACTIVE"
    }
  ]
}
```

>###POST /api/customer

Permite la creación de un *customer*.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                    |

**Par&aacute;metros Opcionales**

| Param           | Descripci&oacute;n                                                           |
| --------------- | ---------------------------------------------------------------------------- |
| email 		  | (String) Email para el nuevo *customer*                                      |
| first_name 	  | (String) Primer nombre del nuevo *customer*                                  |
| last_name 	  | (String) Apellido del *customer*                                             |
| password        | (String) Contraseña para el nuevo customer de longitud mayor a 6 caracteres  |
| address_line1   | (String) Dirección a asignar al *customer*                                   |
| address_line2   | (String) Dirección a asignar al *customer*                                   |
| address_city    | (String) Ciudad                                                              |
| address_state   | (String) Estado                                                              |
| address_country | (String) País                                                                |
| photo           | (String) Foto a asignar al nuevo *customer* (URL)                            |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "first_name=John" -d "last_name=Doe" -d "password=johndoe0987" https://api.streammanager.co/api/customer
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "519b28ec2808dd092aabdcd3",
      "account": "514a9db27207f311260fac04",
      "date_created": "2013-11-30T20:26:32.401Z",
      "first_name": "John",
      "has_active_purchase": false,
      "id": "519b28ec2808dd092aabdcd3",
      "last_name": "Doe",
      "obsolete": false,
      "status": "ACTIVE"
    }
  ]
}
```

>###POST /api/customer/{customer_id}

Permite la actualización del *customer* especificado por **{customer_id}**.

**Par&aacute;metros Requeridos**

| Param         | Descripci&oacute;n                                 |
| ------------- | -------------------------------------------------- |
| token         | (String) Token de Autenticación                    |
| customer_id   | (String) Identificador del *customer* a actualizar |

**Par&aacute;metros Opcionales**

| Param           | Descripci&oacute;n                                                |
| --------------- | ----------------------------------------------------------------- |
| email 		  | (String) Email para el *customer*                                 |
| first_name 	  | (String) Primer nombre del *customer*                             |
| last_name 	  | (String) Apellido del *customer*                                  |
| password        | (String) Contraseña para el customer de longitud mayor a 6 caracteres |
| status 	  	  | (String) Modifica el estado del *customer*: active, inactive |
| address_line1   | (String) Dirección a asignar al *customer* |
| address_line2   | (String) Dirección a asignar al *customer* |
| address_city    | (String) Ciudad |
| address_state   | (String) Estado |
| address_country | (String) País |
| photo           | (String) Foto a asignar al *customer* (URL) |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "first_name=John" -d "last_name=Foo" -d "password=john0987" https://api.streammanager.co/api/customer/519b28ec2808dd092aabdcd3
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "519b28ec2808dd092aabdcd3",
      "account": "514a9db27207f311260fac04",
      "date_created": "2013-11-30T20:26:32.401Z",
      "first_name": "John",
      "has_active_purchase": false,
      "id": "519b28ec2808dd092aabdcd3",
      "last_name": "Foo",
      "obsolete": false,
      "status": "ACTIVE"
    }
  ]
}
```

>###DEL /api/customer/{customer_id}

Permite eliminar el *customer* especificado por **{customer_id}**.

**Par&aacute;metros Requeridos**

| Param       | Descripci&oacute;n            |
| ----------- | ----------------------------- |
| token       | (String) Token de Autenticación   |
| customer_id | (String) Identificador del *customer* a eliminar |

**Ejemplo**

```bash
curl -X "DELETE" -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/customer/519b28ec2808dd092aabdcd3
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

#[Live Stream](http://streammanager.co/docs/es/api.html#livestream)

>###GET /api/live-stream

Permite la búsqueda de *live streams* disponibles en la cuenta del cliente.

**Par&aacute;metros Requeridos**

| Param  | Descripci&oacute;n   |
| ------ | -------------------- |
| token  | (String) Token de Autenticación     |

**Par&aacute;metros Opcionales**

| Param  | Descripci&oacute;n   |
| ------ | -------------------- |
| id     | (String) Identificador espec&iacute;fico del *live stream* a buscar. Devuelve un único registro en caso de ser encontrado. |
| query  | (String) Texto de búsqueda libre, busca coincidencias por nombre de *Live Stream*                               |
| limit  | (Entero) Limita el número de resultados                                                                         |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/live-stream?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "113a50a71043854c44000020",
      "name": "Live Stream",
      "preferred_protocol": "hls",
      "access_rules": {
        "devices": {
          "deny_mobile": false,
          "deny_tv": false
        },
        "cellular": {
          "enabled": false
        },
        "geo": {
          "countries": [],
          "enabled": false
        }
      },
      "date_created": "2013-01-01T20:00:00.000Z",
      "views": 10000,
      "online": false
    }
  ]
}
```

>###GET /api/live-stream/{live_stream_id}

Devuelve los detalles del *live stream* especificado por **{live_stream_id}**.

**Par&aacute;metros Requeridos**

| Param          | Descripci&oacute;n   |
| -------------- | -------------------- |
| token          | Token de Autenticación     |
| live_stream_id | Identificador del *live stream* a devolver |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/live-stream/113a50a71043854c44000020?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "113a50a71043854c44000020",
      "name": "Live Stream",
      "preferred_protocol": "hls",
      "access_rules": {
        "devices": {
          "deny_mobile": false,
          "deny_tv": false
        },
        "cellular": {
          "enabled": false
        },
        "geo": {
          "countries": [],
          "enabled": false
        }
      },
      "date_created": "2013-01-01T20:00:00.000Z",
      "views": 10000,
      "online": false
    }
  ]
}
```

>###POST /api/live-stream

**Par&aacute;metros Requeridos**

| Param              | Descripci&oacute;n                                         |
| ------------------ | ---------------------------------------------------------- |
| token              | (String) Token de autenticaci&oacute;n (con permisos de escritura). |
| cdn_zones          | (Array) Zonas del CDN habilitadas para publicaci&oacute;n y consumo. Opciones: us, cl |
| encoding_profiles  | (Array) Perfiles de encoding habilitados. Cada objeto debe incluir "profile" (opciones: 720p, 480p, 360p, 240p) y "video_bitrate" (tasa de transferencia en bits) |

**Par&aacute;metros Opcionales**

| Param                           | Descripci&oacute;n                                      |
| ------------------------------- | ------------------------------------------------------- |
| name                            | (String) Nombre del *live stream*.                      |
| closed_access                   | (Booleano) Indica si el live stream es de tipo cerrado o abierto|
| preferred_protocol              | (String) Indica el protocol de preferencia para el consumo. Opciones: hls, rtmp, rtmpt |
| online                          | (Booleano) Modifica el estado del *live stream*. Opciones: true, false |
| dvr                             | (Booleano) Especifica si deberá utilizarse DVR para el *live stream*. Opciones: true, false |
| cellular_restriction            | (String) Restringe la visualización del *live stream* a redes móviles. Opciones: allow, deny |
| geo_restriction                 | (String) Restringe la visualización del *live stream* a ciertos países. Opciones: allow, deny |
| geo_restriction_countries       | (Array) En caso de utilizarse *geo_restriction*, se listan los países restringidos o habilitados a ver el evento |
| referer_restriction             | (String) Restringe la visualización del *live stream* según referer. Opciones: allow, deny |
| referer_restriction_list        | (Array) En caso de utilizarse *referer_restriction*, se listan los referers restringidos o habilitados |
| ip_restriction                  | (String) Restringe la visualización del *live stream* según IPs. Opciones: allow, deny |
| ip_restriction_list             | (Array) En caso de utilizarse *ip_restriction*, se listan las direcciones IP restringidas o habilitadas |
| device_restriction_deny_mobile  | (String) Restringe la visualización del *live stream* a dispositivos móviles. Opciones: allow, deny |
| device_restriction_deny_tv      | (String) Restringe la visualización del *live stream* a TVs. Opciones: allow, deny |
| time_limit                      | (Entero) Tiempo límite de visualización del *live stream*. Default: segundos.
| time_limit_unit                 | (String) Unidad de tiempo para *time_limit*. Opciones: seconds, minutes, hours. |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "name=my_live_stream&cdn_zones[]=us&encoding_profiles[0][profile]=720p&encoding_profiles[0][video_bitrate]=3000000&preferred_protocol=hls" https://api.streammanager.co/api/live-stream
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "51b6599f017ae1555c000001",
      "account": "506c79a845e85a5e28000001",
      "ad": null,
      "name": "my_live_stream",
      "player_skin": "default",
      "preferred_protocol": "hls",
      "stream_id": "1516585b5cb95f8e35f9b726dfa6ff88",
      "access_rules": {
        "devices": {
          "deny_tv": false,
          "deny_desktop": false,
          "deny_mobile": false
        },
        "cellular": {
          "allow": true,
          "enabled": false
        },
        "geo": {
          "countries": [],
          "allow": true,
          "enabled": false
        }
      },
      "viewing_time_limit": {
        "user_time": null,
        "user_unit": null,
        "seconds": 0,
        "enabled": false
      },
      "date_created": "2012-01-10T20:00:00.000Z",
      "encoding_profiles": {
        "240p": {
          "bitrate": 350000,
          "enabled": false
        },
        "360p": {
          "bitrate": 1000000,
          "enabled": false
        },
        "480p": {
          "bitrate": 800000,
          "enabled": false
        },
        "720p": {
          "bitrate": 3000000,
          "enabled": true
        }
      },
      "cdn_zones": [
        "us"
      ],
      "views": 0,
      "recording": false,
      "closed_access": false,
      "online": false
    }
  ]
}
```

>###POST /api/live-stream/{live_stream_id}

Permite la actualización del *live stream* especificado por **{live_stream_id}**

**Par&aacute;metros Requeridos**

| Param              | Descripci&oacute;n                                                  |
| ------------------ | ------------------------------------------------------------------- |
| token              | (String) Token de autenticaci&oacute;n (con permisos de escritura)  |
| live_stream_id     | (String) Identificador del *live stream* a actualizar               |

**Par&aacute;metros Opcionales**

| Param                     | Descripci&oacute;n                                               |
| ------------------------- | ---------------------------------------------------------------- |
| name                      | (String) Nombre del *live stream*                                |
| cdn_zones                 | (Array) Zonas del CDN habilitadas para publicaci&oacute;n y consumo. Opciones: us, cl |
| closed_access             | (Booleano) Indica si el *live stream* es de tipo cerrado o abierto. |
| preferred_protocol        | (String) Indica el protocol de preferencia para el consumo. Opciones: hls, rtmp, rtmpt |
| encoding_profiles         | (String) Perfiles de encoding habilitados. Cada objeto debe incluir "profile" (opciones: 720p, 480p, 360p, 240p) y "video_bitrate" (tasa de transferencia en bits) |
| online                    | (Booleano) Modifica el estado del *live stream*. Opciones: true, false |
| dvr                       | (Booleano) Especifica si deberá utilizarse DVR para el *live stream*. Opciones: true, false |
| cellular_restriction      | (String) Restringe la visualización del *live stream* a redes móviles. Opciones: allow, deny |
| geo_restriction           | (String) Restringe la visualización del *live stream* a ciertos países. Opciones: allow, deny |
| geo_restriction_countries | (Array) En caso de utilizarse *geo_restriction*, se listan los países restringidos o habilitados a ver el *live stream* |
| referer_restriction       | (String) Restringe la visualización del *live stream* según referer. Opciones: allow, deny |
| referer_restriction_list  | (Array) En caso de utilizarse *referer_restriction*, se listan los referers restringidos o habilitados |
| ip_restriction            | (String) Restringe la visualización del *live stream* según IPs. Opciones: allow, deny |
| ip_restriction_list       | (Array) En caso de utilizarse *ip_restriction*, se listan las direcciones IP restringidas o habilitadas |
| device_restriction_deny_mobile  | (String) Restringe la visualización del *live stream* a dispositivos móviles. Opciones: allow, deny |
| device_restriction_deny_tv      | (String) Restringe la visualización del *live stream* a TVs. Opciones: allow, deny |
| time_limit                      | (Entero) Tiempo límite de visualización del *live stream*. Default: segundos.
| time_limit_unit                 | (String) Unidad de tiempo para *time_limit*. Opciones: seconds, minutes, hours. |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "name=Main Event&encoding_profiles[0][bitrate]=2500000" https://api.streammanager.co/api/live-stream/51b6599f017ae1555c000001
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "51b6599f017ae1555c000001",
      "account": "506c79a845e85a5e28000001",
      "ad": null,
      "name": "Main Event",
      "player_skin": "default",
      "preferred_protocol": "hls",
      "stream_id": "1516585b5cb95f8e35f9b726dfa6ff88",
      "access_rules": {
        "devices": {
          "deny_tv": false,
          "deny_desktop": false,
          "deny_mobile": false
        },
        "cellular": {
          "allow": true,
          "enabled": false
        },
        "geo": {
          "countries": [],
          "allow": true,
          "enabled": false
        }
      },
      "viewing_time_limit": {
        "user_time": null,
        "user_unit": null,
        "seconds": 0,
        "enabled": false
      },
      "date_created": "2012-01-10T20:00:00.000Z",
      "encoding_profiles": {
        "240p": {
          "bitrate": 350000,
          "enabled": false
        },
        "360p": {
          "bitrate": 1000000,
          "enabled": false
        },
        "480p": {
          "bitrate": 800000,
          "enabled": false
        },
        "720p": {
          "bitrate": 2500000,
          "enabled": true
        }
      },
      "cdn_zones": [
        "us"
      ],
      "views": 0,
      "recording": false,
      "closed_access": false,
      "online": false
    }
  ]
}
```

>###DEL /api/live-stream/{live_stream_id}

Elimina el *live_stream* identificado por **{live_stream_id}**.

**Par&aacute;metros Requeridos**

| Param              | Descripci&oacute;n                                   |
| ------------------ | ---------------------------------------------------- |
| token              | (String) Token de autenticaci&oacute;n.              |
| live_stream_id     | (String) Identificador del *live stream* a eliminar  |

**Ejemplo**

```bash
curl -X "DELETE" -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/live-stream/51b6599f017ae1555c000001
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

>###GET /api/live-stream/{live_stream_id}/schedule

Se pueden obtener los *Eventos* relacionados a un *live stream* desde la API.

**Par&aacute;metros Requeridos**

| Param          | Descripci&oacute;n                                      |
| -------------- | ------------------------------------------------------- |
| token          | (String) Token de autenticaci&oacute;n.                 |
| live_stream_id | (String) Identificador del *live stream* a consultar.   |

**Par&aacute;metros Opcionales**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| for_recording   | (Booleano) Devuelve los *live streams* marcados para grabación automática |
| is_auto_publish | (Booleano) Devuelve los *live streams* cuyos medias resultantes serán publicados automáticamente |
| is_current      | (Booleano) Devuelve los *live streams* actuales |
| start_after     | (Fecha ISO8601) Devuelve los *live streams* que inician luego de la fecha indicada en el parámetro |
| start_before    | (Fecha ISO8601) Devuelve los *live streams* que inician antes de la fecha indicada en el parámetro |
| sort            | (String) Campo de ordenaci&oacute;n de los resultados     |
| limit           | (Entero) Define n&uacute;mero de registros a devolver     |
| skip            | (Entero) Define a partir de qué registro serán devueltos los datos |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/live-stream/51b6599f017ae1555c000001/schedule
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "date_end": "2013-12-28T04:00:00.000Z",
      "date_start": "2013-12-28T03:00:00.000Z",
      "name": "Equipo 1 vs. Equipo 2",
      "code": "equipo1_vs_equipo2",
      "_id": "aabdd5dd14c52dfbbb12adb9",
      "is_auto_publish": false,
      "is_featured": true,
      "for_recording": false,
      "is_current": false,
      "is_past": false,
      "is_future": true,
      "id": "aabdd5dd14c52dfbbb12adb9"
    },
    {
      "date_end": "2013-12-30T09:00:00.000Z",
      "date_start": "2013-12-29T08:00:00.000Z",
      "name": "Equipo 3 vs. Equipo 4",
      "code": "equipo3_vs_equipo4",
      "_id": "aabdd5dd14c52dfbbb12ad10",
      "is_auto_publish": true,
      "is_featured": false,
      "for_recording": true,
      "is_current": false,
      "is_past": false,
      "is_future": true,
      "id": "aabdd5dd14c52dfbbb12ad10"
    }
  ]
}
```

>###GET /api/live-stream/{live_stream_id}/schedule/{schedule_id}

Devuelve los detalles del *evento* identificado por **{schedule_id}**.

**Par&aacute;metros Requeridos**

| Param          | Descripci&oacute;n   |
| -------------- | -------------------- |
| token          | (String) Token de autenticaci&oacute;n               |
| live_stream_id | (String) Identificador del *live stream* a consultar |
| schedule_id    | (String) Identificador del *schedule* a consultar |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/live-stream/51b6599f017ae1555c000001/schedule/aabdd5dd14c52dfbbb12adb9
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "date_end": "2013-12-28T04:00:00.000Z",
      "date_start": "2013-12-28T03:00:00.000Z",
      "name": "Equipo 1 vs. Equipo 2",
      "code": "equipo1_vs_equipo2",
      "_id": "aabdd5dd14c52dfbbb12adb9",
      "is_auto_publish": false,
      "is_featured": true,
      "for_recording": false,
      "is_current": false,
      "is_past": false,
      "is_future": true,
      "id": "aabdd5dd14c52dfbbb12adb9"
    }
  ]
}
```

#[Media](http://streammanager.co/docs/es/api.html#media)

>###GET /api/media

Permite la búsqueda de *medias* disponibles en la cuenta de cliente.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |

**Par&aacute;metros Opcionales**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| id              | (String) Identificador del *media* a buscar. Devuelve un único registro en caso de ser encontrado. |
| query           | (String) Texto de búsqueda libre, busca coincidencias por t&iacute;tulo de *Media* |
| min_duration    | (Entero) Busca coincidencias de "Media" mayores o iguales al valor indicado (en segundos) |
| max_duration    | (Entero Busca coincidencias de "Media" menores o iguales al valor indicado (en segundos) |
| category_id     | (Array) Busca coincidencias de "Media" que pertenezcan al ID de categor&iacute;a indicada |
| category_name   | (Array) Busca coincidencias de "Media" que pertenezcan al nombre de categor&iacute;a indicada |
| tag             | (Array) Busca coincidencias de "Media" que contengan el tag indicado |
| created_before  | (Fecha ISO8601) Busca coincidencias de "Media" cuya fecha de creaci&oacute;n sea menor a lo indicado |
| created_after   | (Fecha ISO8601) Busca coincidencias de "Media" cuya fecha de creaci&oacute;n sea mayor a lo indicado |
| recorded_before | (Fecha ISO8601) Busca coincidencias de "Media" cuya fecha de grabaci&oacute;n sea menor a lo indicado |
| recorded_after  | (Fecha ISO8601) Busca coincidencias de "Media" cuya fecha de grabaci&oacute;n sea mayor a lo indicado |
| is_published    | (Booleano) Devuelve todos los *medias* publicados |
| limit           | (Entero) Limita el número de resultados |
| sort            | (String) Ordena los resultados según el par&aacute;metro indicado. Se acepta cualquiera de los atributos devueltos por la API. Para revertir el orden, se debe agregar "-" a la izquierda del atributo. Ejemplo: -date_created |
| skip            | (Entero) Define a partir de qu&eacute; registro ser&aacute;n devueltos los datos                 |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/media?token=eece62ac37bdf1a6e1c006e3ced5fa4d&query=video&max_duration=120&tag=vimeo&tag=youtube
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "502de05313c18fea0800009a",
      "date_available_end": null,
      "date_available_start": "2012-08-20T12:00:00.000Z",
      "description": "",
      "title": "Test Video 1",
      "date_created": "2012-08-17T06:10:27.653Z",
      "tracks": [],
      "thumbnails": [
        {
          "url": "http://media-cl.media.mdstrm.com/thumbs/502de05313c18fea0800009a_1.jpg",
          "name": "502de05313c18fea0800009a_1.jpg",
          "_id": "502de05c03f6e5eb08000080",
          "cdn_zone": "cl",
          "is_default": true
        },
        {
          "url": "http://media-cl.media.mdstrm.com/thumbs/502de05313c18fea0800009a_3.jpg",
          "name": "502de05313c18fea0800009a_3.jpg",
          "_id": "502de05c13c18fea080000a4",
          "cdn_zone": "cl",
          "is_default": false
        }
      ],
      "meta": [
        {
          "url": "http://mdstrm.com/video/502de05313c18fea0800009a.mp4",
          "aspect": "4:3",
          "process_time": 160,
          "status": "OK",
          "label": "Original",
          "_id": "502de05b13c18fea0800009f",
          "cdn_zone": "cl",
          "resolution": {
            "width": 480,
            "height": 352
          },
          "codec": {
            "video": {
              "name": "H.264",
              "bitrate": 269
            },
            "audio": {
              "name": "AAC",
              "bitrate": 96
            }
          },
          "is_original": true
        },
        {
          "_id": "502de05b13c18fea080000a0",
          "aspect": "4:3",
          "label": "360p@600",
          "process_time": 1061,
          "status": "OK",
          "url": "http://mdstrm.com/video/502de05b13c18fea080000a0.mp4",
          "cdn_zone": "cl",
          "resolution": {
            "height": 360,
            "width": 490
          },
          "codec": {
            "audio": {
              "bitrate": 64,
              "name": "AAC"
            },
            "video": {
              "bitrate": 627,
              "name": "H.264"
            }
          },
          "is_original": false
        }
      ],
      "categories": [
        {
          "account": "502ddfb413c18fea0800006e",
          "name": "Test Category 1",
          "_id": "502ddfdb13c18fea08000071",
          "date_created": "2012-08-17T06:08:27.306Z"
        }
      ],
      "protocols": {
        "hls": "http://mdstrm.com/video/502de05313c18fea0800009a.m3u8"
      }, 
      "tags": [
        "vimeo",
        "youtube"
      ],
      "duration": 110,
      "is_uploaded": true,
      "is_published": true
    }
  ]
}
```

>###GET /api/media/{media_id}

Devuelve los detalles del *media* identificado por **{media_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* a consultar |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/media/502de05313c18fea0800009a
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "502de05313c18fea0800009a",
      "date_available_end": null,
      "date_available_start": "2012-08-20T12:00:00.000Z",
      "description": "",
      "title": "Test Video 1",
      "date_created": "2012-08-17T06:10:27.653Z",
      "tracks": [],
      "thumbnails": [
        {
          "url": "http://media-cl.media.mdstrm.com/thumbs/502de05313c18fea0800009a_1.jpg",
          "name": "502de05313c18fea0800009a_1.jpg",
          "_id": "502de05c03f6e5eb08000080",
          "cdn_zone": "cl",
          "is_default": true
        },
        {
          "url": "http://media-cl.media.mdstrm.com/thumbs/502de05313c18fea0800009a_3.jpg",
          "name": "502de05313c18fea0800009a_3.jpg",
          "_id": "502de05c13c18fea080000a4",
          "cdn_zone": "cl",
          "is_default": false
        }
      ],
      "meta": [
        {
          "url": "http://mdstrm.com/video/502de05313c18fea0800009a.mp4",
          "aspect": "4:3",
          "process_time": 160,
          "status": "OK",
          "label": "Original",
          "_id": "502de05b13c18fea0800009f",
          "cdn_zone": "cl",
          "resolution": {
            "width": 480,
            "height": 352
          },
          "codec": {
            "video": {
              "name": "H.264",
              "bitrate": 269
            },
            "audio": {
              "name": "AAC",
              "bitrate": 96
            }
          },
          "is_original": true
        },
        {
          "_id": "502de05b13c18fea080000a0",
          "aspect": "4:3",
          "label": "360p@600",
          "process_time": 1061,
          "status": "OK",
          "url": "http://mdstrm.com/video/502de05b13c18fea080000a0.mp4",
          "cdn_zone": "cl",
          "resolution": {
            "height": 360,
            "width": 490
          },
          "codec": {
            "audio": {
              "bitrate": 64,
              "name": "AAC"
            },
            "video": {
              "bitrate": 627,
              "name": "H.264"
            }
          },
          "is_original": false
        }
      ],
      "categories": [
        {
          "account": "502ddfb413c18fea0800006e",
          "name": "Test Category 1",
          "_id": "502ddfdb13c18fea08000071",
          "date_created": "2012-08-17T06:08:27.306Z"
        }
      ],
      "protocols": {
        "hls": "http://mdstrm.com/video/502de05313c18fea0800009a.m3u8"
      },
      "tags": [
        "vimeo",
        "youtube"
      ],
      "duration": 110,
      "is_uploaded": true,
      "is_published": true
    }
  ]
}
```

>###POST /api/media

Permite la creaci&oacute;n de un *media*. Para esto es requerido que exista un archivo en el directorio de upload de la cuenta.

Es importante considerar que el transcoding inicial y la generaci&oacute;n de rendiciones adicionales del video seleccionado es asincr&oacute;nico y es responsabilidad del cliente consultar periodicamente por el estado de estos procesos.

**Par&aacute;metros Requeridos**

| Param | Descripci&oacute;n                |
| ----- | --------------------------------- |
| token | (String) Token de Autenticación   |

**Par&aacute;metros Opcionales**

| Param                          | Descripci&oacute;n   |
| ------------------------------ | -------------------- |
| title                          | (String) T&iacute;tulo del media. |
| description                    | (String) Descripci&oacute;n de la media. |
| is_published                   | (Booleano) Define si el media est&aacute; publicado o no. |
| ad                             | (String) Identificador del Ad a asociar al media. |
| available_from                 | (Booleano) Indica que se actualizar&aacute; la fecha a partir de la cu&aacute;l el media estar&aacute; disponible. |
| available_from_date            | (Fecha ISO8601) Fecha desde la cu&aacute;l el media estar&aacute; disponible. |
| available_from_hour            | (Entero) Hora desde la cu&aacute;l el media estar&aacute; disponible. |
| available_from_offset          | (Entero) Diferencia horaria que afecta la fecha desde la cu&aacute;l el media estar&aacute; disponible. Ejemplo: -3|
| available_until                | (Booleano) Indica que se actualizar&aacute; la fecha hasta la cu&aacute;l el media estar&aacute; disponible. |
| available_until_date           | (Fecha ISO8601) Fecha hasta la cu&aacute;l el media estar&aacute; disponible. |
| available_until_hour           | (Entero) Hora hasta la cu&aacute;l el media estar&aacute; disponible. |
| available_until_offset         | (Entero) Diferencia horaria que afecta a la fecha hasta la cu&aacute;l el media estar&aacute; disponible. |
| categories                     | (Array) Arreglo de IDs especificando las categor&iacute;as a asociar al media. |
| tags                           | (Array) Define los tags asociados al media. |
| date_recorded                  | (Fecha ISO8601) Fecha de grabaci&oacute;n. |
| cellular_restriction           | (Booleano) Define si el media estar&aacute; restringido o no a dispositivos m&oacute;viles. |
| closed_access_restriction      | (String) Valores aceptados: allow, deny . Indica si el media es de tipo cerrado o abierto. |
| geo_restriction                | (Booleano) Valores aceptados: allow, deny . Define si se utilizar&aacute; restricci&oacute;n por paises. |
| geo_restriction_countries      | (Array) Paises que estar&aacute;n habilitados o restringidos para ver el media. |
| device_restriction_deny_mobile | (Booleano) Indica que el media no se podr&aacute; ver en dispositivos m&oacute;viles. |
| device_restriction_deny_tv     | (Booleano) Indica que el media no se podr&aacute; ver en SmartTVs. |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "title=uploaded_video.mp4" -d "is_published=true" https://api.streammanager.co/api/media
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "502de05313c18fea0800009a",
      "date_available_end": null,
      "date_available_start": null,
      "description": "",
      "title": "uploaded_video.mp4",
      "date_created": "2012-08-17T06:10:27.653Z",
      "tracks": [],
      "thumbnails": [],
      "meta": [],
      "categories": [],
      "tags": [],
      "duration": null,
      "is_published": true
    }
  ]
}
```

>###POST /api/media/{media_id}

Permite la actualizaci&oacute;n del *media* especificado por **{media_id}**.

**Par&aacute;metros Requeridos**

| Param        | Descripci&oacute;n   |
| ------------ | -------------------- |
| token        | (String) Token de autenticaci&oacute;n |
| media_id     | (String) Identificador del *media* a actualizar |

**Par&aacute;metros Opcionales**

| Param                          | Descripci&oacute;n   |
| ------------------------------ | -------------------- |
| title                          | (String) T&iacute;tulo del media. |
| description                    | (String) Descripci&oacute;n de la media. |
| is_published                   | (Booleano) Define si el media est&aacute; publicado o no. |
| ad                             | (String) Identificador del Ad a asociar al media. |
| available_from                 | (Booleano) Indica que se actualizar&aacute; la fecha a partir de la cu&aacute;l el media estar&aacute; disponible. |
| available_from_date            | (Fecha ISO8601) Fecha desde la cu&aacute;l el media estar&aacute; disponible. |
| available_from_hour            | (Entero) Hora desde la cu&aacute;l el media estar&aacute; disponible. |
| available_from_offset          | (Entero) Diferencia horaria que afecta la fecha desde la cu&aacute;l el media estar&aacute; disponible. Ejemplo: -3|
| available_until                | (Booleano) Indica que se actualizar&aacute; la fecha hasta la cu&aacute;l el media estar&aacute; disponible. |
| available_until_date           | (Fecha ISO8601) Fecha hasta la cu&aacute;l el media estar&aacute; disponible. |
| available_until_hour           | (Entero) Hora hasta la cu&aacute;l el media estar&aacute; disponible. |
| available_until_offset         | (Entero) Diferencia horaria que afecta a la fecha hasta la cu&aacute;l el media estar&aacute; disponible. |
| categories                     | (Array) Arreglo de IDs especificando las categor&iacute;as a asociar al media. |
| tags                           | (Array) Define los tags asociados al media. |
| date_recorded                  | (Fecha ISO8601) Fecha de grabaci&oacute;n. |
| cellular_restriction           | (Booleano) Define si el media estar&aacute; restringido o no a dispositivos m&oacute;viles. |
| closed_access_restriction      | (String) Valores aceptados: allow, deny . Indica si el media es de tipo cerrado o abierto. |
| geo_restriction                | (Booleano) Valores aceptados: allow, deny . Define si se utilizar&aacute; restricci&oacute;n por paises. |
| geo_restriction_countries      | (Array) Paises que estar&aacute;n habilitados o restringidos para ver el media. |
| device_restriction_deny_mobile | (Booleano) Indica que el media no se podr&aacute; ver en dispositivos m&oacute;viles. |
| device_restriction_deny_tv     | (Booleano) Indica que el media no se podr&aacute; ver en SmartTVs. |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "is_published=true&device_restriction_deny_mobile=false" https://api.streammanager.co/api/media/51fb77b8a2be13d57907b2be
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "502de05313c18fea0800009a",
      "date_available_end": null,
      "date_available_start": "2012-08-20T12:00:00.000Z",
      "description": "",
      "title": "Test Video 1",
      "date_created": "2012-08-17T06:10:27.653Z",
      "tracks": [],
      "thumbnails": [
        {
          "url": "http://media-cl.media.mdstrm.com/thumbs/502de05313c18fea0800009a_1.jpg",
          "name": "502de05313c18fea0800009a_1.jpg",
          "_id": "502de05c03f6e5eb08000080",
          "cdn_zone": "cl",
          "is_default": true
        },
        {
          "url": "http://media-cl.media.mdstrm.com/thumbs/502de05313c18fea0800009a_3.jpg",
          "name": "502de05313c18fea0800009a_3.jpg",
          "_id": "502de05c13c18fea080000a4",
          "cdn_zone": "cl",
          "is_default": false
        }
      ],
      "meta": [
        {
          "url": "http://mdstrm.com/video/502de05313c18fea0800009a.mp4",
          "aspect": "4:3",
          "process_time": 160,
          "status": "OK",
          "label": "Original",
          "_id": "502de05b13c18fea0800009f",
          "cdn_zone": "cl",
          "resolution": {
            "width": 480,
            "height": 352
          },
          "codec": {
            "video": {
              "name": "H.264",
              "bitrate": 269
            },
            "audio": {
              "name": "AAC",
              "bitrate": 96
            }
          },
          "is_original": true
        },
        {
          "_id": "502de05b13c18fea080000a0",
          "aspect": "4:3",
          "label": "360p@600",
          "process_time": 1061,
          "status": "OK",
          "url": "http://mdstrm.com/video/502de05b13c18fea080000a0.mp4",
          "cdn_zone": "cl",
          "resolution": {
            "height": 360,
            "width": 490
          },
          "codec": {
            "audio": {
              "bitrate": 64,
              "name": "AAC"
            },
            "video": {
              "bitrate": 627,
              "name": "H.264"
            }
          },
          "is_original": false
        }
      ],
      "categories": [
        {
          "account": "502ddfb413c18fea0800006e",
          "name": "Test Category 1",
          "_id": "502ddfdb13c18fea08000071",
          "date_created": "2012-08-17T06:08:27.306Z"
        }
      ],
      "protocols": {
        "hls": "http://mdstrm.com/video/502de05313c18fea0800009a.m3u8"
      },
      "tags": [
        "vimeo",
        "youtube"
      ],
      "duration": 110,
      "is_uploaded": true,
      "is_published": true
    }
  ]
}
```

>###DEL /api/media/{media_id}

Elimina el *media* identificado por **{media_id}**.

**Par&aacute;metros Requeridos**

| Param    | Descripci&oacute;n   |
| -------- | -------------------- |
| token    | (String) Token de Autenticación   |
| media_id | (String) Identificador del *media* a eliminar |

**Ejemplo**

```bash
curl -X "DELETE" -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/media/51fb77b8a2be13d57907b2be
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

>###GET /api/media/:media_id/meta

Devuelve las rendiciones (*metas*) del *media* identificado por **{media_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* a consultar |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/media/502de05313c18fea0800009a/meta?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "502de05313c18fea0800009a",
      "meta": [
        {
          "url": "http://mdstrm.com/video/502de05313c18fea0800009a.mp4",
          "aspect": "4:3",
          "process_time": 160,
          "status": "OK",
          "label": "Original",
          "_id": "502de05b13c18fea0800009f",
          "cdn_zone": "cl",
          "resolution": {
            "width": 480,
            "height": 352
          },
          "codec": {
            "video": {
              "name": "H.264",
              "bitrate": 269
            },
            "audio": {
              "name": "AAC",
              "bitrate": 96
            }
          },
          "is_original": true
        },
        {
          "_id": "502de05b13c18fea080000a0",
          "aspect": "4:3",
          "label": "360p@600",
          "process_time": 1061,
          "status": "OK",
          "url": "http://mdstrm.com/video/502de05b13c18fea080000a0.mp4",
          "cdn_zone": "cl",
          "resolution": {
            "height": 360,
            "width": 490
          },
          "codec": {
            "audio": {
              "bitrate": 64,
              "name": "AAC"
            },
            "video": {
              "bitrate": 627,
              "name": "H.264"
            }
          },
          "is_original": false
        }
      ]
    }
  ]
}
```

>###GET /api/media/:media_id/thumbs

Devuelve las *thumbnails* (miniaturas) del *media* identificado por **{media_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* a consultar |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/media/502de05313c18fea0800009a/thumbs?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "502de05313c18fea0800009a",
      "thumbnails": [
        {
          "url": "http://media-cl.media.mdstrm.com/thumbs/502de05313c18fea0800009a_1.jpg",
          "name": "502de05313c18fea0800009a_1.jpg",
          "_id": "502de05c03f6e5eb08000080",
          "cdn_zone": "cl",
          "is_default": true
        },
        {
          "url": "http://media-cl.media.mdstrm.com/thumbs/502de05313c18fea0800009a_3.jpg",
          "name": "502de05313c18fea0800009a_3.jpg",
          "_id": "502de05c13c18fea080000a4",
          "cdn_zone": "cl",
          "is_default": false
        }
      ]
    }
  ]
}
```

>###POST /api/media/{media_id}/thumb

Dispara la captura de una miniatura para un *media* determinado por **{media_id}** en una posición predefinida.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* |

**Par&aacute;metros Opcionales**

| Param       | Descripci&oacute;n   |
| ----------- | -------------------- |
| position    | (Entero) Posición (en segundos) |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/media/502de05313c18fea0800009a/thumb?token=eece62ac37bdf1a6e1c006e3ced5fa4d&position=39
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

>###POST /api/media/{media_id}/thumb/{thumb_id}

Setea la *miniatura* identificada por **{thumb_id}** como la predeterminada para el *media* determinado por **{media_id}.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* a actualizar |
| thumb_id        | (String) Identificador de la *miniatura* a utilizar |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/media/502de05313c18fea0800009a/thumb/502de05c13c18fea080000a4
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

>###DEL /api/media/:media_id/thumb/:thumb_id

Elimina la *miniatura* identificada por **{thumb_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* a actualizar |
| thumb_id        | (String) Identificador de la *miniatura* a utilizar |

**Ejemplo**

```bash
curl -X "DELETE" -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/media/502de05313c18fea0800009a/thumb/502de05c13c18fea080000a4
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

>###GET /api/media/:media_id/tracks

Devuelve los *tracks* del *media* identificado por **{media_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* a consultar |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/media/502de05313c18fea0800009a/tracks?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "502de05313c18fea0800009a",
      "tracks": [
        {
          "thumbnail": "http://medias.mediastre.am/thumbs/5078354002aab87c2d000019_640x480_0.jpg",
          "position": 20,
          "name": "Track 1",
          "_id": "5078354002aab87c2d000019"
        },
        {
          "thumbnail": "http://medias.mediastre.am/thumbs/5078354ba239b87c2d000020_640x480_0.jpg",
          "position": 27,
          "name": "Track 2",
          "_id": "5078354ba239b87c2d000020"
        }
      ]
    }
  ]
}
```

>###POST /api/media/:media_id/track

Crea un nuevo *track* y lo relaciona al *media* determinado por **{media_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media*|

**Par&aacute;metros Opcionales**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| position        | (Entero) Posición (en segundos) para el nuevo *track* |
| name            | (String) Título a asignar al *track* |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "position=30" -d "name=Track 2" https://api.streammanager.co/api/media/502de05313c18fea0800009a/track
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

>###POST /api/media/:media_id/track/:track_id

Actualiza el *track* determinado por **{track_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* al cuál pertenece el *track* |
| track_id        | (String) Identificador del *track* a actualizar |

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| name            | (String) Título a asignar al *track* |

**Ejemplo**

```bash
curl -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" -d "name=Track 3" https://api.streammanager.co/api/media/502de05313c18fea0800009a/track/5078354002aab87c2d000019
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

>###DEL /api/media/:media_id/track/:track_id

Elimina el *track* determinado por **{track_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |
| media_id        | (String) Identificador del *media* al cuál pertenece el *track* |
| track_id        | (String) Identificador del *track* a eliminar |

**Ejemplo**

```bash
curl -X "DELETE" -d "token=eece62ac37bdf1a6e1c006e3ced5fa4d" https://api.streammanager.co/api/media/502de05313c18fea0800009a/track/5078354002aab87c2d000019
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```

#[Playlist](http://streammanager.co/docs/es/api.html#playlist)

>###GET /api/playlist

Lista los *playlists* asociados a la cuenta del cliente.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| token           | (String) Token de autenticaci&oacute;n |

**Par&aacute;metros Opcionales**

| Param           | Descripci&oacute;n   |
| --------------- | -------------------- |
| id              | Identificador del *playlist* a consultar |
| category_id     | (String) Devuelve los *playlists* que pertenezcan a la *categoría* identificada por *category_id* |
| category_name   | (String) Devuelve los *playlists* que pertenezcan a la *categoría* identificada por *category_name* |
| name            | (String) Devuelve el *playlist* cuyo nombre sea *name*.
| limit           | (Entero) Limita el número de resultados |
| sort            | (String) Ordena los resultados según el par&aacute;metro indicado. Se acepta cualquiera de los atributos devueltos por la API. Para revertir el orden, se debe agregar "-" a la izquierda del atributo. Ejemplo: -date_created |
| skip            | (Entero) Define a partir de qu&eacute; registro ser&aacute;n devueltos los datos                 |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/playlist?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "52bdc2bf2fd08fd1168aa15a",
      "_slug": "playlist-1",
      "access_rules": {
        "cellular": {
          "allow": true,
          "enabled": false
        },
        "closed_access": {
          "allow": true,
          "enabled": false
        },
        "devices": {
          "deny_desktop": false,
          "deny_mobile": false,
          "deny_tv": false
        },
        "geo": {
          "allow": true,
          "countries": [],
          "enabled": false
        },
        "ip": {
          "allow": true,
          "enabled": false,
          "ips": []
        },
        "referer": {
          "allow": true,
          "enabled": false,
          "referers": []
        }
      },
      "access_tokens": [],
      "account": "51d9748e70b56aff11adbe80",
      "categories": [
        {
          "_id": "51a1e26cdc5cff8f591b7181",
          "name": "Category 1"
        }
      ],
      "custom_html": [],
      "date_created": "2014-07-09T22:31:27.004Z",
      "description": "The first playlist",
      "featured": false,
      "name": "Playlist 1",
      "no_ad": false,
      "rules": {
        "manual": {
          "medias": []
        },
        "series": {
          "seasons": []
        },
        "smart": {
          "categories": null,
          "categories_rule": "in_any",
          "created_after": null,
          "created_before": null,
          "limit": null,
          "recorded_after": null,
          "recorded_before": null,
          "sort_asc": true,
          "sort_by": null,
          "tags": null,
          "tags_rule": "in_any",
          "title_rule": "starts_with"
        }
      },
      "slug": "playlist-1",
      "type": "smart"
    }
  ]
}
```

>###GET /api/playlist/{playlist_id}

Devuelve los detalles del *playlist* identificado por **{playlist_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n                                   |
| --------------- | ---------------------------------------------------- |
| token           | (String) Token de autenticaci&oacute;n               |
| playlist_id     | (String) Identificador del *playlist_id* a consultar |

**Ejemplo**

```bash
curl https://api.streammanager.co/api/playlist/52bdc2bf2fd08fd1168aa15a?token=eece62ac37bdf1a6e1c006e3ced5fa4d
```

**Respuesta**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "52bdc2bf2fd08fd1168aa15a",
      "_slug": "playlist-1",
      "access_rules": {
        "cellular": {
          "allow": true,
          "enabled": false
        },
        "closed_access": {
          "allow": true,
          "enabled": false
        },
        "devices": {
          "deny_desktop": false,
          "deny_mobile": false,
          "deny_tv": false
        },
        "geo": {
          "allow": true,
          "countries": [],
          "enabled": false
        },
        "ip": {
          "allow": true,
          "enabled": false,
          "ips": []
        },
        "referer": {
          "allow": true,
          "enabled": false,
          "referers": []
        }
      },
      "access_tokens": [],
      "account": "51d9748e70b56aff11adbe80",
      "categories": [
        {
          "_id": "51a1e26cdc5cff8f591b7181",
          "name": "Category 1"
        }
      ],
      "custom_html": [],
      "date_created": "2014-07-09T22:31:27.004Z",
      "description": "The first playlist",
      "featured": false,
      "name": "Playlist 1",
      "no_ad": false,
      "rules": {
        "manual": {
          "medias": []
        },
        "series": {
          "seasons": []
        },
        "smart": {
          "categories": null,
          "categories_rule": "in_any",
          "created_after": null,
          "created_before": null,
          "limit": null,
          "recorded_after": null,
          "recorded_before": null,
          "sort_asc": true,
          "sort_by": null,
          "tags": null,
          "tags_rule": "in_any",
          "title_rule": "starts_with"
        }
      },
      "slug": "playlist-1",
      "type": "smart"
    }
  ]
}
```

>###DEL /api/playlist/:playlist_id

Elimina el *playlist* identificado por **{playlist_id}**.

**Par&aacute;metros Requeridos**

| Param           | Descripci&oacute;n                                   |
| --------------- | ---------------------------------------------------- |
| token           | (String) Token de autenticaci&oacute;n               |
| playlist_id     | (String) Identificador del *playlist_id* a consultar |

**Ejemplo**

```bash
curl -X "DELETE" https://api.streammanager.co/api/playlist/52bdc2bf2fd08fd1168aa15a
```

**Respuesta**

```json
{
  "status": "OK",
  "data": null
}
```
