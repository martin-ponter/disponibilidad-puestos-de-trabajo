# Reservas de Puestos

App embebida en Bitrix24 para gestionar reservas de puestos y salas desde un unico acceso del menu izquierdo. El objetivo es que la logica de negocio viva en la app y que el almacenamiento principal quede en una SPA de Bitrix24 llamada "Reservas de Puestos".

## Objetivo del proyecto

Esta app cubre un flujo unico de reserva para dos tipos de recursos:

- Puestos individuales.
- Salas que se reservan completas.

El usuario entra desde Bitrix24, selecciona centro, elige una fecha, cambia de sala si lo necesita y reserva un recurso desde una unica modal. La estructura de centros, salas y recursos se define en codigo. Las reservas reales viven en Bitrix24 siempre que el contexto embebido y la configuracion esten disponibles.

## Flujo funcional completo

1. El usuario abre la app desde el menu izquierdo de Bitrix24.
2. La app detecta si esta dentro de Bitrix24 comprobando `window.BX24`.
3. Si hay contexto embebido:
   - inicializa `BX24`
   - intenta cargar usuario actual real
   - intenta cargar empleados reales
   - intenta leer reservas reales de la SPA
4. Si no hay contexto embebido, o alguna lectura falla, la app usa fallback local con mocks.
5. El usuario selecciona un centro.
6. El usuario selecciona un dia en el calendario.
7. La app carga las reservas de esa fecha y del centro/sala activos.
8. El usuario cambia de sala por selector o por botones anterior/siguiente.
9. La app renderiza los recursos de esa sala y marca los que ya tienen reservas para ese dia.
10. Al pulsar un recurso se abre la modal con centro, sala, recurso y fecha ya rellenados.
11. El usuario selecciona empleado, hora inicio, hora fin y observaciones.
12. La app valida obligatorios, permisos y solapes.
13. Si Bitrix24 esta disponible y la SPA esta configurada, crea un item real en Bitrix.
14. Si la app se ejecuta en local sin Bitrix, guarda en mock para poder seguir desarrollando el flujo.
15. Tras guardar, la app vuelve a leer las reservas y actualiza el mapa.

## Estado actual real vs mock

### Ya funciona con datos reales

- Deteccion de entorno embebido Bitrix24.
- Inicializacion de `BX24`.
- Lectura del usuario actual real mediante REST.
- Carga de empleados reales mediante REST.
- Lectura de reservas reales desde la SPA con `entityTypeId`.
- Creacion real de reservas en la SPA desde la modal.
- Mapeo entre campos Bitrix y el tipo interno `Reserva`.

### Sigue usando mock como fallback

- Usuario actual si `BX24` no existe o falla.
- Lista de empleados si la llamada real falla o se ejecuta en local.
- Reservas del dia si la lectura real no es posible.
- Guardado de reservas solo en local cuando no hay Bitrix24 o falta `entityTypeId`.

### Importante

En contexto Bitrix24, el guardado no cae a mock si la creacion real falla. En ese caso se muestra error y se registra en consola. El fallback a mock esta pensado para desarrollo local, no para ocultar errores de integracion real.

## Estructura de carpetas

```text
src/
  pages/
    index.astro
  components/
    Calendario.astro
    CentroSelector.astro
    RecursoModal.astro
    SalaViewer.astro
  data/
    mocks.ts
    oficinas.ts
  services/
    bitrix.ts
    bitrixMappers.ts
    empleados.ts
    reservas.ts
    salasReunion.ts
  utils/
    fechas.ts
    permisos.ts
    solapes.ts
  types/
    bitrix.ts
    reservas.ts
  scripts/
    app.ts
  styles/
    global.css
  layouts/
    Layout.astro
```

### Explicacion carpeta por carpeta

`src/pages/`
- Punto de entrada de Astro. `index.astro` compone la shell del widget embebido.

`src/components/`
- Componentes visuales base.
- `CentroSelector.astro`: selector de centro activo.
- `Calendario.astro`: calendario mensual interactivo.
- `SalaViewer.astro`: selector de sala, mapa y recursos.
- `RecursoModal.astro`: formulario de reserva.

`src/data/`
- Datos que no dependen del backend.
- `oficinas.ts`: estructura estatica de centros, salas y recursos.
- `mocks.ts`: fallback local de usuario, empleados y reservas.

`src/services/`
- Capa de acceso a datos y adaptacion con Bitrix24.
- `bitrix.ts`: servicio base para detectar contexto, inicializar `BX24` y ejecutar metodos REST.
- `bitrixMappers.ts`: conversion entre payloads Bitrix y tipos internos.
- `empleados.ts`: carga de usuario actual y empleados reales con fallback.
- `reservas.ts`: lectura y creacion de reservas reales, con fallback local.
- `salasReunion.ts`: helpers para resolver centro y sala activos.

`src/utils/`
- Logica de dominio reutilizable sin dependencia del transporte.
- `fechas.ts`: calendario y formatos.
- `permisos.ts`: reglas de edicion y reserva.
- `solapes.ts`: deteccion de conflictos horarios.

`src/types/`
- Tipos de dominio y tipos de integracion Bitrix.

`src/scripts/`
- Logica cliente que conecta toda la app. `app.ts` contiene el estado compartido y el flujo principal.

`src/styles/`
- Estilos globales del widget.

`src/layouts/`
- Layout base HTML del proyecto Astro.

## Deteccion de entorno Bitrix vs local

La deteccion sigue esta estrategia:

1. `src/services/bitrix.ts` comprueba si existe `window.BX24`.
2. Si existe, llama a `BX24.init()` y recupera:
   - `placementInfo`
   - `auth`
3. Si la inicializacion funciona, la app se considera embebida.
4. Si no existe `BX24` o la inicializacion falla, la app pasa a modo local.

Comportamiento resultante:

- Embebida + configuracion valida:
  - usuario real
  - empleados reales
  - reservas reales
  - guardado real
- Embebida + error parcial:
  - intenta seguir con fallback en lecturas
  - no oculta errores de guardado real
- Local:
  - usa mocks para no bloquear desarrollo

## Variables de entorno necesarias

La integracion real depende de estas variables publicas:

```env
PUBLIC_BITRIX_ENTITY_TYPE_ID=123
PUBLIC_BITRIX_FIELD_EMPLEADO_ASIGNADO=assignedById
PUBLIC_BITRIX_FIELD_CENTRO=ufCrmCenter
PUBLIC_BITRIX_FIELD_SALA=ufCrmSala
PUBLIC_BITRIX_FIELD_RECURSO=ufCrmRecurso
PUBLIC_BITRIX_FIELD_TIPO_RECURSO=ufCrmTipoRecurso
PUBLIC_BITRIX_FIELD_MODO_RESERVA=ufCrmModoReserva
PUBLIC_BITRIX_FIELD_FECHA=ufCrmFecha
PUBLIC_BITRIX_FIELD_HORA_INICIO=ufCrmHoraInicio
PUBLIC_BITRIX_FIELD_HORA_FIN=ufCrmHoraFin
PUBLIC_BITRIX_FIELD_ESTADO=ufCrmEstado
PUBLIC_BITRIX_FIELD_OBSERVACIONES=ufCrmObservaciones
```

### Significado

`PUBLIC_BITRIX_ENTITY_TYPE_ID`
- ID de la SPA de Bitrix24 donde se almacenan las reservas.

`PUBLIC_BITRIX_FIELD_EMPLEADO_ASIGNADO`
- Campo del empleado asignado. Por defecto usa `assignedById`.

`PUBLIC_BITRIX_FIELD_CENTRO`
- Campo custom donde se guarda el centro.

`PUBLIC_BITRIX_FIELD_SALA`
- Campo custom donde se guarda la sala.

`PUBLIC_BITRIX_FIELD_RECURSO`
- Campo custom donde se guarda el recurso.

`PUBLIC_BITRIX_FIELD_TIPO_RECURSO`
- Campo custom para `puesto` o `sala`.

`PUBLIC_BITRIX_FIELD_MODO_RESERVA`
- Campo custom para `individual` o `completa`.

`PUBLIC_BITRIX_FIELD_FECHA`
- Campo custom de fecha de reserva.

`PUBLIC_BITRIX_FIELD_HORA_INICIO`
- Campo custom de hora inicial.

`PUBLIC_BITRIX_FIELD_HORA_FIN`
- Campo custom de hora final.

`PUBLIC_BITRIX_FIELD_ESTADO`
- Campo custom del estado de reserva.

`PUBLIC_BITRIX_FIELD_OBSERVACIONES`
- Campo custom para notas libres.

## Mapeo entre Bitrix y tipos internos

El tipo interno de la app es `Reserva` en `src/types/reservas.ts`.

La conversion se hace en `src/services/bitrixMappers.ts`.

### Escritura hacia Bitrix

`src/services/reservas.ts` construye el payload con `mapReservaToBitrixFields()`:

- `title` -> titulo sintetico de apoyo
- `assignedById` o campo configurado -> `empleadoId`
- campo centro -> `centroId`
- campo sala -> `salaId`
- campo recurso -> `recursoId`
- campo tipo recurso -> `tipoRecurso`
- campo modo reserva -> `modoReserva`
- campo fecha -> `fecha`
- campo hora inicio -> `horaInicio`
- campo hora fin -> `horaFin`
- campo estado -> `estado`
- campo observaciones -> `observaciones`

### Lectura desde Bitrix

La lectura intenta soportar respuestas de Bitrix donde los campos pueden venir:

- en primer nivel del item
- en `fields`
- con diferente casing

El mapper normaliza:

- `id`
- empleado asignado
- centro
- sala
- recurso
- tipo
- modo
- fecha
- tramo horario
- estado
- observaciones

Si el nombre del empleado no viene en la reserva, se resuelve usando la lista de empleados cargada previamente.

## Servicios y responsabilidades

### `src/services/bitrix.ts`

Responsabilidades:

- detectar si `BX24` existe
- inicializar el SDK
- exponer contexto embebido
- centralizar llamadas REST
- registrar errores de integracion en consola

### `src/services/empleados.ts`

Responsabilidades:

- cargar usuario actual real con `user.current`
- cargar empleados reales con `user.get`
- mapear respuestas Bitrix a `UsuarioApp` y `EmpleadoOption`
- usar fallback mock cuando no hay contexto o la lectura falla

### `src/services/reservas.ts`

Responsabilidades:

- construir filtros de lectura por fecha, centro y sala
- leer items reales de la SPA con `crm.item.list`
- crear items reales con `crm.item.add`
- mapear entre payload Bitrix y `Reserva`
- ofrecer fallback local para desarrollo

### `src/services/bitrixMappers.ts`

Responsabilidades:

- aislar el conocimiento del shape de Bitrix
- evitar que `app.ts` conozca detalles de `crm.item.list` o `user.get`

## Estado compartido de frontend

El estado principal vive en `src/scripts/app.ts`. Se ha mantenido intencionadamente simple, sin introducir una libreria adicional.

El estado actual controla:

- centro seleccionado
- fecha seleccionada
- sala seleccionada
- recurso seleccionado
- apertura y cierre de modal
- usuario actual
- lista de empleados
- reservas del dia
- flags de carga y guardado
- origen de datos (`bitrix` o `mock`)
- mensajes simples de error

## Validaciones activas

Se mantienen las validaciones que ya existian:

- campos obligatorios
- hora fin mayor que hora inicio
- usuarios no admin no pueden reservar para otro empleado
- deteccion de solapes usando las reservas cargadas para la fecha

Los solapes siguen comprobando recurso + fecha + rango horario con `src/utils/solapes.ts`.

## Logs y manejo de errores

Se ha dejado un manejo de errores pragmatico:

- logs detallados en consola por capa:
  - `[bitrix:*]`
  - `[empleados:*]`
  - `[reservas:*]`
  - `[app:*]`
- mensajes simples en UI:
  - estado general del origen de datos
  - error de carga si no se pueden recuperar reservas
  - error de formulario o guardado en la modal

La idea es poder depurar la integracion real rapido sin complicar la interfaz.

## Como arrancar el proyecto

### Desarrollo local

1. Instala dependencias:

```bash
pnpm install
```

2. Arranca el servidor:

```bash
pnpm dev
```

3. Abre la app en local. En este modo usara mocks como fallback.

### Build

```bash
pnpm build
```

La build de Astro compila correctamente con el estado actual del proyecto.

### Check tipado

```bash
pnpm check
```

Ahora mismo este comando requiere instalar `@astrojs/check`.

## Como probar la integracion real en Bitrix24

1. Configura `PUBLIC_BITRIX_ENTITY_TYPE_ID` con el ID real de la SPA.
2. Configura los nombres reales de los campos custom de tu entidad.
3. Publica o sirve la app donde Bitrix24 pueda cargarla.
4. Abre la app desde el placement del menu izquierdo.
5. Verifica:
   - que detecta contexto embebido
   - que carga usuario real
   - que carga empleados reales
   - que lista reservas reales del dia
   - que al guardar crea un item nuevo en la SPA

## Limitaciones actuales

- La estructura de oficinas, salas y recursos sigue siendo estatica en codigo.
- La lectura de reservas filtra por fecha, centro y sala, pero aun se apoya en filtrado defensivo en cliente tras la respuesta.
- La UI todavia no representa detalle de cada reserva dentro del mapa mas alla de marcar recursos ocupados.
- No hay edicion ni cancelacion de reservas existentes.
- No se ha implementado todavia sincronizacion completa de permisos de Bitrix mas alla del usuario actual y `isAdmin`.
- No hay test automatizados.
- `pnpm check` no esta operativo hasta instalar `@astrojs/check`.

## Decisiones tecnicas tomadas y por que

### Estado compartido sin libreria adicional

Se mantiene todo en `src/scripts/app.ts` porque:

- el alcance actual es un solo widget
- evita introducir complejidad innecesaria
- permite iterar rapido mientras la integracion con Bitrix madura

### Bitrix como capa de servicios separada

Se ha aislado la integracion en servicios porque:

- reduce el acoplamiento del frontend con el shape real de Bitrix
- permite depurar mapeos sin tocar componentes
- facilita reemplazar fallback mock por real en puntos concretos

### Mocks solo como red de seguridad local

Se mantienen mocks porque:

- permiten seguir desarrollando fuera de Bitrix
- simplifican demo y maquetacion
- evitan bloquear el frontend cuando el contexto embebido no esta disponible

Pero la prioridad ya es usar datos reales siempre que sea posible.

### Mapeos explicitos por variables de entorno

No se hardcodean todos los nombres de campos porque cada portal puede tener nombres distintos en la SPA. Las variables publicas hacen la app portable entre entornos sin reescribir codigo.

## Siguientes pasos recomendados

1. Confirmar en el portal real los nombres exactos de los campos custom y validar que `crm.item.list` devuelve el shape esperado.
2. Añadir visualizacion detallada de reservas por recurso en el mapa.
3. Implementar edicion y cancelacion de reservas existentes.
4. Mejorar filtros server-side en Bitrix si el volumen de reservas crece.
5. Instalar `@astrojs/check` y dejar validacion estatica en CI.
6. Añadir tests unitarios para mapeos y solapes.
7. Valorar persistir configuracion de centros/salas fuera de codigo solo si el negocio realmente lo necesita.
