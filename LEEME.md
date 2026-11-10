# 💍 Invitación de boda digital

Invitación web con la paleta **Colores tendencia**: blanco natural, beige arena, verde salvia, rosa empolvado, terracota, moca y dorado suave. Se conecta a una hoja de Google Sheets, donde cada invitado tiene su enlace personal y su confirmación.

## 📁 Archivos

| Archivo | Para qué sirve |
|---|---|
| `config.js` | **Aquí cambias todos los datos**: nombres, fechas, lugares, frases, regalos, etc. |
| `img/foto1.jpg` | Foto 1 (marco en arco, vertical) |
| `img/foto2.jpg` | Foto 2 (marco circular, cuadrada) |
| `apps-script/Codigo.gs` | Código para pegar en Google Sheets |
| `index.html`, `styles.css`, `app.js` | La invitación (no hace falta tocarlos) |

---

## Paso 1 · Cambiar los datos

Abre `config.js` y reemplaza los textos de ejemplo. Para las fotos, sube tus imágenes a la carpeta `img/` con los nombres `foto1.jpg` y `foto2.jpg`. Mientras no estén, se ve un espacio reservado.

## Paso 2 · Publicar la invitación (gratis con GitHub Pages)

1. En GitHub, entra al repositorio y ve a **Settings → Pages**.
2. En **Source**, elige *Deploy from a branch*. Selecciona la rama `main` (o la rama donde esté la invitación) y la carpeta `/ (root)`.
3. Guarda. En uno o dos minutos tendrás una dirección como
   `https://TU-USUARIO.github.io/invitaci-n-boda/`

## Paso 3 · Crear la hoja de invitados

1. Entra a [sheets.new](https://sheets.new) para crear una hoja nueva y ponle un nombre, por ejemplo *Invitados Boda*.
2. Menú **Extensiones → Apps Script**.
3. Borra lo que aparezca y pega **todo** el contenido de `apps-script/Codigo.gs`. Guarda (💾).
4. Arriba, elige la función `prepararHojas` y presiona **▶ Ejecutar**. Acepta los permisos: *Revisar permisos → tu cuenta → Configuración avanzada → Ir a (proyecto) → Permitir*.
5. Vuelve a la hoja. Ya tendrás las pestañas **Invitados, Aperturas, Respuestas, Configuración y Resumen**, y un menú nuevo **💍 Invitación**.

## Paso 4 · Conectar la hoja con la invitación

1. En Apps Script: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
3. **Implementar** y copia la URL. Termina en `/exec`.
4. Pega esa URL en `config.js`:
   ```js
   urlHojaDeCalculo: "https://script.google.com/macros/s/XXXX/exec",
   ```
5. En la pestaña **Configuración** de la hoja, pon en `B1` la dirección de tu invitación del Paso 2.

> Si más adelante cambias el código de Apps Script, usa **Implementar → Gestionar implementaciones → ✏️ → Versión: nueva**. Así la URL no cambia.

## Paso 5 · Agregar invitados y enviar

En la pestaña **Invitados** solo llenas tres columnas:

| Nombre del invitado | Pases | Teléfono |
|---|---|---|
| Familia Pérez | 4 | 5215512345678 |

- Al escribir el nombre se crean solos el **código** y el **enlace personal**. Si no aparecen, usa el menú **💍 Invitación → Generar códigos y enlaces**.
- Escribe el teléfono **con lada de país**, sin espacios: México `52` + `1` + 10 dígitos en celulares, o `52` + 10 dígitos.
- Haz clic en **📲 Enviar** y se abre WhatsApp con el mensaje y el enlace ya escritos. Puedes cambiar el mensaje en **Configuración → B2**.

Para descargarla como Excel: **Archivo → Descargar → Microsoft Excel (.xlsx)**.

---

## 🚨 Qué significan las alertas

Aparecen en la columna **⚠️ Alertas** y la fila se pinta de rosa.

| Alerta | Qué pasó |
|---|---|
| 🟠 **Compartida**: se abrió en *N* dispositivos | El invitado de esa fila reenvió su enlace. Se muestra en qué equipos se abrió (iPhone · WhatsApp, Android · Chrome…). |
| 🔴 **Confirmó otra persona** | El nombre escrito en "¿Quién confirma?" no coincide con el del invitado. Por ejemplo, *"Carlos Ruiz" usó la invitación de Ana López*. |
| 🔴 **Pidió N lugares (tenía M)** | Pusieron más asistentes de los pases asignados. |
| 🟠 **Respondieron N veces** | Se confirmó más de una vez con el mismo enlace, y se muestra quiénes. |
| 🟠 **Confirmado desde otro dispositivo** | La persona que confirmó no es la que abrió la invitación primero. |
| 🔴 **Confirmó sin una invitación válida** | Alguien borró o cambió el código del enlace. Esto solo aparece en la pestaña **Respuestas**. |

- **Aperturas**: historial de cada vez que se abrió una invitación, con fecha, equipo y si fue un dispositivo nuevo.
- **Respuestas**: todas las confirmaciones, incluidas las repetidas, con sus alertas.
- **Resumen**: totales de lugares asignados, personas que asisten, pendientes e invitaciones con alertas.

**Límite:** se sabe **de quién era el enlace** que se compartió y **el nombre que escribió** quien confirmó. Si alguien solo la abre y no confirma, se ve que se abrió en otro dispositivo, pero no el nombre de esa persona.

## ⚙️ Más pases de los asignados

En `config.js`:
```js
modoPasesExtra: "avisar"    // lo permite y te avisa en la hoja (recomendado)
modoPasesExtra: "bloquear"  // no deja elegir más de sus pases
```

## 🎵 Música (opcional)

Sube un mp3, por ejemplo `musica/cancion.mp3`, y ponlo en `config.js`: `musica: "musica/cancion.mp3"`. Empieza a sonar al abrir el sobre.

## 👀 Probar

Sin la hoja conectada, la invitación funciona en **modo demostración**. Abre `index.html?i=DEMO` para ver cómo la recibe un invitado con 4 pases.
