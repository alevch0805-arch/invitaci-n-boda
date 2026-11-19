/**
 * INVITACIONES DE BODA · Hoja central (varios clientes)
 * -----------------------------------------------------
 * Pega este código en Google Sheets > Extensiones > Apps Script.
 * Sigue los pasos de LEEME.md.
 */

var HOJA_CLI = "Clientes";
var HOJA_INV = "Invitados";
var HOJA_APE = "Aperturas";
var HOJA_RES = "Respuestas";
var HOJA_CFG = "Configuración";
var HOJA_RESUMEN = "Resumen";
var CARPETA_RAIZ = "Invitaciones de boda";

// Columnas de "Clientes"
var CC = { codigo: 1, pareja: 2, contacto: 3, estado: 4, disenar: 5, enviar: 6, ver: 7, carpeta: 8, actualizado: 9, notas: 10, diseno: 11, datos: 12, admin: 13,
  correo: 14, clavePanel: 15, panel: 16, enviarPanel: 17, waNovia: 18, waNovio: 19, panelNovia: 20, panelNovio: 21 };
var ENC_CLI = ["Código", "Pareja", "WhatsApp del cliente", "Estado del diseño", "Enlace para diseñar", "Enviar al cliente",
  "Ver invitación", "Carpeta (fotos y referencias)", "Última actualización", "Notas", "Diseño (no editar)", "Datos (no editar)", "⭐ Editar como admin",
  "Correo de la pareja", "Clave del panel (no compartir)", "📱 Panel de la pareja", "Enviar panel",
  "WhatsApp de la novia", "WhatsApp del novio", "📲 Panel a la novia", "📲 Panel al novio"];
var ESTADOS = ["✏️ Diseñando", "📩 Enviado", "✅ Aprobado"];

// Columnas de "Invitados"
var COL = {
  cliente: 1, codigo: 2, nombre: 3, pases: 4, telefono: 5, enlace: 6, whatsapp: 7,
  estado: 8, asistiran: 9, quien: 10, acompanantes: 11, mensaje: 12,
  dispositivos: 13, aperturas: 14, alertas: 15, ultima: 16, extra: 17, solicitud: 18, enviada: 19, envia: 20, enviadaPor: 21
};
var QUIEN_ENVIA = ["Novia", "Novio", "Cualquiera"];
var ENC_INV = ["Cliente", "Código", "Nombre del invitado", "Pases", "Teléfono (con lada país)", "Enlace personal",
  "Enviar", "Estado", "Asistirán", "Quién confirmó", "Acompañantes", "Mensaje", "Dispositivos",
  "Veces abierta", "⚠️ Alertas", "Última actividad", "Lugares extra pedidos", "Solicitud de pases", "Enviada", "La envía", "Enviada por"];

// Aperturas: Fecha | Cliente | Código | Invitación de | Dispositivo | Equipo | ¿Nuevo?
// Respuestas: Fecha | Cliente | Código | Invitación de | Pases | Quién | Asiste | Cantidad | Acompañantes | Mensaje | Dispositivo | Equipo | Alertas

var COLORES = { moca: "#7A5040", blanco: "#F5F1EA", salvia: "#E3E8DA" };

/* ================= MENÚ ================= */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("💍 Invitaciones")
    .addItem("1. Preparar hojas (solo la primera vez)", "prepararHojas")
    .addItem("Generar códigos y enlaces", "generarTodo")
    .addItem("Recalcular alertas", "recalcularTodo")
    .addItem("Activar resumen diario por correo", "activarResumenDiario")
    .addItem("Enviar resumen diario ahora (prueba)", "resumenDiario")
    .addToUi();
}

/* Al escribir un cliente o invitado nuevo se generan sus códigos y enlaces */
function onEdit(e) {
  try {
    var h = e.range.getSheet(), n = h.getName();
    if (e.range.getRow() < 2) return;
    if (n === HOJA_CLI && e.range.getColumn() <= CC.pareja) generarClientes(true);
    if (n === HOJA_INV && e.range.getColumn() <= COL.pases) generarEnlaces(true);
  } catch (err) {}
}

/* ================= PREPARAR HOJAS ================= */
function prepararHojas() {
  var ss = SpreadsheetApp.getActive();

  // Configuración
  var cfg = obtenerHoja(ss, HOJA_CFG);
  if (!cfg.getRange("B1").getValue()) {
    cfg.getRange("A1:B5").setValues([
      ["URL de la invitación (termina en /)", "https://TU-USUARIO.github.io/invitaci-n-boda/"],
      ["Mensaje de WhatsApp para invitados", "¡Hola {nombre}! 💌 {pareja} te comparten con mucha ilusión su invitación de boda. Hemos reservado {pases} lugar(es) para ti. Ábrela aquí: {enlace}"],
      ["Mensaje de WhatsApp para clientes", "¡Hola {pareja}! ✨ Aquí puedes diseñar su invitación: elijan colores, fondo, letras, suban sus fotos y referencias. Todo se guarda solo: {enlace}"],
      ["Correo para avisos", Session.getEffectiveUser().getEmail()],
      ["Puedes usar en los mensajes:", "{nombre}  {pases}  {enlace}  {pareja}"]
    ]);
  }
  cfg.getRange("A1:A5").setFontWeight("bold").setFontColor(COLORES.moca);
  cfg.setColumnWidth(1, 260); cfg.setColumnWidth(2, 640);
  cfg.getRange("B2:B3").setWrap(true);

  // Clientes
  var cli = obtenerHoja(ss, HOJA_CLI);
  cli.getRange(1, 1, 1, ENC_CLI.length).setValues([ENC_CLI]);
  estiloEncabezado(cli, ENC_CLI.length);
  cli.setFrozenRows(1); cli.setFrozenColumns(2);
  [80, 200, 150, 130, 300, 130, 90, 150, 150, 220, 90, 90, 140].forEach(function (w, i) { cli.setColumnWidth(i + 1, w); });
  cli.getRange(2, CC.pareja, cli.getMaxRows() - 1, 2).setBackground("#FFFDF8");
  cli.getRange(2, CC.contacto, cli.getMaxRows() - 1, 1).setNumberFormat("@");
  cli.getRange(2, CC.estado, cli.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).build());
  cli.getRange(2, CC.diseno, cli.getMaxRows() - 1, 2).setFontColor("#B0A49C").setWrap(false);
  cli.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("Enviado").setBackground("#FCEFD9").setRanges([cli.getRange("D2:D")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("Aprobado").setBackground(COLORES.salvia).setRanges([cli.getRange("D2:D")]).build()
  ]);
  if (cli.getLastRow() < 2) cli.getRange(2, CC.pareja, 1, 2).setValues([["Laura & Carlos", "5215500000000"]]);

  // Invitados
  var inv = obtenerHoja(ss, HOJA_INV);
  inv.getRange(1, 1, 1, ENC_INV.length).setValues([ENC_INV]);
  estiloEncabezado(inv, ENC_INV.length);
  inv.setFrozenRows(1); inv.setFrozenColumns(3);
  [80, 70, 200, 60, 150, 260, 90, 120, 80, 160, 220, 220, 95, 95, 340, 150].forEach(function (w, i) { inv.setColumnWidth(i + 1, w); });
  inv.getRange(2, COL.alertas, inv.getMaxRows() - 1, 1).setWrap(true).setFontColor("#9B2C1C");
  inv.getRange(2, 1, inv.getMaxRows() - 1, 1).setBackground("#FFFDF8");
  inv.getRange(2, COL.nombre, inv.getMaxRows() - 1, 3).setBackground("#FFFDF8");
  inv.getRange(2, COL.telefono, inv.getMaxRows() - 1, 1).setNumberFormat("@");
  inv.getRange(2, COL.cliente, inv.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(cli.getRange("A2:A"), true).setAllowInvalid(false).build());
  inv.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$O2<>""').setBackground("#FBE3DC").setRanges([inv.getRange("A2:P")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("Asistirá").setBackground(COLORES.salvia).setRanges([inv.getRange("H2:H")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("No asistirá").setBackground("#E9E2DD").setRanges([inv.getRange("H2:H")]).build()
  ]);

  // Aperturas
  var ape = obtenerHoja(ss, HOJA_APE);
  var encA = ["Fecha", "Cliente", "Código", "Invitación de", "Dispositivo", "Equipo", "¿Dispositivo nuevo?"];
  ape.getRange(1, 1, 1, encA.length).setValues([encA]); estiloEncabezado(ape, encA.length); ape.setFrozenRows(1);
  [150, 80, 70, 200, 110, 160, 160].forEach(function (w, i) { ape.setColumnWidth(i + 1, w); });

  // Respuestas
  var res = obtenerHoja(ss, HOJA_RES);
  var encR = ["Fecha", "Cliente", "Código", "Invitación de", "Pases asignados", "Quién confirmó", "Asiste", "Cantidad",
    "Acompañantes", "Mensaje", "Dispositivo", "Equipo", "⚠️ Alertas"];
  res.getRange(1, 1, 1, encR.length).setValues([encR]); estiloEncabezado(res, encR.length); res.setFrozenRows(1);
  [150, 80, 70, 200, 80, 180, 70, 80, 220, 220, 110, 160, 340].forEach(function (w, i) { res.setColumnWidth(i + 1, w); });
  res.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$M2<>""')
    .setBackground("#FBE3DC").setRanges([res.getRange("A2:M")]).build()]);

  // Resumen por cliente
  var rsm = obtenerHoja(ss, HOJA_RESUMEN);
  rsm.clear();
  rsm.getRange("A1:I1").setValues([["Cliente", "Pareja", "Invitaciones", "Lugares asignados", "Personas que asistirán",
    "Confirmaron (sí)", "No asistirán", "Pendientes", "Con alertas"]]);
  estiloEncabezado(rsm, 9);
  rsm.getRange("A2").setFormula('=IFERROR(FILTER(Clientes!A2:B, Clientes!A2:A<>""),"")');
  rsm.getRange("C2").setFormula('=ARRAYFORMULA(IF(A2:A="","",COUNTIF(Invitados!A2:A,A2:A)))');
  rsm.getRange("D2").setFormula('=ARRAYFORMULA(IF(A2:A="","",SUMIF(Invitados!A2:A,A2:A,Invitados!D2:D)))');
  rsm.getRange("E2").setFormula('=ARRAYFORMULA(IF(A2:A="","",SUMIF(Invitados!A2:A,A2:A,Invitados!I2:I)))');
  rsm.getRange("F2").setFormula('=ARRAYFORMULA(IF(A2:A="","",COUNTIFS(Invitados!A2:A,A2:A,Invitados!H2:H,"✅ Asistirá")))');
  rsm.getRange("G2").setFormula('=ARRAYFORMULA(IF(A2:A="","",COUNTIFS(Invitados!A2:A,A2:A,Invitados!H2:H,"❌ No asistirá")))');
  rsm.getRange("H2").setFormula('=ARRAYFORMULA(IF(A2:A="","",C2:C-F2:F-G2:G))');
  rsm.getRange("I2").setFormula('=ARRAYFORMULA(IF(A2:A="","",COUNTIFS(Invitados!A2:A,A2:A,Invitados!O2:O,"?*")))');
  rsm.setFrozenRows(1);
  [80, 200, 110, 130, 160, 130, 110, 110, 110].forEach(function (w, i) { rsm.setColumnWidth(i + 1, w); });

  carpetaRaiz();
  ss.setActiveSheet(cli);
  generarTodo(true);
  ss.toast("Listo. Agrega a tus clientes en la hoja 'Clientes'.", "💍", 6);
}

/* ================= CÓDIGOS Y ENLACES ================= */
function generarTodo(silencioso) { asegurarClave(); asegurarEncabezados(); activarResumenDiario(true); generarClientes(true); generarEnlaces(true); if (silencioso !== true) SpreadsheetApp.getActive().toast("Códigos y enlaces generados.", "💍", 4); }

function generarClientes(silencioso) {
  var cli = SpreadsheetApp.getActive().getSheetByName(HOJA_CLI);
  if (!cli || cli.getLastRow() < 2) return;
  var n = cli.getLastRow() - 1, datos = cli.getRange(2, 1, n, 4).getValues(), usados = {};
  datos.forEach(function (f) { if (f[0]) usados[String(f[0]).toUpperCase()] = true; });
  var cfg = "'" + HOJA_CFG + "'!";
  for (var i = 0; i < n; i++) {
    var fila = i + 2;
    if (!String(datos[i][1]).trim()) continue;
    if (!String(datos[i][0]).trim()) {
      var c = nuevoCodigo(usados, 6); usados[c] = true;
      cli.getRange(fila, CC.codigo).setValue(c);
    }
    if (!datos[i][3]) cli.getRange(fila, CC.estado).setValue(ESTADOS[0]);
    cli.getRange(fila, CC.disenar).setFormula('=IF(A' + fila + '="","",' + cfg + '$B$1&"disenar.html?c="&A' + fila + ')');
    cli.getRange(fila, CC.enviar).setFormula('=IF(A' + fila + '="","",HYPERLINK("https://wa.me/"&REGEXREPLACE(TO_TEXT(C' + fila + '),"\\D","")&"?text="&ENCODEURL(' +
      'SUBSTITUTE(SUBSTITUTE(' + cfg + '$B$3,"{pareja}",B' + fila + '),"{enlace}",E' + fila + ')),"📲 Enviar"))');
    cli.getRange(fila, CC.ver).setFormula('=IF(A' + fila + '="","",HYPERLINK(' + cfg + '$B$1&"?c="&A' + fila + ',"👁 Ver"))');
    cli.getRange(fila, CC.admin).setFormula('=IF(OR(A' + fila + '="",' + cfg + '$B$6=""),"",HYPERLINK(' + cfg + '$B$1&"disenar.html?c="&A' + fila +
      '&"&admin="&' + cfg + '$B$6,"⭐ Editar"))');
    if (!String(cli.getRange(fila, CC.clavePanel).getValue()).trim()) cli.getRange(fila, CC.clavePanel).setValue(claveAleatoria(12));
    var urlPanel = cfg + '$B$1&"panel.html?c="&A' + fila + '&"&k="&O' + fila;
    cli.getRange(fila, CC.panel).setFormula('=IF(OR(A' + fila + '="",O' + fila + '=""),"",HYPERLINK(' + urlPanel + ',"📱 Abrir panel"))');
    [[CC.panelNovia, "R", "novia", "📲 A la novia"], [CC.panelNovio, "S", "novio", "📲 Al novio"]].forEach(function (x) {
      var url = cfg + '$B$1&"panel.html?c="&A' + fila + '&"&k="&O' + fila + '&"&soy=' + x[2] + '"';
      cli.getRange(fila, x[0]).setFormula('=IF(OR(A' + fila + '="",O' + fila + '="",' + x[1] + fila + '=""),"",HYPERLINK("https://wa.me/"&REGEXREPLACE(TO_TEXT(' + x[1] + fila +
        '),"\\D","")&"?text="&ENCODEURL(SUBSTITUTE(SUBSTITUTE(' + cfg + '$B$7,"{pareja}",B' + fila + '),"{enlace}",' + url + ')),"' + x[3] + '"))');
    });
    cli.getRange(fila, CC.enviarPanel).setFormula('=IF(OR(A' + fila + '="",O' + fila + '=""),"",HYPERLINK("https://wa.me/"&REGEXREPLACE(TO_TEXT(C' + fila +
      '),"\\D","")&"?text="&ENCODEURL(SUBSTITUTE(SUBSTITUTE(' + cfg + '$B$7,"{pareja}",B' + fila + '),"{enlace}",' + urlPanel + ')),"📲 Enviar panel"))');
  }
}

function claveAleatoria(n) {
  var letras = "abcdefghijkmnpqrstuvwxyz23456789", k = "";
  for (var i = 0; i < n; i++) k += letras.charAt(Math.floor(Math.random() * letras.length));
  return k;
}

/* Pone los encabezados nuevos en hojas que ya existían (se puede correr muchas veces) */
function asegurarEncabezados() {
  var ss = SpreadsheetApp.getActive();
  var cli = ss.getSheetByName(HOJA_CLI), inv = ss.getSheetByName(HOJA_INV), cfg = ss.getSheetByName(HOJA_CFG);
  cli.getRange(1, 1, 1, ENC_CLI.length).setValues([ENC_CLI]); estiloEncabezado(cli, ENC_CLI.length);
  [[CC.admin, 120], [CC.correo, 200], [CC.clavePanel, 110], [CC.panel, 130], [CC.enviarPanel, 120],
    [CC.waNovia, 150], [CC.waNovio, 150], [CC.panelNovia, 130], [CC.panelNovio, 130]].forEach(function (w) { cli.setColumnWidth(w[0], w[1]); });
  cli.getRange(2, CC.waNovia, cli.getMaxRows() - 1, 2).setNumberFormat("@").setBackground("#FFFDF8");
  cli.getRange(2, CC.clavePanel, cli.getMaxRows() - 1, 1).setFontColor("#B0A49C");
  inv.getRange(1, 1, 1, ENC_INV.length).setValues([ENC_INV]); estiloEncabezado(inv, ENC_INV.length);
  [[COL.extra, 110], [COL.solicitud, 140], [COL.enviada, 140], [COL.envia, 110], [COL.enviadaPor, 110]].forEach(function (w) { inv.setColumnWidth(w[0], w[1]); });
  inv.getRange(2, COL.envia, inv.getMaxRows() - 1, 1).setBackground("#FFFDF8")
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(QUIEN_ENVIA, true).setAllowInvalid(false).build());
  inv.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$O2<>""').setBackground("#FBE3DC").setRanges([inv.getRange("A2:S")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("Asistirá").setBackground(COLORES.salvia).setRanges([inv.getRange("H2:H")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("No asistirá").setBackground("#E9E2DD").setRanges([inv.getRange("H2:H")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("Pendiente").setBackground("#FCEFC7").setRanges([inv.getRange("R2:R")]).build()
  ]);
  if (!cfg.getRange("A7").getValue()) {
    cfg.getRange("A7:B7").setValues([["Mensaje de WhatsApp para el panel",
      "¡Hola {pareja}! 📱 Este es su panel para enviar sus invitaciones desde su celular, ver quién confirma y aprobar lugares extra. Guárdenlo, es privado: {enlace}"]]);
    cfg.getRange("A7").setFontWeight("bold").setFontColor(COLORES.moca); cfg.getRange("B7").setWrap(true);
  }
}

/* ================= ADMINISTRADOR ================= */
// La clave vive SOLO en Configuración!B6 (nunca en el código, que es público)
function asegurarClave() {
  var cfg = SpreadsheetApp.getActive().getSheetByName(HOJA_CFG);
  if (!cfg.getRange("A6").getValue()) cfg.getRange("A6").setValue("Clave de administrador").setFontWeight("bold").setFontColor(COLORES.moca);
  if (!String(cfg.getRange("B6").getValue()).trim()) {
    var letras = "abcdefghijkmnpqrstuvwxyz23456789", k = "";
    for (var i = 0; i < 16; i++) k += letras.charAt(Math.floor(Math.random() * letras.length));
    cfg.getRange("B6").setValue(k);
  }
}
function esAdmin(clave) {
  var k = String(SpreadsheetApp.getActive().getSheetByName(HOJA_CFG).getRange("B6").getValue() || "").trim();
  return !!(k && k.length >= 8 && String(clave || "").trim() === k);
}

function generarEnlaces(silencioso) {
  var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  if (!inv || inv.getLastRow() < 2) return;
  var n = inv.getLastRow() - 1, datos = inv.getRange(2, 1, n, 4).getValues(), usados = {};
  datos.forEach(function (f) { if (f[1]) usados[String(f[1]).toUpperCase()] = true; });
  var cfg = "'" + HOJA_CFG + "'!";
  for (var i = 0; i < n; i++) {
    var fila = i + 2;
    if (!String(datos[i][2]).trim()) continue;
    if (!String(datos[i][1]).trim()) {
      var c = nuevoCodigo(usados, 5); usados[c] = true;
      inv.getRange(fila, COL.codigo).setValue(c);
    }
    if (!datos[i][3]) inv.getRange(fila, COL.pases).setValue(1);
    formulasInvitado(inv, fila);
    if (!inv.getRange(fila, COL.estado).getValue()) inv.getRange(fila, COL.estado).setValue("⏳ Sin abrir");
  }
}

function formulasInvitado(inv, fila) {
  var cfg = "'" + HOJA_CFG + "'!";
  inv.getRange(fila, COL.enlace).setFormula('=IF(B' + fila + '="","",' + cfg + '$B$1&"?i="&B' + fila + ')');
  inv.getRange(fila, COL.whatsapp).setFormula(
    '=IF(B' + fila + '="","",HYPERLINK("https://wa.me/"&REGEXREPLACE(TO_TEXT(E' + fila + '),"\\D","")&"?text="&ENCODEURL(' +
    'SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(' + cfg + '$B$2,"{nombre}",C' + fila + '),"{pases}",D' + fila + '),"{enlace}",F' + fila +
    '),"{pareja}",IFERROR(VLOOKUP(A' + fila + ',Clientes!A:B,2,FALSE),""))),"📲 Enviar"))');
}

function nuevoCodigo(usados, largo) {
  var letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", c;
  do { c = ""; for (var i = 0; i < largo; i++) c += letras.charAt(Math.floor(Math.random() * letras.length)); } while (usados[c]);
  return c;
}

/* ================= WEB APP ================= */
// GET (JSONP): invitación y diseñador leen datos / registran aperturas y confirmaciones
function doGet(e) {
  var p = (e && e.parameter) || {};
  var r = conBloqueo(function () {
    if (p.accion === "abrir") return registrarApertura(p);
    if (p.accion === "confirmar") return registrarRespuesta(p);
    if (p.accion === "cliente") return leerCliente(p.cl || p.c, p.admin); // "c" está reservado por Google
    if (p.accion === "fuente") return servirFuente(p.id);
    if (p.accion === "panel") return leerPanel(p);
    return { ok: true, mensaje: "La hoja de invitaciones está conectada correctamente 💍" };
  });
  var json = JSON.stringify(r);
  var cb = String(p.callback || "").replace(/[^\w$]/g, "");
  if (cb) return ContentService.createTextOutput(cb + "(" + json + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// POST: el diseñador guarda el diseño y sube imágenes
function doPost(e) {
  var r;
  try {
    var p = JSON.parse(e.postData.contents);
    if (p.accion === "subir") r = subirImagen(p); // sin bloqueo: puede tardar
    else if (p.accion === "guardar") r = conBloqueo(function () { return guardarDiseno(p); });
    else if (/^panel/.test(p.accion)) r = conBloqueo(function () { return accionPanel(p); });
    else r = { ok: false, error: "Acción desconocida" };
  } catch (err) { r = { ok: false, error: String(err) }; }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}

function conBloqueo(fn) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); return fn(); }
  catch (err) { return { ok: false, error: String(err) }; }
  finally { try { lock.releaseLock(); } catch (x) {} }
}

/* ================= CLIENTES ================= */
function buscarCliente(codigo) {
  codigo = String(codigo || "").trim().toUpperCase();
  if (!codigo) return null;
  var cli = SpreadsheetApp.getActive().getSheetByName(HOJA_CLI);
  var n = cli.getLastRow() - 1;
  if (n < 1) return null;
  var filas = cli.getRange(2, 1, n, CC.enviarPanel).getValues();
  for (var i = 0; i < n; i++) {
    if (String(filas[i][0]).trim().toUpperCase() === codigo) {
      var f = filas[i];
      return {
        fila: i + 2, codigo: codigo, pareja: String(f[CC.pareja - 1]), estado: String(f[CC.estado - 1] || ESTADOS[0]),
        carpeta: String(f[CC.carpeta - 1] || ""), diseno: parsear(f[CC.diseno - 1]), datos: parsear(f[CC.datos - 1]),
        contacto: String(f[CC.contacto - 1] || ""), correo: String(f[CC.correo - 1] || "").trim(), clavePanel: String(f[CC.clavePanel - 1] || "").trim()
      };
    }
  }
  return null;
}
function parsear(v) { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } }

function leerCliente(codigo, clave) {
  var c = buscarCliente(codigo);
  if (!c) return { ok: false, error: "Cliente no encontrado" };
  return { ok: true, codigo: c.codigo, pareja: c.pareja, estado: c.estado, diseno: c.diseno, datos: c.datos, datosGuardados: !!c.datos,
    admin: clave ? esAdmin(clave) : false };
}

function guardarDiseno(p) {
  var c = buscarCliente(p.c);
  if (!c) return { ok: false, error: "Cliente no encontrado" };
  var admin = esAdmin(p.admin);
  if (!admin && c.estado.indexOf("Aprobado") !== -1) return { ok: false, error: "El diseño ya fue aprobado", estado: c.estado };
  var cli = SpreadsheetApp.getActive().getSheetByName(HOJA_CLI);
  p.diseno = p.diseno || {};
  // Los ajustes especiales solo los cambia el administrador
  if (!admin) { if (c.diseno && c.diseno.especial) p.diseno.especial = c.diseno.especial; else delete p.diseno.especial; }
  if (admin) p.enviar = false;
  var dis = JSON.stringify(p.diseno), dat = JSON.stringify(p.datos || {});
  if (dis.length > 45000 || dat.length > 45000) return { ok: false, error: "Diseño demasiado grande" };
  cli.getRange(c.fila, CC.diseno, 1, 2).setValues([[dis, dat]]);
  cli.getRange(c.fila, CC.actualizado).setValue(new Date());
  var estado = c.estado;
  if (p.enviar) {
    estado = ESTADOS[1];
    cli.getRange(c.fila, CC.estado).setValue(estado);
    avisarPorCorreo(c, p);
  }
  return { ok: true, estado: estado };
}

function avisarPorCorreo(c, p) {
  try {
    var correo = SpreadsheetApp.getActive().getSheetByName(HOJA_CFG).getRange("B4").getValue();
    if (!correo) return;
    var d = p.datos || {}, z = p.diseno || {}, refs = z.referencias || {}, lineas = [];
    Object.keys(refs).forEach(function (k) {
      var r = refs[k];
      if (r && (r.comentario || (r.imagenes && r.imagenes.length)))
        lineas.push("• " + k + ": " + (r.comentario || "") + (r.imagenes && r.imagenes.length ? " (" + r.imagenes.length + " imagen(es))" : ""));
    });
    var base = SpreadsheetApp.getActive().getSheetByName(HOJA_CFG).getRange("B1").getValue();
    MailApp.sendEmail(correo, "💌 " + c.pareja + " enviaron su diseño de invitación",
      c.pareja + " enviaron su diseño.\n\n" +
      "Boda: " + (d.novia || "") + " & " + (d.novio || "") + " · " + (d.fecha || "") + "\n" +
      "Paleta: " + (z.colores ? "personalizada" : z.paleta) + " · Fondo: " + z.fondo + " · Tipografía: " + z.tipografia +
      " · Decoración: " + z.decoracion + " · Portada: " + z.portada + "\n\n" +
      (lineas.length ? "Referencias y comentarios:\n" + lineas.join("\n") + "\n\n" : "") +
      "Ver invitación: " + base + "?c=" + c.codigo + "\n" +
      (c.carpeta ? "Carpeta: " + c.carpeta + "\n" : "") +
      "\nPara aprobarlo, cambia el estado a ✅ Aprobado en la hoja Clientes.");
  } catch (e) {}
}

/* ================= DRIVE ================= */
function carpetaRaiz() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty("CARPETA_RAIZ");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = DriveApp.createFolder(CARPETA_RAIZ);
  props.setProperty("CARPETA_RAIZ", f.getId());
  return f;
}
function carpetaCliente(c) {
  var cli = SpreadsheetApp.getActive().getSheetByName(HOJA_CLI);
  var m = c.carpeta.match(/folders\/([\w-]+)/);
  if (m) { try { return DriveApp.getFolderById(m[1]); } catch (e) {} }
  var f = carpetaRaiz().createFolder(c.pareja + " (" + c.codigo + ")");
  cli.getRange(c.fila, CC.carpeta).setValue(f.getUrl());
  c.carpeta = f.getUrl();
  return f;
}
function subirImagen(p) {
  var c = buscarCliente(p.c);
  if (!c) return { ok: false, error: "Cliente no encontrado" };
  var admin = esAdmin(p.admin);
  if (!admin && c.estado.indexOf("Aprobado") !== -1) return { ok: false, error: "El diseño ya fue aprobado" };
  var soloAdmin = { deco: 1, fuente: 1, galeria: 1 };
  if (soloAdmin[p.tipo] && !admin) return { ok: false, error: "No autorizado" };
  var bytes = Utilities.base64Decode(p.data);
  if (bytes.length > 8 * 1024 * 1024) return { ok: false, error: "Archivo demasiado grande" };
  var carpeta = conBloqueo(function () { return carpetaCliente(c); });
  if (carpeta.ok === false) return carpeta;
  var fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
  var tipos = { referencia: "Referencia - " + (p.seccion || "General"), foto1: "Foto 1", foto2: "Foto 2",
    deco: "Decoración - " + (p.seccion || ""), galeria: "Galería", fuente: "Letra" };
  var mime = "image/jpeg", ext = ".jpg";
  if (p.tipo === "fuente") {
    ext = "." + String(p.nombre || "").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
    if ([".ttf", ".otf", ".woff", ".woff2"].indexOf(ext) === -1) return { ok: false, error: "Formato de letra no válido" };
    mime = "application/octet-stream";
  } else if (p.mime === "image/png") { mime = "image/png"; ext = ".png"; }
  var nombre = (tipos[p.tipo] || "Archivo") + " - " + fecha + ext;
  var archivo = carpeta.createFile(Utilities.newBlob(bytes, mime, nombre));
  if (p.tipo === "fuente") return { ok: true, id: archivo.getId() };
  try { archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  var url = mime === "image/png" ? "https://lh3.googleusercontent.com/d/" + archivo.getId() + "=s0"
    : "https://drive.google.com/thumbnail?id=" + archivo.getId() + "&sz=w1800";
  return { ok: true, id: archivo.getId(), url: url };
}

/* Entrega un archivo de letra subido por el administrador (solo de la carpeta de invitaciones) */
function servirFuente(id) {
  try {
    var f = DriveApp.getFileById(String(id || ""));
    if (f.getName().indexOf("Letra - ") !== 0) return { ok: false, error: "No es una letra" };
    var raiz = carpetaRaiz().getId(), dentro = false, padres = f.getParents();
    while (padres.hasNext()) {
      var pp = padres.next().getParents();
      while (pp.hasNext()) if (pp.next().getId() === raiz) dentro = true;
    }
    if (!dentro) return { ok: false, error: "No autorizado" };
    return { ok: true, data: Utilities.base64Encode(f.getBlob().getBytes()) };
  } catch (e) { return { ok: false, error: "No encontrada" }; }
}

/* ================= INVITADOS ================= */
function buscarInvitado(codigo) {
  codigo = String(codigo || "").trim().toUpperCase();
  if (!codigo) return null;
  var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  var n = inv.getLastRow() - 1;
  if (n < 1) return null;
  var filas = inv.getRange(2, 1, n, COL.enviada).getValues();
  for (var i = 0; i < n; i++) {
    var f = filas[i];
    if (String(f[1]).trim().toUpperCase() === codigo)
      return { fila: i + 2, cliente: String(f[0]).toUpperCase(), codigo: codigo, nombre: String(f[2]), pases: Number(f[3]) || 1,
        extra: Number(f[COL.extra - 1]) || 0, solicitud: String(f[COL.solicitud - 1] || "") };
  }
  return null;
}

function registrarApertura(p) {
  var g = buscarInvitado(p.codigo);
  var ape = SpreadsheetApp.getActive().getSheetByName(HOJA_APE);
  var codigo = g ? g.codigo : (p.codigo ? String(p.codigo).toUpperCase() : "(sin código)");
  var previos = dispositivosDe(codigo);
  var nuevo = previos.indexOf(p.dispositivo) === -1;
  ape.appendRow([new Date(), g ? g.cliente : "", codigo, g ? g.nombre : "❓ No registrado", p.dispositivo || "", p.equipo || "",
    nuevo ? (previos.length ? "🟠 Sí (otro dispositivo)" : "Primera vez") : "No"]);
  if (!g) return { ok: true, nombre: "", pases: 0 };
  actualizarInvitado(g);
  var c = buscarCliente(g.cliente);
  return { ok: true, nombre: g.nombre, pases: g.pases, extra: g.extra, solicitud: g.solicitud,
    cliente: c ? { codigo: c.codigo, diseno: c.diseno, datos: c.datos } : null };
}

function registrarRespuesta(p) {
  var g = buscarInvitado(p.codigo);
  var res = SpreadsheetApp.getActive().getSheetByName(HOJA_RES);
  var cantidad = p.asiste === "si" ? Math.max(1, Number(p.cantidad) || 1) : 0;
  var alertas = [];
  if (!g) alertas.push("🔴 Confirmó sin una invitación válida" + (p.codigo ? " (código " + p.codigo + ")" : " (enlace sin código)"));
  else {
    if (!coincideNombre(g.nombre, p.quien)) alertas.push("🔴 Confirmó otra persona: \"" + p.quien + "\" usó la invitación de " + g.nombre);
    if (cantidad > g.pases) alertas.push("🟡 Pidió " + cantidad + " lugares (tenía " + g.pases + "): solicitud enviada a la pareja");
    var disp = dispositivosDe(g.codigo);
    if (disp.length && disp[0] !== p.dispositivo) alertas.push("🟠 Confirmado desde un dispositivo distinto al primero que abrió la invitación");
  }
  res.appendRow([new Date(), g ? g.cliente : String(p.cliente || ""), g ? g.codigo : (p.codigo || "(sin código)"), g ? g.nombre : "❓ No registrado",
    g ? g.pases : "", p.quien || "", p.asiste === "si" ? "Sí" : "No", cantidad, p.acompanantes || "", p.mensaje || "",
    p.dispositivo || "", p.equipo || "", alertas.join("\n")]);
  var extra = 0;
  if (g) {
    var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
    extra = Math.max(0, cantidad - g.pases);
    if (extra > 0) {
      inv.getRange(g.fila, COL.extra, 1, 2).setValues([[extra, "⏳ Pendiente"]]);
      avisarSolicitud(g, extra, p);
    } else if (g.solicitud.indexOf("Pendiente") !== -1 || g.solicitud.indexOf("Rechazada") !== -1) {
      inv.getRange(g.fila, COL.extra, 1, 2).setValues([["", ""]]); // ya no pide lugares extra
    }
    actualizarInvitado(g);
  }
  return { ok: true, extra: extra, pases: g ? g.pases : 0 };
}

/* ================= ESTADO Y ALERTAS ================= */
function dispositivosDe(codigo) {
  var ape = SpreadsheetApp.getActive().getSheetByName(HOJA_APE);
  var n = ape.getLastRow() - 1, lista = [];
  if (n < 1) return lista;
  ape.getRange(2, 3, n, 3).getValues().forEach(function (f) {
    if (String(f[0]).toUpperCase() === codigo && f[2] && lista.indexOf(String(f[2])) === -1) lista.push(String(f[2]));
  });
  return lista;
}

function actualizarInvitado(g) {
  var ss = SpreadsheetApp.getActive();
  var inv = ss.getSheetByName(HOJA_INV), ape = ss.getSheetByName(HOJA_APE), res = ss.getSheetByName(HOJA_RES);
  var filaAct = inv.getRange(g.fila, 1, 1, COL.enviada).getValues()[0];
  var pasesAct = Number(filaAct[COL.pases - 1]) || g.pases || 1;
  var extraAct = Number(filaAct[COL.extra - 1]) || 0, solAct = String(filaAct[COL.solicitud - 1] || ""), enviada = filaAct[COL.enviada - 1];

  var dispositivos = [], equipos = {}, veces = 0, ultima = null;
  if (ape.getLastRow() > 1) ape.getRange(2, 1, ape.getLastRow() - 1, 6).getValues().forEach(function (f) {
    if (String(f[2]).toUpperCase() !== g.codigo) return;
    veces++; ultima = f[0];
    if (f[4] && dispositivos.indexOf(f[4]) === -1) { dispositivos.push(f[4]); equipos[f[4]] = f[5]; }
  });

  var respuestas = [];
  if (res.getLastRow() > 1) res.getRange(2, 1, res.getLastRow() - 1, 13).getValues().forEach(function (f) {
    if (String(f[2]).toUpperCase() === g.codigo) respuestas.push(f);
  });
  var ult = respuestas[respuestas.length - 1];
  // índices en Respuestas: 0 fecha, 5 quién, 6 asiste, 7 cantidad, 8 acompañantes, 9 mensaje, 10 dispositivo

  var alertas = [];
  if (dispositivos.length > 1) {
    alertas.push("🟠 Compartida: la invitación de " + g.nombre + " se abrió en " + dispositivos.length + " dispositivos (" +
      dispositivos.map(function (d) { return equipos[d]; }).join(" / ") + ")");
  }
  if (respuestas.length > 1) {
    var nombres = [];
    respuestas.forEach(function (r) { if (nombres.indexOf(r[5]) === -1) nombres.push(r[5]); });
    alertas.push("🟠 Respondieron " + respuestas.length + " veces (" + nombres.join(", ") + ")");
  }
  if (ult) {
    if (!coincideNombre(g.nombre, ult[5])) alertas.push("🔴 Confirmó otra persona: \"" + ult[5] + "\"");
    if (solAct.indexOf("Pendiente") !== -1) alertas.push("🟡 Pide " + extraAct + " lugar(es) extra: esperando respuesta de la pareja");
    else if (solAct.indexOf("Rechazada") !== -1) alertas.push("⚪ La pareja rechazó " + extraAct + " lugar(es) extra");
    else if (Number(ult[7]) > pasesAct) alertas.push("🔴 Pidió " + ult[7] + " lugares (tenía " + pasesAct + ")");
    if (dispositivos.length > 1 && dispositivos[0] !== ult[10]) alertas.push("🟠 La confirmación vino de otro dispositivo");
    if (!ultima || ult[0] > ultima) ultima = ult[0];
  }

  var estado = ult ? (ult[6] === "Sí" ? "✅ Asistirá" : "❌ No asistirá") : (veces ? "👀 Abierta" : (enviada ? "📤 Enviada" : "⏳ Sin abrir"));
  inv.getRange(g.fila, COL.estado).setValue(estado);
  // Asisten solo los lugares que tiene; los extra cuentan hasta que la pareja los aprueba
  inv.getRange(g.fila, COL.asistiran, 1, 4).setValues([[ult ? Math.min(Number(ult[7]), pasesAct) : "", ult ? ult[5] : "", ult ? ult[8] : "", ult ? ult[9] : ""]]);
  inv.getRange(g.fila, COL.dispositivos, 1, 4).setValues([[dispositivos.length, veces, alertas.join("\n"), ultima || ""]]);
}

function recalcularTodo() {
  var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  if (inv.getLastRow() < 2) return;
  inv.getRange(2, 1, inv.getLastRow() - 1, 4).getValues().forEach(function (f, i) {
    if (f[1]) actualizarInvitado({ fila: i + 2, cliente: String(f[0]).toUpperCase(), codigo: String(f[1]).toUpperCase(), nombre: String(f[2]), pases: Number(f[3]) || 1 });
  });
  SpreadsheetApp.getActive().toast("Alertas recalculadas.", "💍", 4);
}

/* ================= PANEL DE LA PAREJA ================= */
function validarPanel(codigo, clave) {
  var c = buscarCliente(codigo);
  if (!c || !c.clavePanel || String(clave || "").trim() !== c.clavePanel) return null;
  return c;
}
function baseInvitacion() { return String(SpreadsheetApp.getActive().getSheetByName(HOJA_CFG).getRange("B1").getValue() || ""); }
function fechaISO(v) { return v instanceof Date ? v.toISOString() : (v || ""); }
function objetoInvitado(f) {
  return {
    codigo: String(f[COL.codigo - 1]), nombre: String(f[COL.nombre - 1]), pases: Number(f[COL.pases - 1]) || 1,
    telefono: String(f[COL.telefono - 1] || ""), enlace: baseInvitacion() + "?i=" + f[COL.codigo - 1],
    estado: String(f[COL.estado - 1] || ""), asistiran: f[COL.asistiran - 1] === "" ? "" : Number(f[COL.asistiran - 1]),
    quien: String(f[COL.quien - 1] || ""), acompanantes: String(f[COL.acompanantes - 1] || ""), mensaje: String(f[COL.mensaje - 1] || ""),
    dispositivos: Number(f[COL.dispositivos - 1]) || 0, aperturas: Number(f[COL.aperturas - 1]) || 0, alertas: String(f[COL.alertas - 1] || ""),
    ultima: fechaISO(f[COL.ultima - 1]), extra: Number(f[COL.extra - 1]) || 0, solicitud: String(f[COL.solicitud - 1] || ""),
    enviada: fechaISO(f[COL.enviada - 1]), envia: String(f[COL.envia - 1] || ""), enviadaPor: String(f[COL.enviadaPor - 1] || "")
  };
}
function invitadosDe(codigoCliente) {
  var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV), lista = [];
  if (inv.getLastRow() < 2) return lista;
  inv.getRange(2, 1, inv.getLastRow() - 1, COL.enviadaPor).getValues().forEach(function (f) {
    if (String(f[0]).toUpperCase() === codigoCliente && f[COL.codigo - 1]) lista.push(objetoInvitado(f));
  });
  return lista;
}
function leerPanel(p) {
  var c = validarPanel(p.cl, p.k);
  if (!c) return { ok: false, error: "Enlace no válido" };
  var cfg = SpreadsheetApp.getActive().getSheetByName(HOJA_CFG), d = c.datos || {};
  return { ok: true, codigo: c.codigo, pareja: c.pareja, novia: d.novia || "", novio: d.novio || "", fecha: d.fecha || "",
    correo: c.correo, mensaje: d.mensajeWhatsApp || String(cfg.getRange("B2").getValue() || ""), base: baseInvitacion(),
    invitados: invitadosDe(c.codigo) };
}
function limpiarTelefono(t) {
  var d = String(t || "").replace(/\D/g, "");
  if (d.length === 10) d = "52" + d; // número de México sin lada de país
  return d;
}
function accionPanel(p) {
  var c = validarPanel(p.c, p.k);
  if (!c) return { ok: false, error: "Enlace no válido" };
  var ss = SpreadsheetApp.getActive(), inv = ss.getSheetByName(HOJA_INV), cli = ss.getSheetByName(HOJA_CLI);
  var g = p.codigo ? buscarInvitado(p.codigo) : null;
  if (p.codigo && (!g || g.cliente !== c.codigo)) return { ok: false, error: "Invitado no encontrado" };

  if (p.accion === "panelGuardar") {
    var nombre = String(p.nombre || "").trim().slice(0, 120), pases = Math.min(50, Math.max(1, Math.round(Number(p.pases) || 1)));
    if (!nombre) return { ok: false, error: "Falta el nombre" };
    var tel = limpiarTelefono(p.telefono);
    var envia = QUIEN_ENVIA.indexOf(p.envia) !== -1 ? p.envia : "Cualquiera";
    if (g) {
      inv.getRange(g.fila, COL.nombre, 1, 3).setValues([[nombre, pases, tel]]);
      inv.getRange(g.fila, COL.envia).setValue(envia);
    } else {
      var usados = {};
      if (inv.getLastRow() > 1) inv.getRange(2, COL.codigo, inv.getLastRow() - 1, 1).getValues().forEach(function (f) { if (f[0]) usados[String(f[0]).toUpperCase()] = true; });
      var codigo = nuevoCodigo(usados, 5), fila = inv.getLastRow() + 1;
      inv.getRange(fila, COL.telefono).setNumberFormat("@");
      inv.getRange(fila, 1, 1, 5).setValues([[c.codigo, codigo, nombre, pases, tel]]);
      formulasInvitado(inv, fila);
      inv.getRange(fila, COL.estado).setValue("⏳ Sin abrir");
      inv.getRange(fila, COL.envia).setValue(envia);
      g = { fila: fila, codigo: codigo };
    }
  } else if (p.accion === "panelBorrar") {
    if (!g) return { ok: false, error: "Falta el invitado" };
    inv.deleteRow(g.fila);
    return { ok: true };
  } else if (p.accion === "panelSolicitud") {
    if (!g || !g.extra) return { ok: false, error: "No hay solicitud" };
    if (p.decision === "aprobar") inv.getRange(g.fila, COL.pases).setValue(g.pases + g.extra);
    inv.getRange(g.fila, COL.solicitud).setValue(p.decision === "aprobar" ? "✅ Aprobada" : "❌ Rechazada");
  } else if (p.accion === "panelEnviada") {
    if (!g) return { ok: false, error: "Falta el invitado" };
    inv.getRange(g.fila, COL.enviada).setValue(new Date());
    if (p.soy === "Novia" || p.soy === "Novio") inv.getRange(g.fila, COL.enviadaPor).setValue(p.soy);
  } else if (p.accion === "panelMensaje") {
    var d = c.datos || {}; d.mensajeWhatsApp = String(p.mensaje || "").slice(0, 1000);
    cli.getRange(c.fila, CC.datos).setValue(JSON.stringify(d));
    return { ok: true };
  } else if (p.accion === "panelCorreo") {
    var correo = String(p.correo || "").trim();
    if (correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return { ok: false, error: "Correo no válido" };
    cli.getRange(c.fila, CC.correo).setValue(correo);
    return { ok: true };
  } else return { ok: false, error: "Acción desconocida" };

  var g2 = buscarInvitado(g.codigo);
  actualizarInvitado(g2);
  return { ok: true, invitado: objetoInvitado(inv.getRange(g2.fila, 1, 1, COL.enviadaPor).getValues()[0]) };
}

/* ================= AVISOS POR CORREO A LA PAREJA ================= */
function enlacePanel(c) { return baseInvitacion() + "panel.html?c=" + c.codigo + "&k=" + c.clavePanel; }
function puedeEnviarCorreo() { try { return MailApp.getRemainingDailyQuota() > 3; } catch (e) { return false; } }

// Al instante: un invitado pide más lugares
function avisarSolicitud(g, extra, p) {
  try {
    var c = buscarCliente(g.cliente);
    if (!c || !c.correo || !puedeEnviarCorreo()) return;
    MailApp.sendEmail(c.correo, "🙋 " + g.nombre + " pide " + extra + " lugar(es) más para su boda",
      "Hola " + c.pareja + ",\n\n" + g.nombre + " confirmó " + p.cantidad + " personas, pero su invitación es para " + g.pases + ".\n" +
      "Pide " + extra + " lugar(es) extra." + (p.acompanantes ? "\nAcompañantes: " + p.acompanantes : "") +
      (p.quien ? "\nConfirmó: " + p.quien : "") + (p.mensaje ? "\nMensaje: " + p.mensaje : "") +
      "\n\nAprueben o rechacen la solicitud desde su panel:\n" + enlacePanel(c) + "\n\n💍");
  } catch (e) {}
}

// Una vez al día: resumen de confirmaciones para cada pareja
function resumenDiario() {
  var ss = SpreadsheetApp.getActive(), props = PropertiesService.getScriptProperties();
  var desde = Number(props.getProperty("ULTIMO_RESUMEN")) || (Date.now() - 24 * 3600e3), ahora = Date.now();
  var res = ss.getSheetByName(HOJA_RES), porCliente = {};
  if (res.getLastRow() > 1) res.getRange(2, 1, res.getLastRow() - 1, 13).getValues().forEach(function (f) {
    var t = f[0] instanceof Date ? f[0].getTime() : 0;
    if (t > desde && t <= ahora && f[1]) (porCliente[String(f[1]).toUpperCase()] = porCliente[String(f[1]).toUpperCase()] || []).push(f);
  });
  Object.keys(porCliente).forEach(function (cod) {
    var c = buscarCliente(cod);
    if (!c || !c.correo || !puedeEnviarCorreo()) return;
    var lineas = porCliente[cod].map(function (f) {
      return (f[6] === "Sí" ? "✅ " + f[3] + ": " + f[7] + " persona(s)" : "❌ " + f[3] + ": no podrá asistir") +
        (f[5] && f[5] !== f[3] ? " (confirmó " + f[5] + ")" : "") + (f[9] ? "\n     💬 \"" + f[9] + "\"" : "");
    });
    var lista = invitadosDe(c.codigo), personas = 0, si = 0, no = 0, pendientes = 0, solicitudes = 0;
    lista.forEach(function (i) {
      if (i.estado.indexOf("No asistirá") !== -1) no++; else if (i.estado.indexOf("Asistirá") !== -1) { si++; personas += Number(i.asistiran) || 0; } else pendientes++;
      if (i.solicitud.indexOf("Pendiente") !== -1) solicitudes++;
    });
    MailApp.sendEmail(c.correo, "💌 Resumen de su boda: " + porCliente[cod].length + " respuesta(s) nueva(s)",
      "Hola " + c.pareja + ",\n\nEstas son las respuestas de hoy:\n\n" + lineas.join("\n") +
      "\n\nTotal hasta ahora: " + personas + " personas confirmadas · " + si + " invitaciones confirmadas · " + no + " no asistirán · " + pendientes + " sin responder" +
      (solicitudes ? "\n🙋 Tienen " + solicitudes + " solicitud(es) de lugares extra esperando su respuesta." : "") +
      "\n\nVean todo en su panel:\n" + enlacePanel(c) + "\n\n💍");
  });
  props.setProperty("ULTIMO_RESUMEN", String(ahora));
}

function activarResumenDiario(silencioso) {
  try {
    var existe = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "resumenDiario"; });
    if (!existe) ScriptApp.newTrigger("resumenDiario").timeBased().everyDays(1).atHour(20).create();
    if (silencioso !== true) SpreadsheetApp.getActive().toast("Resumen diario activado: se envía cada noche a las parejas con correo.", "💍", 6);
  } catch (e) { if (silencioso !== true) throw e; }
}

/* "Juan Pérez" coincide con "Familia Pérez"; "Carlos Ruiz" no coincide con "Ana López" */
function coincideNombre(original, quien) {
  var ignorar = ["familia", "fam", "flia", "sr", "sra", "srta", "sres", "dr", "dra", "y", "e", "de", "del", "la", "las", "los", "el", "lic", "ing"];
  function palabras(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zñ\s]/g, " ")
      .split(/\s+/).filter(function (w) { return w.length >= 3 && ignorar.indexOf(w) === -1; });
  }
  var a = palabras(original), b = palabras(quien);
  if (!a.length || !b.length) return true;
  return b.some(function (w) { return a.indexOf(w) !== -1; });
}

/* ================= AUXILIARES ================= */
function obtenerHoja(ss, nombre) { return ss.getSheetByName(nombre) || ss.insertSheet(nombre); }
function estiloEncabezado(h, n) {
  h.getRange(1, 1, 1, n).setBackground(COLORES.moca).setFontColor(COLORES.blanco).setFontWeight("bold")
    .setVerticalAlignment("middle").setWrap(true);
  h.setRowHeight(1, 38);
}
