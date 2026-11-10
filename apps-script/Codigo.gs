/**
 * INVITACIÓN DE BODA · Hoja de invitados
 * --------------------------------------
 * Pega este código en Google Sheets > Extensiones > Apps Script.
 * Sigue los pasos de LEEME.md.
 */

var HOJA_INV = "Invitados";
var HOJA_APE = "Aperturas";
var HOJA_RES = "Respuestas";
var HOJA_CFG = "Configuración";
var HOJA_RESUMEN = "Resumen";

// Columnas de "Invitados" (1 = A)
var COL = {
  codigo: 1, nombre: 2, pases: 3, telefono: 4, enlace: 5, whatsapp: 6,
  estado: 7, asistiran: 8, quien: 9, acompanantes: 10, mensaje: 11,
  dispositivos: 12, aperturas: 13, alertas: 14, ultima: 15
};
var ENCABEZADOS_INV = ["Código", "Nombre del invitado", "Pases", "Teléfono (con lada país)", "Enlace personal",
  "Enviar", "Estado", "Asistirán", "Quién confirmó", "Acompañantes", "Mensaje", "Dispositivos",
  "Veces abierta", "⚠️ Alertas", "Última actividad"];

var COLORES = { moca: "#7A5040", beige: "#EDE3D4", blanco: "#F5F1EA", rosa: "#F2DCD3", salvia: "#E3E8DA", dorado: "#D4AF6A" };

/* ================= MENÚ ================= */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("💍 Invitación")
    .addItem("1. Preparar hojas (solo la primera vez)", "prepararHojas")
    .addItem("2. Generar códigos y enlaces", "generarEnlaces")
    .addItem("Recalcular alertas", "recalcularTodo")
    .addToUi();
}

/* Al escribir un nombre nuevo, se genera su código y enlace automáticamente */
function onEdit(e) {
  try {
    var h = e.range.getSheet();
    if (h.getName() !== HOJA_INV || e.range.getRow() < 2) return;
    if (e.range.getColumn() <= COL.pases && e.range.getLastColumn() >= COL.nombre) generarEnlaces(true);
  } catch (err) {}
}

/* ================= PREPARAR HOJAS ================= */
function prepararHojas() {
  var ss = SpreadsheetApp.getActive();

  // Configuración
  var cfg = obtenerHoja(ss, HOJA_CFG);
  if (!cfg.getRange("B1").getValue()) {
    cfg.getRange("A1:B4").setValues([
      ["URL de la invitación", "https://TU-USUARIO.github.io/invitaci-n-boda/"],
      ["Mensaje de WhatsApp", "¡Hola {nombre}! 💌 Con mucha ilusión te compartimos nuestra invitación de boda. Hemos reservado {pases} lugar(es) para ti. Ábrela aquí: {enlace}"],
      ["", ""],
      ["Puedes usar en el mensaje:", "{nombre}  {pases}  {enlace}"]
    ]);
  }
  cfg.getRange("A1:A4").setFontWeight("bold").setFontColor(COLORES.moca);
  cfg.setColumnWidth(1, 200); cfg.setColumnWidth(2, 620);
  cfg.getRange("B2").setWrap(true);

  // Invitados
  var inv = obtenerHoja(ss, HOJA_INV);
  inv.getRange(1, 1, 1, ENCABEZADOS_INV.length).setValues([ENCABEZADOS_INV]);
  estiloEncabezado(inv, ENCABEZADOS_INV.length);
  inv.setFrozenRows(1); inv.setFrozenColumns(2);
  [70, 200, 60, 140, 260, 90, 120, 80, 160, 220, 220, 95, 95, 340, 150].forEach(function (w, i) { inv.setColumnWidth(i + 1, w); });
  inv.getRange(2, COL.alertas, inv.getMaxRows() - 1, 1).setWrap(true).setFontColor("#9B2C1C");
  inv.getRange(2, 1, inv.getMaxRows() - 1, 3).setBackground("#FFFDF8");
  inv.getRange(2, COL.telefono, inv.getMaxRows() - 1, 1).setNumberFormat("@").setBackground("#FFFDF8");
  if (inv.getLastRow() < 2) inv.getRange(2, COL.nombre, 1, 3).setValues([["Familia Ejemplo", 4, "5215500000000"]]);

  var reglas = [
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$N2<>""').setBackground("#FBE3DC")
      .setRanges([inv.getRange("A2:O")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("Asistirá").setBackground(COLORES.salvia)
      .setRanges([inv.getRange("G2:G")]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextContains("No asistirá").setBackground("#E9E2DD")
      .setRanges([inv.getRange("G2:G")]).build()
  ];
  inv.setConditionalFormatRules(reglas);

  // Aperturas
  var ape = obtenerHoja(ss, HOJA_APE);
  var encA = ["Fecha", "Código", "Invitación de", "Dispositivo", "Equipo", "¿Dispositivo nuevo?"];
  ape.getRange(1, 1, 1, encA.length).setValues([encA]); estiloEncabezado(ape, encA.length); ape.setFrozenRows(1);
  [150, 70, 200, 110, 160, 140].forEach(function (w, i) { ape.setColumnWidth(i + 1, w); });

  // Respuestas
  var res = obtenerHoja(ss, HOJA_RES);
  var encR = ["Fecha", "Código", "Invitación de", "Pases asignados", "Quién confirmó", "Asiste", "Cantidad",
    "Acompañantes", "Mensaje", "Dispositivo", "Equipo", "⚠️ Alertas"];
  res.getRange(1, 1, 1, encR.length).setValues([encR]); estiloEncabezado(res, encR.length); res.setFrozenRows(1);
  [150, 70, 200, 80, 180, 70, 80, 220, 220, 110, 160, 340].forEach(function (w, i) { res.setColumnWidth(i + 1, w); });
  res.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$L2<>""')
    .setBackground("#FBE3DC").setRanges([res.getRange("A2:L")]).build()]);

  // Resumen
  var rsm = obtenerHoja(ss, HOJA_RESUMEN);
  rsm.getRange("A1:B8").setValues([
    ["Resumen", ""],
    ["Invitaciones", '=COUNTA(Invitados!B2:B)'],
    ["Lugares asignados", '=SUM(Invitados!C2:C)'],
    ["Personas que asistirán", '=SUM(Invitados!H2:H)'],
    ["Invitaciones confirmadas (sí)", '=COUNTIF(Invitados!G2:G,"*Asistirá*")-COUNTIF(Invitados!G2:G,"*No asistirá*")'],
    ["Invitaciones que no asistirán", '=COUNTIF(Invitados!G2:G,"*No asistirá*")'],
    ["Pendientes de responder", '=B2-B5-B6'],
    ["Invitaciones con alertas", '=COUNTIF(Invitados!N2:N,"?*")']
  ]);
  rsm.getRange("A1").setFontSize(16).setFontWeight("bold").setFontColor(COLORES.moca);
  rsm.getRange("A2:A8").setFontColor(COLORES.moca).setFontWeight("bold");
  rsm.getRange("B2:B8").setFontSize(13).setHorizontalAlignment("center");
  rsm.getRange("A8:B8").setBackground("#FBE3DC");
  rsm.setColumnWidth(1, 260); rsm.setColumnWidth(2, 100);

  ss.setActiveSheet(inv);
  generarEnlaces(true);
  SpreadsheetApp.getActive().toast("Hojas listas. Escribe tus invitados en la hoja 'Invitados'.", "💍 Listo", 6);
}

/* ================= CÓDIGOS Y ENLACES ================= */
function generarEnlaces(silencioso) {
  var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  if (!inv || inv.getLastRow() < 2) return;
  var n = inv.getLastRow() - 1;
  var datos = inv.getRange(2, 1, n, 3).getValues();
  var usados = {};
  datos.forEach(function (f) { if (f[0]) usados[String(f[0]).toUpperCase()] = true; });

  var cfgRef = "'" + HOJA_CFG + "'!";
  for (var i = 0; i < n; i++) {
    var fila = i + 2, codigo = String(datos[i][0]).trim(), nombre = String(datos[i][1]).trim();
    if (!nombre) continue;
    if (!codigo) {
      codigo = nuevoCodigo(usados); usados[codigo] = true;
      inv.getRange(fila, COL.codigo).setValue(codigo);
    }
    if (!datos[i][2]) inv.getRange(fila, COL.pases).setValue(1);
    inv.getRange(fila, COL.enlace).setFormula('=IF(A' + fila + '="","",' + cfgRef + '$B$1&"?i="&A' + fila + ')');
    inv.getRange(fila, COL.whatsapp).setFormula(
      '=IF(A' + fila + '="","",HYPERLINK("https://wa.me/"&REGEXREPLACE(TO_TEXT(D' + fila + '),"\\D","")&"?text="&ENCODEURL(' +
      'SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(' + cfgRef + '$B$2,"{nombre}",B' + fila + '),"{pases}",C' + fila + '),"{enlace}",E' + fila + ')),"📲 Enviar"))');
    if (!inv.getRange(fila, COL.estado).getValue()) inv.getRange(fila, COL.estado).setValue("⏳ Sin abrir");
  }
  if (silencioso !== true) SpreadsheetApp.getActive().toast("Códigos y enlaces generados.", "💍", 4);
}

function nuevoCodigo(usados) {
  var letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", c;
  do { c = ""; for (var i = 0; i < 4; i++) c += letras.charAt(Math.floor(Math.random() * letras.length)); } while (usados[c]);
  return c;
}

/* ================= WEB APP (la invitación llama aquí) ================= */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var r;
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (p.accion === "abrir") r = registrarApertura(p);
    else if (p.accion === "confirmar") r = registrarRespuesta(p);
    else r = { ok: true, mensaje: "La hoja de la invitación está conectada correctamente 💍" };
  } catch (err) {
    r = { ok: false, error: String(err) };
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
  var json = JSON.stringify(r);
  var cb = String(p.callback || "").replace(/[^\w$]/g, "");
  if (cb) return ContentService.createTextOutput(cb + "(" + json + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function buscarInvitado(codigo) {
  codigo = String(codigo || "").trim().toUpperCase();
  if (!codigo) return null;
  var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  var n = inv.getLastRow() - 1;
  if (n < 1) return null;
  var cods = inv.getRange(2, 1, n, 3).getValues();
  for (var i = 0; i < n; i++) {
    if (String(cods[i][0]).trim().toUpperCase() === codigo)
      return { fila: i + 2, codigo: codigo, nombre: String(cods[i][1]), pases: Number(cods[i][2]) || 1 };
  }
  return null;
}

function registrarApertura(p) {
  var ss = SpreadsheetApp.getActive();
  var g = buscarInvitado(p.codigo);
  var ape = ss.getSheetByName(HOJA_APE);
  var codigo = g ? g.codigo : (p.codigo ? String(p.codigo).toUpperCase() : "(sin código)");
  var previos = dispositivosDe(codigo);
  var nuevo = previos.indexOf(p.dispositivo) === -1;
  ape.appendRow([new Date(), codigo, g ? g.nombre : "❓ No registrado", p.dispositivo || "", p.equipo || "",
    nuevo ? (previos.length ? "🟠 Sí (otro dispositivo)" : "Primera vez") : "No"]);

  if (!g) return { ok: true, nombre: "", pases: 0 };
  actualizarInvitado(g);
  return { ok: true, nombre: g.nombre, pases: g.pases };
}

function registrarRespuesta(p) {
  var ss = SpreadsheetApp.getActive();
  var g = buscarInvitado(p.codigo);
  var res = ss.getSheetByName(HOJA_RES);
  var cantidad = p.asiste === "si" ? Math.max(1, Number(p.cantidad) || 1) : 0;

  var alertas = [];
  if (!g) alertas.push("🔴 Confirmó sin una invitación válida" + (p.codigo ? " (código " + p.codigo + ")" : " (enlace sin código)"));
  else {
    if (!coincideNombre(g.nombre, p.quien)) alertas.push("🔴 Confirmó otra persona: \"" + p.quien + "\" usó la invitación de " + g.nombre);
    if (cantidad > g.pases) alertas.push("🔴 Pidió " + cantidad + " lugares (tenía " + g.pases + ")");
    var disp = dispositivosDe(g.codigo);
    if (disp.length && disp[0] !== p.dispositivo) alertas.push("🟠 Confirmado desde un dispositivo distinto al primero que abrió la invitación");
  }

  res.appendRow([new Date(), g ? g.codigo : (p.codigo || "(sin código)"), g ? g.nombre : "❓ No registrado", g ? g.pases : "",
    p.quien || "", p.asiste === "si" ? "Sí" : "No", cantidad, p.acompanantes || "", p.mensaje || "",
    p.dispositivo || "", p.equipo || "", alertas.join("\n")]);

  if (g) actualizarInvitado(g);
  return { ok: true };
}

/* ================= CÁLCULO DE ESTADO Y ALERTAS ================= */
function dispositivosDe(codigo) {
  var ape = SpreadsheetApp.getActive().getSheetByName(HOJA_APE);
  var n = ape.getLastRow() - 1, lista = [];
  if (n < 1) return lista;
  ape.getRange(2, 2, n, 3).getValues().forEach(function (f) {
    if (String(f[0]).toUpperCase() === codigo && f[2] && lista.indexOf(f[2]) === -1) lista.push(String(f[2]));
  });
  return lista;
}

function actualizarInvitado(g) {
  var ss = SpreadsheetApp.getActive();
  var inv = ss.getSheetByName(HOJA_INV), ape = ss.getSheetByName(HOJA_APE), res = ss.getSheetByName(HOJA_RES);

  // Aperturas de este código
  var dispositivos = [], equipos = {}, veces = 0, ultima = null;
  if (ape.getLastRow() > 1) ape.getRange(2, 1, ape.getLastRow() - 1, 5).getValues().forEach(function (f) {
    if (String(f[1]).toUpperCase() !== g.codigo) return;
    veces++; ultima = f[0];
    if (f[3] && dispositivos.indexOf(f[3]) === -1) { dispositivos.push(f[3]); equipos[f[3]] = f[4]; }
  });

  // Respuestas de este código
  var respuestas = [];
  if (res.getLastRow() > 1) res.getRange(2, 1, res.getLastRow() - 1, 12).getValues().forEach(function (f) {
    if (String(f[1]).toUpperCase() === g.codigo) respuestas.push(f);
  });
  var ult = respuestas[respuestas.length - 1];

  var alertas = [];
  if (dispositivos.length > 1) {
    alertas.push("🟠 Compartida: la invitación de " + g.nombre + " se abrió en " + dispositivos.length + " dispositivos (" +
      dispositivos.map(function (d) { return equipos[d]; }).join(" / ") + ")");
  }
  if (respuestas.length > 1) {
    var nombres = [];
    respuestas.forEach(function (r) { if (nombres.indexOf(r[4]) === -1) nombres.push(r[4]); });
    alertas.push("🟠 Respondieron " + respuestas.length + " veces (" + nombres.join(", ") + ")");
  }
  if (ult) {
    if (!coincideNombre(g.nombre, ult[4])) alertas.push("🔴 Confirmó otra persona: \"" + ult[4] + "\"");
    if (Number(ult[6]) > g.pases) alertas.push("🔴 Pidió " + ult[6] + " lugares (tenía " + g.pases + ")");
    if (dispositivos.length > 1 && dispositivos[0] !== ult[9]) alertas.push("🟠 La confirmación vino de otro dispositivo");
    if (ult[0] > ultima) ultima = ult[0];
  }

  var estado = ult ? (ult[5] === "Sí" ? "✅ Asistirá" : "❌ No asistirá") : (veces ? "👀 Abierta" : "⏳ Sin abrir");
  inv.getRange(g.fila, COL.estado).setValue(estado);
  inv.getRange(g.fila, COL.asistiran, 1, 4).setValues([[ult ? Number(ult[6]) : "", ult ? ult[4] : "", ult ? ult[7] : "", ult ? ult[8] : ""]]);
  inv.getRange(g.fila, COL.dispositivos, 1, 4).setValues([[dispositivos.length, veces, alertas.join("\n"), ultima || ""]]);
}

function recalcularTodo() {
  var inv = SpreadsheetApp.getActive().getSheetByName(HOJA_INV);
  if (inv.getLastRow() < 2) return;
  inv.getRange(2, 1, inv.getLastRow() - 1, 3).getValues().forEach(function (f, i) {
    if (f[0]) actualizarInvitado({ fila: i + 2, codigo: String(f[0]).toUpperCase(), nombre: String(f[1]), pases: Number(f[2]) || 1 });
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
