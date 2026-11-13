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
var CC = { codigo: 1, pareja: 2, contacto: 3, estado: 4, disenar: 5, enviar: 6, ver: 7, carpeta: 8, actualizado: 9, notas: 10, diseno: 11, datos: 12 };
var ENC_CLI = ["Código", "Pareja", "WhatsApp del cliente", "Estado del diseño", "Enlace para diseñar", "Enviar al cliente",
  "Ver invitación", "Carpeta (fotos y referencias)", "Última actualización", "Notas", "Diseño (no editar)", "Datos (no editar)"];
var ESTADOS = ["✏️ Diseñando", "📩 Enviado", "✅ Aprobado"];

// Columnas de "Invitados"
var COL = {
  cliente: 1, codigo: 2, nombre: 3, pases: 4, telefono: 5, enlace: 6, whatsapp: 7,
  estado: 8, asistiran: 9, quien: 10, acompanantes: 11, mensaje: 12,
  dispositivos: 13, aperturas: 14, alertas: 15, ultima: 16
};
var ENC_INV = ["Cliente", "Código", "Nombre del invitado", "Pases", "Teléfono (con lada país)", "Enlace personal",
  "Enviar", "Estado", "Asistirán", "Quién confirmó", "Acompañantes", "Mensaje", "Dispositivos",
  "Veces abierta", "⚠️ Alertas", "Última actividad"];

// Aperturas: Fecha | Cliente | Código | Invitación de | Dispositivo | Equipo | ¿Nuevo?
// Respuestas: Fecha | Cliente | Código | Invitación de | Pases | Quién | Asiste | Cantidad | Acompañantes | Mensaje | Dispositivo | Equipo | Alertas

var COLORES = { moca: "#7A5040", blanco: "#F5F1EA", salvia: "#E3E8DA" };

/* ================= MENÚ ================= */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("💍 Invitaciones")
    .addItem("1. Preparar hojas (solo la primera vez)", "prepararHojas")
    .addItem("Generar códigos y enlaces", "generarTodo")
    .addItem("Recalcular alertas", "recalcularTodo")
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
  [80, 200, 150, 130, 300, 130, 90, 150, 150, 220, 90, 90].forEach(function (w, i) { cli.setColumnWidth(i + 1, w); });
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
function generarTodo(silencioso) { generarClientes(true); generarEnlaces(true); if (silencioso !== true) SpreadsheetApp.getActive().toast("Códigos y enlaces generados.", "💍", 4); }

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
  }
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
    inv.getRange(fila, COL.enlace).setFormula('=IF(B' + fila + '="","",' + cfg + '$B$1&"?i="&B' + fila + ')');
    inv.getRange(fila, COL.whatsapp).setFormula(
      '=IF(B' + fila + '="","",HYPERLINK("https://wa.me/"&REGEXREPLACE(TO_TEXT(E' + fila + '),"\\D","")&"?text="&ENCODEURL(' +
      'SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(' + cfg + '$B$2,"{nombre}",C' + fila + '),"{pases}",D' + fila + '),"{enlace}",F' + fila +
      '),"{pareja}",IFERROR(VLOOKUP(A' + fila + ',Clientes!A:B,2,FALSE),""))),"📲 Enviar"))');
    if (!inv.getRange(fila, COL.estado).getValue()) inv.getRange(fila, COL.estado).setValue("⏳ Sin abrir");
  }
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
    if (p.accion === "cliente") return leerCliente(p.c);
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
  var filas = cli.getRange(2, 1, n, CC.datos).getValues();
  for (var i = 0; i < n; i++) {
    if (String(filas[i][0]).trim().toUpperCase() === codigo) {
      var f = filas[i];
      return {
        fila: i + 2, codigo: codigo, pareja: String(f[CC.pareja - 1]), estado: String(f[CC.estado - 1] || ESTADOS[0]),
        carpeta: String(f[CC.carpeta - 1] || ""), diseno: parsear(f[CC.diseno - 1]), datos: parsear(f[CC.datos - 1])
      };
    }
  }
  return null;
}
function parsear(v) { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } }

function leerCliente(codigo) {
  var c = buscarCliente(codigo);
  if (!c) return { ok: false, error: "Cliente no encontrado" };
  return { ok: true, codigo: c.codigo, pareja: c.pareja, estado: c.estado, diseno: c.diseno, datos: c.datos, datosGuardados: !!c.datos };
}

function guardarDiseno(p) {
  var c = buscarCliente(p.c);
  if (!c) return { ok: false, error: "Cliente no encontrado" };
  if (c.estado.indexOf("Aprobado") !== -1) return { ok: false, error: "El diseño ya fue aprobado", estado: c.estado };
  var cli = SpreadsheetApp.getActive().getSheetByName(HOJA_CLI);
  var dis = JSON.stringify(p.diseno || {}), dat = JSON.stringify(p.datos || {});
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
  if (c.estado.indexOf("Aprobado") !== -1) return { ok: false, error: "El diseño ya fue aprobado" };
  var bytes = Utilities.base64Decode(p.data);
  if (bytes.length > 8 * 1024 * 1024) return { ok: false, error: "Imagen demasiado grande" };
  var carpeta = conBloqueo(function () { return carpetaCliente(c); });
  if (carpeta.ok === false) return carpeta;
  var fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm");
  var nombre = (p.tipo === "referencia" ? "Referencia - " + (p.seccion || "General") : (p.tipo === "foto1" ? "Foto 1" : "Foto 2")) + " - " + fecha + ".jpg";
  var archivo = carpeta.createFile(Utilities.newBlob(bytes, "image/jpeg", nombre));
  try { archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  return { ok: true, id: archivo.getId(), url: "https://drive.google.com/thumbnail?id=" + archivo.getId() + "&sz=w1800" };
}

/* ================= INVITADOS ================= */
function buscarInvitado(codigo) {
  codigo = String(codigo || "").trim().toUpperCase();
  if (!codigo) return null;
  var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  var n = inv.getLastRow() - 1;
  if (n < 1) return null;
  var filas = inv.getRange(2, 1, n, 4).getValues();
  for (var i = 0; i < n; i++) {
    if (String(filas[i][1]).trim().toUpperCase() === codigo)
      return { fila: i + 2, cliente: String(filas[i][0]).toUpperCase(), codigo: codigo, nombre: String(filas[i][2]), pases: Number(filas[i][3]) || 1 };
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
  return { ok: true, nombre: g.nombre, pases: g.pases, cliente: c ? { codigo: c.codigo, diseno: c.diseno, datos: c.datos } : null };
}

function registrarRespuesta(p) {
  var g = buscarInvitado(p.codigo);
  var res = SpreadsheetApp.getActive().getSheetByName(HOJA_RES);
  var cantidad = p.asiste === "si" ? Math.max(1, Number(p.cantidad) || 1) : 0;
  var alertas = [];
  if (!g) alertas.push("🔴 Confirmó sin una invitación válida" + (p.codigo ? " (código " + p.codigo + ")" : " (enlace sin código)"));
  else {
    if (!coincideNombre(g.nombre, p.quien)) alertas.push("🔴 Confirmó otra persona: \"" + p.quien + "\" usó la invitación de " + g.nombre);
    if (cantidad > g.pases) alertas.push("🔴 Pidió " + cantidad + " lugares (tenía " + g.pases + ")");
    var disp = dispositivosDe(g.codigo);
    if (disp.length && disp[0] !== p.dispositivo) alertas.push("🟠 Confirmado desde un dispositivo distinto al primero que abrió la invitación");
  }
  res.appendRow([new Date(), g ? g.cliente : String(p.cliente || ""), g ? g.codigo : (p.codigo || "(sin código)"), g ? g.nombre : "❓ No registrado",
    g ? g.pases : "", p.quien || "", p.asiste === "si" ? "Sí" : "No", cantidad, p.acompanantes || "", p.mensaje || "",
    p.dispositivo || "", p.equipo || "", alertas.join("\n")]);
  if (g) actualizarInvitado(g);
  return { ok: true };
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
    if (Number(ult[7]) > g.pases) alertas.push("🔴 Pidió " + ult[7] + " lugares (tenía " + g.pases + ")");
    if (dispositivos.length > 1 && dispositivos[0] !== ult[10]) alertas.push("🟠 La confirmación vino de otro dispositivo");
    if (!ultima || ult[0] > ultima) ultima = ult[0];
  }

  var estado = ult ? (ult[6] === "Sí" ? "✅ Asistirá" : "❌ No asistirá") : (veces ? "👀 Abierta" : "⏳ Sin abrir");
  inv.getRange(g.fila, COL.estado).setValue(estado);
  inv.getRange(g.fila, COL.asistiran, 1, 4).setValues([[ult ? Number(ult[7]) : "", ult ? ult[5] : "", ult ? ult[8] : "", ult ? ult[9] : ""]]);
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
