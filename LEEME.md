# 💍 Invitaciones de boda digitales (varios clientes)

Cada pareja recibe un enlace para **diseñar su invitación**: colores, fondo y textura, tipografía, decoración, forma de las fotos, portada, sus datos, sus fotos e imágenes de referencia en cada paso. La ven en vivo mientras la diseñan. Tú lo recibes todo en una sola hoja de Google, junto con sus invitados, confirmaciones y alertas.

## 📁 Archivos

| Archivo | Para qué sirve |
|---|---|
| `disenar.html` | Página donde el cliente diseña su invitación |
| `index.html` | La invitación que reciben los invitados |
| `opciones.js` | Catálogo de paletas, fondos, tipografías, decoraciones, marcos y portadas. Aquí agregas opciones nuevas. |
| `config.js` | Conexión con tu hoja, tu contacto y los datos de ejemplo |
| `apps-script/Codigo.gs` | Código para pegar en Google Sheets |

---

## Configuración inicial (una sola vez)

### 1. Publicar en GitHub Pages
1. En GitHub ve a **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**, tu rama y la carpeta `/ (root)`, y guarda.
3. Tendrás una dirección como `https://TU-USUARIO.github.io/invitaci-n-boda/`.

### 2. Crear la hoja central
1. Entra a [sheets.new](https://sheets.new) y ponle un nombre, por ejemplo *Invitaciones - Mi negocio*.
2. Ve a **Extensiones → Apps Script**, borra lo que aparezca, pega **todo** `apps-script/Codigo.gs` y guarda.
3. Elige la función `prepararHojas` y presiona **▶ Ejecutar**. Acepta los permisos: *Revisar permisos → tu cuenta → Configuración avanzada → Ir a… → Permitir*. Pide acceso a Sheets, a Drive (para guardar fotos y referencias) y a Gmail (para avisarte por correo).
4. Se crean las pestañas **Clientes, Invitados, Aperturas, Respuestas, Resumen y Configuración**, una carpeta en tu Drive llamada **Invitaciones de boda** y el menú **💍 Invitaciones**.

### 3. Conectar
1. En Apps Script: **Implementar → Nueva implementación → Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
2. Copia la URL que termina en `/exec` y pégala en `config.js`:
   ```js
   urlHojaDeCalculo: "https://script.google.com/macros/s/XXXX/exec",
   contactoNegocio: "WhatsApp 55 1234 5678",
   ```
3. En la pestaña **Configuración**:
   - `B1`: la dirección del Paso 1 (debe terminar en `/`)
   - `B2`: el mensaje de WhatsApp para invitados
   - `B3`: el mensaje de WhatsApp para clientes
   - `B4`: tu correo para recibir avisos

> Si cambias el código de Apps Script más adelante, usa **Implementar → Gestionar implementaciones → ✏️ → Versión nueva**, para que la URL no cambie.

---

## Uso diario

### 🆕 Nuevo cliente
En **Clientes** escribe el **nombre de la pareja** y su **WhatsApp**, con lada de país y sin espacios (ej. `5215512345678`). Se generan solos:
- **Código** del cliente
- **Enlace para diseñar**
- **📲 Enviar**: abre WhatsApp con el mensaje y el enlace ya listos
- **👁 Ver**: la invitación tal como va quedando

### 🎨 El cliente diseña
En su enlace, el cliente recorre 12 pasos y ve los cambios en vivo:

1. Sus datos: nombres, fecha y fecha límite para confirmar
2. Ceremonia y recepción
3. Fotos: sube 2 y elige la forma del marco (arco, círculo, rectángulo o polaroid)
4. Colores: 8 paletas o colores propios
5. Fondo y textura: liso, degradado, papel, lino, acuarela, mármol u hojas
6. Tipografía: clásica, romántica, moderna, minimalista o vintage
7. Decoración: eucalipto, flores, arcos dorados, líneas o sin adornos
8. Portada: sobre con sello, cortina o directo
9. Itinerario
10. Vestimenta y regalos
11. Mensaje final
12. ¿Algo más?

En **cada paso** puede escribir comentarios y **subir imágenes de referencia**. Todo se guarda solo. Al terminar pulsa **Enviar mi diseño**.

### 📩 Tú recibes
- Un **correo** con el resumen de lo que eligió y sus comentarios.
- Su estado cambia a **📩 Enviado** en la hoja Clientes.
- Fotos y referencias quedan en **Drive → Invitaciones de boda → Pareja (código)**, nombradas por paso.
- La invitación **ya tiene aplicado su diseño**. Solo ajustas a mano lo que pidieron con imágenes de referencia.

### ✅ Aprobar
Cambia el estado a **✅ Aprobado**. Desde ese momento el cliente ya no puede modificar su diseño; si necesita un cambio, te escribe. Para que pueda volver a editar, regrésalo a **✏️ Diseñando**.

### 👥 Invitados
En **Invitados** elige el **Cliente** (lista desplegable) y escribe **Nombre, Pases y Teléfono**. El código y el enlace se generan solos, y **📲 Enviar** abre WhatsApp. Cada invitado ve la invitación con el diseño de su pareja.

Usa los filtros de la hoja para ver los invitados de una sola pareja. La pestaña **Resumen** muestra los totales por cliente.

---

## 🚨 Alertas de invitados

| Alerta | Qué pasó |
|---|---|
| 🟠 **Compartida**: se abrió en N dispositivos | El invitado reenvió su enlace. Se muestra en qué equipos se abrió. |
| 🔴 **Confirmó otra persona** | El nombre escrito no coincide con el del invitado. |
| 🔴 **Pidió N lugares (tenía M)** | Pusieron más asistentes de los asignados. |
| 🟠 **Respondieron N veces** | Hubo varias confirmaciones con el mismo enlace, y se muestra quiénes. |
| 🟠 **Confirmado desde otro dispositivo** | Quien confirmó no es quien abrió la invitación primero. |
| 🔴 **Sin invitación válida** | Alguien cambió o borró el código. Solo aparece en la pestaña **Respuestas**. |

**Límite:** se sabe de quién era el enlace y qué nombre escribió quien confirmó. Si alguien solo la abre y no confirma, no se sabe quién fue.

## ⚙️ Opciones

- **Más pases de los asignados**: en `config.js` pon `modoPasesExtra: "avisar"` (lo permite y te avisa) o `"bloquear"` (no lo permite).
- **Agregar paletas o tipografías**: en `opciones.js`. Copia una línea existente y cambia los valores.
- **Excel**: en la hoja ve a **Archivo → Descargar → Microsoft Excel (.xlsx)**.

## 👀 Modo demostración
Mientras `urlHojaDeCalculo` esté vacío, todo funciona en modo demostración y se guarda solo en ese navegador:
- `disenar.html` muestra el diseñador.
- `index.html` muestra la invitación con lo último que se diseñó.
