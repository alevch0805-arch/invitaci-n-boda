(function () {
  "use strict";
  var C = window.CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var todos = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  var url = new URLSearchParams(location.search);
  var cliente = (url.get("c") || "DEMO").trim().toUpperCase();
  var clave = (url.get("k") || "").trim();
  var demo = !C.urlHojaDeCalculo || cliente === "DEMO";

  var E = { pareja: "", novia: "", novio: "", fecha: "", correo: "", mensaje: "", base: "", invitados: [] };
  var filtro = "todos", abiertos = {}, decididas = [];

  /* ---------- Utilidades ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function aviso(t) { var a = $("toast"); a.textContent = t; a.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(function () { a.hidden = true; }, 2600); }
  function llamar(params) {
    return new Promise(function (ok, falla) {
      var cb = "cb_" + Math.random().toString(36).slice(2), s = document.createElement("script");
      var t = setTimeout(function () { limpiar(); falla(new Error("Tiempo agotado")); }, 20000);
      function limpiar() { clearTimeout(t); delete window[cb]; s.remove(); }
      window[cb] = function (r) { limpiar(); ok(r); };
      params.callback = cb; params._ = Date.now();
      s.src = C.urlHojaDeCalculo + "?" + Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
      s.onerror = function () { limpiar(); falla(new Error("Sin conexión")); };
      document.body.appendChild(s);
    });
  }
  function accion(datos) {
    datos.c = cliente; datos.k = clave;
    if (demo) return Promise.resolve(demoAccion(datos));
    return fetch(C.urlHojaDeCalculo, { method: "POST", body: JSON.stringify(datos) })
      .then(function (r) { return r.json(); })
      .then(function (r) { if (!r || !r.ok) throw new Error((r && r.error) || "Error"); return r; });
  }
  function reemplazar(inv) {
    var i = E.invitados.findIndex(function (x) { return x.codigo === inv.codigo; });
    if (i === -1) E.invitados.push(inv); else E.invitados[i] = inv;
  }

  function nombrePareja() { return E.novia && E.novio ? E.novia + " & " + E.novio : E.pareja; }
  function mensajeDe(inv, plantilla) {
    return (plantilla || E.mensaje || "¡Hola {nombre}! Te compartimos nuestra invitación de boda: {enlace}")
      .replace(/\{nombre\}/g, inv.nombre).replace(/\{pases\}/g, inv.pases).replace(/\{enlace\}/g, inv.enlace).replace(/\{pareja\}/g, nombrePareja());
  }
  function enlaceWA(telefono, texto) {
    var d = String(telefono || "").replace(/\D/g, "");
    if (d.length === 10) d = "52" + d;
    return "https://wa.me/" + d + "?text=" + encodeURIComponent(texto);
  }
  function tipo(inv) {
    var e = inv.estado || "";
    if (e.indexOf("No asistirá") !== -1) return "no";
    if (e.indexOf("Asistirá") !== -1) return "si";
    if (e.indexOf("Abierta") !== -1) return "abierta";
    if (inv.enviada || e.indexOf("Enviada") !== -1) return "enviada";
    return "sinEnviar";
  }
  var etiquetas = { si: "✅ Asistirá", no: "❌ No asistirá", abierta: "👀 La abrió", enviada: "📤 Enviada", sinEnviar: "⏳ Sin enviar" };

  /* ---------- Pintar ---------- */
  function pintar() {
    $("titulo").textContent = nombrePareja() || "Nuestra boda";
    document.title = "Panel · " + (nombrePareja() || "Boda");
    if (E.fecha) {
      var f = new Date(E.fecha + "T12:00"), dias = Math.ceil((f - new Date()) / 864e5);
      $("fechaBoda").textContent = f.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) + (dias > 0 ? " · faltan " + dias + " días" : "");
    }
    $("enlaceDisenar").href = "disenar.html?c=" + encodeURIComponent(cliente);

    var L = E.invitados, n = { total: L.length, enviadas: 0, si: 0, no: 0, personas: 0, pendientes: 0, sol: 0 };
    L.forEach(function (i) {
      var t = tipo(i);
      if (t !== "sinEnviar") n.enviadas++;
      if (t === "si") { n.si++; n.personas += Number(i.asistiran) || 0; } else if (t === "no") n.no++; else n.pendientes++;
      if ((i.solicitud || "").indexOf("Pendiente") !== -1) n.sol++;
    });
    var pasesTotales = L.reduce(function (a, i) { return a + (Number(i.pases) || 0); }, 0);
    $("resumen").innerHTML = [
      [n.personas, "Personas confirmadas", "destacada"], [pasesTotales, "Lugares asignados"], [n.total, "Invitaciones"],
      [n.enviadas, "Enviadas"], [n.si, "Confirmaron"], [n.no, "No asistirán"]
    ].map(function (t) { return '<div class="tarjeta ' + (t[2] || "") + '"><b>' + t[0] + "</b><span>" + t[1] + "</span></div>"; }).join("");

    var faltan = L.filter(function (i) { return tipo(i) === "sinEnviar"; }).length;
    $("numFaltan").textContent = faltan ? "(" + faltan + ")" : "";
    $("btnEnviarPendientes").disabled = !faltan;

    pintarSolicitudes();
    pintarLista();
  }

  function pintarSolicitudes() {
    var pend = E.invitados.filter(function (i) { return (i.solicitud || "").indexOf("Pendiente") !== -1; });
    $("bloqueSolicitudes").hidden = !pend.length && !decididas.length;
    $("listaSolicitudes").innerHTML = pend.map(function (i) {
      return '<div class="solicitud" data-codigo="' + esc(i.codigo) + '"><strong>' + esc(i.nombre) + " pide " + i.extra + (i.extra == 1 ? " lugar más" : " lugares más") + "</strong>" +
        '<p class="nota">Su invitación es para ' + i.pases + " · confirmó " + (i.pases + i.extra) + (i.quien ? " · confirmó: " + esc(i.quien) : "") + "</p>" +
        (i.acompanantes ? '<p class="nota">Acompañantes: ' + esc(i.acompanantes) + "</p>" : "") +
        '<div class="acciones"><button type="button" class="btn-aprobar" data-decision="aprobar">✅ Aprobar</button>' +
        '<button type="button" class="btn-rechazar" data-decision="rechazar">❌ Rechazar</button></div></div>';
    }).join("") + decididas.map(function (d) {
      return '<div class="solicitud"><strong>' + (d.decision === "aprobar" ? "✅ Aprobaste " : "❌ Rechazaste ") + "la solicitud de " + esc(d.inv.nombre) + "</strong>" +
        '<a class="btn-wa" target="_blank" rel="noopener" href="' + esc(enlaceWA(d.inv.telefono, d.texto)) + '">📲 Avisarle por WhatsApp</a></div>';
    }).join("");
    todos("[data-decision]").forEach(function (b) {
      b.addEventListener("click", function () {
        var caja = b.closest(".solicitud"), codigo = caja.dataset.codigo, inv = E.invitados.find(function (x) { return x.codigo === codigo; });
        var decision = b.dataset.decision, extra = inv.extra, pasesAntes = inv.pases;
        todos("button", caja).forEach(function (x) { x.disabled = true; });
        accion({ accion: "panelSolicitud", codigo: codigo, decision: decision }).then(function (r) {
          reemplazar(r.invitado);
          var texto = decision === "aprobar"
            ? "¡Hola " + inv.nombre + "! 🎉 Con gusto aprobamos tus " + extra + " lugar(es) extra. Tu invitación ahora es para " + (pasesAntes + extra) + " personas. ¡Los esperamos! " + inv.enlace
            : "¡Hola " + inv.nombre + "! Gracias por confirmar 💛 Por espacio no nos es posible agregar lugares extra; tu invitación es para " + pasesAntes + (pasesAntes == 1 ? " persona" : " personas") + ". ¡Te esperamos!";
          decididas.unshift({ decision: decision, inv: r.invitado, texto: texto });
          pintar(); aviso(decision === "aprobar" ? "Solicitud aprobada" : "Solicitud rechazada");
        }).catch(function (e) { aviso("No se pudo guardar: " + e.message); todos("button", caja).forEach(function (x) { x.disabled = false; }); });
      });
    });
  }

  function pintarLista() {
    var q = $("buscar").value.trim().toLowerCase();
    var lista = E.invitados.filter(function (i) {
      var t = tipo(i);
      if (q && i.nombre.toLowerCase().indexOf(q) === -1) return false;
      if (filtro === "sinEnviar") return t === "sinEnviar";
      if (filtro === "pendientes") return t !== "si" && t !== "no";
      if (filtro === "si") return t === "si";
      if (filtro === "no") return t === "no";
      if (filtro === "alertas") return !!i.alertas;
      return true;
    });
    $("vacio").hidden = E.invitados.length > 0;
    $("lista").innerHTML = lista.map(function (i) {
      var t = tipo(i), sol = (i.solicitud || "").indexOf("Pendiente") !== -1;
      return '<div class="invitado" data-codigo="' + esc(i.codigo) + '">' +
        '<div class="inv-fila" data-abrir><div><div class="inv-nombre">' + esc(i.nombre) + "</div>" +
        '<div class="inv-sub"><span>' + i.pases + (i.pases == 1 ? " lugar" : " lugares") + "</span>" +
        '<span class="chip ' + t + '">' + etiquetas[t] + (t === "si" && i.asistiran !== "" ? " · " + i.asistiran : "") + "</span>" +
        (sol ? '<span class="chip solicitud">🙋 Pide ' + i.extra + " más</span>" : "") + "</div></div>" +
        '<a class="btn-wa' + (t === "sinEnviar" ? "" : " reenviar") + '" target="_blank" rel="noopener" data-enviar href="' + esc(enlaceWA(i.telefono, mensajeDe(i))) + '">' +
        (t === "sinEnviar" ? "📲 Enviar" : "Reenviar") + "</a></div>" +
        (i.alertas ? '<div class="inv-alerta">' + esc(i.alertas) + "</div>" : "") +
        '<div class="inv-detalle"' + (abiertos[i.codigo] ? "" : " hidden") + ">" +
        (i.quien ? "<div><b>Confirmó:</b> " + esc(i.quien) + "</div>" : "") +
        (i.acompanantes ? "<div><b>Acompañantes:</b> " + esc(i.acompanantes) + "</div>" : "") +
        (i.mensaje ? "<div><b>Mensaje:</b> “" + esc(i.mensaje) + "”</div>" : "") +
        "<div><b>WhatsApp:</b> " + (i.telefono ? esc(i.telefono) : "sin número (podrás elegir el contacto)") + "</div>" +
        (i.aperturas ? "<div><b>La abrió:</b> " + i.aperturas + " vez/veces en " + i.dispositivos + " dispositivo(s)</div>" : "") +
        '<div class="acciones"><button type="button" class="btn-linea" data-editar>✏️ Editar</button>' +
        '<button type="button" class="btn-linea" data-copiar>🔗 Copiar enlace</button></div></div></div>';
    }).join("") || (E.invitados.length ? '<p class="vacio">Ningún invitado coincide.</p>' : "");

    todos("#lista .invitado").forEach(function (el) {
      var codigo = el.dataset.codigo, inv = E.invitados.find(function (x) { return x.codigo === codigo; });
      el.querySelector("[data-abrir]").addEventListener("click", function (ev) {
        if (ev.target.closest("[data-enviar]")) return;
        abiertos[codigo] = !abiertos[codigo]; el.querySelector(".inv-detalle").hidden = !abiertos[codigo];
      });
      el.querySelector("[data-enviar]").addEventListener("click", function () { marcarEnviada(inv); });
      el.querySelector("[data-editar]").addEventListener("click", function () { abrirFormulario(inv); });
      el.querySelector("[data-copiar]").addEventListener("click", function () {
        (navigator.clipboard ? navigator.clipboard.writeText(inv.enlace) : Promise.reject()).then(function () { aviso("Enlace copiado"); })
          .catch(function () { prompt("Copia el enlace:", inv.enlace); });
      });
    });
  }

  function marcarEnviada(inv) {
    if (inv.enviada) return;
    inv.enviada = new Date().toISOString();
    if (inv.estado.indexOf("Sin abrir") !== -1) inv.estado = "📤 Enviada";
    setTimeout(pintar, 400);
    accion({ accion: "panelEnviada", codigo: inv.codigo }).then(function (r) { reemplazar(r.invitado); }).catch(function () {});
  }

  /* ---------- Formulario de invitado ---------- */
  var editando = null, pases = 1;
  function abrirFormulario(inv) {
    editando = inv || null; pases = inv ? inv.pases : 1;
    $("tituloModal").textContent = inv ? "Editar invitado" : "Agregar invitado";
    $("fNombre").value = inv ? inv.nombre : ""; $("fTelefono").value = inv ? inv.telefono : "";
    $("fPases").textContent = pases; $("fError").hidden = true; $("fBorrar").hidden = !inv;
    $("modalInvitado").hidden = false; setTimeout(function () { $("fNombre").focus(); }, 50);
  }
  function cerrarFormulario() { $("modalInvitado").hidden = true; }

  /* ---------- Envío uno por uno ---------- */
  var cola = [], pos = 0;
  function iniciarEnvio() {
    cola = E.invitados.filter(function (i) { return tipo(i) === "sinEnviar"; }); pos = 0;
    if (!cola.length) return aviso("Ya enviaste todas 🎉");
    mostrarEnvio(); $("modalEnvio").hidden = false;
  }
  function mostrarEnvio() {
    if (pos >= cola.length) { $("modalEnvio").hidden = true; pintar(); return aviso("¡Listo! Terminaste de enviar 🎉"); }
    var i = cola[pos], texto = mensajeDe(i);
    $("envioProgreso").textContent = (pos + 1) + " de " + cola.length;
    $("envioNombre").textContent = i.nombre;
    $("envioDetalle").textContent = i.pases + (i.pases == 1 ? " lugar" : " lugares") + (i.telefono ? " · " + i.telefono : " · sin número: WhatsApp te pedirá elegir el contacto");
    $("envioMensaje").textContent = texto;
    $("envioAbrir").href = enlaceWA(i.telefono, texto);
  }

  /* ---------- Cargar ---------- */
  function cargar(silencioso) {
    if (!silencioso) $("btnRecargar").classList.add("girando");
    var p = demo ? Promise.resolve(datosDemo()) : llamar({ accion: "panel", cl: cliente, k: clave });
    return p.then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.error) || "Error");
      E = r;
      if (!silencioso || document.activeElement !== $("mensaje")) $("mensaje").value = E.mensaje || "";
      if (!silencioso || document.activeElement !== $("correo")) $("correo").value = E.correo || "";
      pintar();
      document.body.classList.remove("cargando");
    }).catch(function (e) {
      if (document.body.classList.contains("cargando")) { document.body.classList.remove("cargando"); $("pantallaError").hidden = false; }
      else if (!silencioso) aviso("No se pudo actualizar: " + e.message);
    }).finally(function () { $("btnRecargar").classList.remove("girando"); });
  }

  /* ---------- Demostración ---------- */
  var demoDatos = null;
  function datosDemo() {
    if (!demoDatos) {
      var base = location.href.replace(/panel\.html.*$/, "");
      var mk = function (codigo, nombre, pases, tel, estado, extra) {
        return Object.assign({ codigo: codigo, nombre: nombre, pases: pases, telefono: tel, enlace: base + "?i=" + codigo, estado: estado, asistiran: "",
          quien: "", acompanantes: "", mensaje: "", dispositivos: 0, aperturas: 0, alertas: "", ultima: "", extra: 0, solicitud: "", enviada: "" }, extra || {});
      };
      demoDatos = { ok: true, codigo: "DEMO", pareja: "Laura & Carlos", novia: "Laura", novio: "Carlos", fecha: "2027-05-15", correo: "",
        mensaje: "¡Hola {nombre}! 💌 {pareja} te compartimos con mucha ilusión nuestra invitación de boda. Reservamos {pases} lugar(es) para ti: {enlace}",
        base: base, invitados: [
          mk("A1B2C", "Familia Pérez", 4, "525512345678", "✅ Asistirá", { asistiran: 4, quien: "Juan Pérez", acompanantes: "Ana, Luis, Sofía", mensaje: "¡Felicidades!", enviada: "x", aperturas: 2, dispositivos: 1 }),
          mk("D3E4F", "Ana López", 2, "525598765432", "✅ Asistirá", { asistiran: 2, quien: "Carlos Ruiz", acompanantes: "Pedro, Mariana, Lucía", extra: 2, solicitud: "⏳ Pendiente", enviada: "x",
            alertas: "🟠 Compartida: se abrió en 2 dispositivos\n🔴 Confirmó otra persona: \"Carlos Ruiz\"\n🟡 Pide 2 lugar(es) extra: esperando respuesta de la pareja" }),
          mk("G5H6J", "Tíos Ramírez", 2, "525511112222", "❌ No asistirá", { asistiran: 0, quien: "Rosa Ramírez", enviada: "x" }),
          mk("K7L8M", "Mariana Torres", 1, "525533334444", "👀 Abierta", { enviada: "x", aperturas: 1, dispositivos: 1 }),
          mk("N9P2Q", "Familia Gómez", 3, "5544445555", "⏳ Sin abrir"),
          mk("R3S4T", "Daniel y Paola", 2, "", "⏳ Sin abrir")
        ] };
    }
    return JSON.parse(JSON.stringify(demoDatos));
  }
  function demoAccion(d) {
    var L = demoDatos.invitados, inv = L.find(function (x) { return x.codigo === d.codigo; });
    if (d.accion === "panelGuardar") {
      if (!inv) { inv = datosDemo().invitados[4]; inv.codigo = "N" + Math.random().toString(36).slice(2, 6).toUpperCase(); inv.enlace = demoDatos.base + "?i=" + inv.codigo; inv.estado = "⏳ Sin abrir"; L.push(inv); }
      inv.nombre = d.nombre; inv.pases = d.pases; inv.telefono = String(d.telefono || "").replace(/\D/g, "");
    } else if (d.accion === "panelBorrar") { demoDatos.invitados = L.filter(function (x) { return x !== inv; }); return { ok: true }; }
    else if (d.accion === "panelSolicitud") { if (d.decision === "aprobar") { inv.pases += inv.extra; inv.asistiran = inv.pases; } inv.solicitud = d.decision === "aprobar" ? "✅ Aprobada" : "❌ Rechazada"; inv.alertas = inv.alertas.replace(/\n?🟡[^\n]*/, ""); }
    else if (d.accion === "panelEnviada") { inv.enviada = "x"; if (inv.estado.indexOf("Sin abrir") !== -1) inv.estado = "📤 Enviada"; }
    else if (d.accion === "panelMensaje") { demoDatos.mensaje = d.mensaje; return { ok: true }; }
    else if (d.accion === "panelCorreo") { demoDatos.correo = d.correo; return { ok: true }; }
    return { ok: true, invitado: JSON.parse(JSON.stringify(inv)) };
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (demo) $("demoAviso").hidden = false;
    $("btnRecargar").addEventListener("click", function () { cargar(false); });
    $("buscar").addEventListener("input", pintarLista);
    todos(".filtro").forEach(function (b) {
      b.addEventListener("click", function () {
        filtro = b.dataset.filtro;
        todos(".filtro").forEach(function (x) { x.classList.toggle("activo", x === b); });
        pintarLista();
      });
    });
    $("btnAgregar").addEventListener("click", function () { abrirFormulario(null); });
    $("fMenos").addEventListener("click", function () { pases = Math.max(1, pases - 1); $("fPases").textContent = pases; });
    $("fMas").addEventListener("click", function () { pases = Math.min(50, pases + 1); $("fPases").textContent = pases; });
    $("fCancelar").addEventListener("click", cerrarFormulario);
    $("modalInvitado").addEventListener("click", function (e) { if (e.target === this) cerrarFormulario(); });
    $("formInvitado").addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = $("fNombre").value.trim(), tel = $("fTelefono").value.trim(), dig = tel.replace(/\D/g, "");
      if (nombre.length < 2) { $("fError").hidden = false; $("fError").textContent = "Escribe el nombre del invitado."; return; }
      if (tel && dig.length < 10) { $("fError").hidden = false; $("fError").textContent = "El WhatsApp debe tener al menos 10 dígitos."; return; }
      var btn = $("fGuardar"); btn.disabled = true; btn.textContent = "Guardando…";
      accion({ accion: "panelGuardar", codigo: editando ? editando.codigo : "", nombre: nombre, pases: pases, telefono: tel }).then(function (r) {
        reemplazar(r.invitado); cerrarFormulario(); pintar(); aviso(editando ? "Invitado actualizado" : "Invitado agregado");
      }).catch(function (err) { $("fError").hidden = false; $("fError").textContent = "No se pudo guardar: " + err.message; })
        .finally(function () { btn.disabled = false; btn.textContent = "Guardar"; });
    });
    $("fBorrar").addEventListener("click", function () {
      if (!editando || !confirm("¿Eliminar a " + editando.nombre + "? Su enlace dejará de funcionar.")) return;
      var cod = editando.codigo;
      accion({ accion: "panelBorrar", codigo: cod }).then(function () {
        E.invitados = E.invitados.filter(function (x) { return x.codigo !== cod; }); cerrarFormulario(); pintar(); aviso("Invitado eliminado");
      }).catch(function (err) { aviso("No se pudo eliminar: " + err.message); });
    });

    $("btnEnviarPendientes").addEventListener("click", iniciarEnvio);
    $("envioAbrir").addEventListener("click", function () { var i = cola[pos]; if (i) marcarEnviada(i); });
    $("envioSiguiente").addEventListener("click", function () { pos++; mostrarEnvio(); });
    $("envioSaltar").addEventListener("click", function () { pos++; mostrarEnvio(); });
    $("envioCerrar").addEventListener("click", function () { $("modalEnvio").hidden = true; pintar(); });

    $("guardarMensaje").addEventListener("click", function () {
      var m = $("mensaje").value.trim();
      if (m.indexOf("{enlace}") === -1) return aviso("El mensaje debe incluir {enlace} para que llegue la invitación.");
      accion({ accion: "panelMensaje", mensaje: m }).then(function () { E.mensaje = m; pintar(); aviso("Mensaje guardado"); })
        .catch(function (e) { aviso("No se pudo guardar: " + e.message); });
    });
    $("guardarCorreo").addEventListener("click", function () {
      var c = $("correo").value.trim();
      accion({ accion: "panelCorreo", correo: c }).then(function () { E.correo = c; aviso(c ? "Les avisaremos a " + c : "Avisos por correo desactivados"); })
        .catch(function (e) { aviso("No se pudo guardar: " + e.message); });
    });

    cargar(false);
    // Se actualiza solo cada minuto mientras está abierto
    setInterval(function () {
      if (document.visibilityState === "visible" && $("modalInvitado").hidden && $("modalEnvio").hidden) cargar(true);
    }, 60000);
  });
})();
