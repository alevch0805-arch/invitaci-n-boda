(function () {
  "use strict";
  var C = window.CONFIG;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Utilidades ---------- */
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function texto(id, t) { var el = $(id); if (el) el.textContent = t; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // Identificador anónimo de este dispositivo (para saber si el enlace se abrió en varios)
  function idDispositivo() {
    var id = leer("boda_dispositivo");
    if (!id) {
      id = "D-" + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();
      guardar("boda_dispositivo", id);
    }
    return id;
  }
  function descripcionEquipo() {
    var ua = navigator.userAgent, so = "Otro", nav = "Navegador";
    if (/iPhone/.test(ua)) so = "iPhone"; else if (/iPad/.test(ua)) so = "iPad";
    else if (/Android/.test(ua)) so = "Android"; else if (/Windows/.test(ua)) so = "Windows";
    else if (/Mac OS/.test(ua)) so = "Mac";
    if (/WhatsApp/i.test(ua)) nav = "WhatsApp"; else if (/Instagram/i.test(ua)) nav = "Instagram";
    else if (/FBAN|FBAV/i.test(ua)) nav = "Facebook"; else if (/Edg\//.test(ua)) nav = "Edge";
    else if (/Chrome\//.test(ua)) nav = "Chrome"; else if (/Safari\//.test(ua)) nav = "Safari";
    else if (/Firefox\//.test(ua)) nav = "Firefox";
    return so + " · " + nav;
  }

  // Llamada a Google Apps Script (JSONP: funciona sin problemas de CORS)
  function llamar(params) {
    return new Promise(function (ok, falla) {
      var cb = "cb_" + Math.random().toString(36).slice(2);
      var s = document.createElement("script");
      var t = setTimeout(function () { limpiar(); falla(new Error("Tiempo agotado")); }, 15000);
      function limpiar() { clearTimeout(t); delete window[cb]; s.remove(); }
      window[cb] = function (r) { limpiar(); ok(r); };
      params.callback = cb;
      params._ = Date.now();
      s.src = C.urlHojaDeCalculo + "?" + Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }).join("&");
      s.onerror = function () { limpiar(); falla(new Error("Sin conexión")); };
      document.body.appendChild(s);
    });
  }

  var codigo = (new URLSearchParams(location.search).get("i") || "").trim().toUpperCase();
  var dispositivo = idDispositivo();
  var demo = !C.urlHojaDeCalculo;
  var invitado = { nombre: "", pases: 0 }; // pases 0 = sin límite conocido

  /* ---------- Llenar contenido estático ---------- */
  function pintarContenido() {
    texto("nombreNovia", C.novia);
    texto("nombreNovio", C.novio);
    texto("selloIniciales", C.iniciales.replace(/\s/g, ""));
    texto("fechaHero", C.fechaTexto);
    texto("fraseFoto1", C.fraseFoto1);
    texto("fraseFoto2", C.fraseFoto2);
    texto("fraseCierre", C.fraseCierre);
    texto("inicialesCierre", C.iniciales);
    texto("fechaCierre", C.fechaTexto);
    texto("fechaLimite", C.fechaLimiteConfirmacion);
    document.title = C.novia + " & " + C.novio + " · Nuestra boda";

    var iconos = {
      anillos: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M8 6l1-2h0l1 2"/>',
      copas: '<path d="M6 3h5l-.5 5a2 2 0 0 1-4 0z"/><path d="M8.5 10v8M6 18h5"/><path d="M13 3h5l-.5 5a2 2 0 0 1-4 0z"/><path d="M15.5 10v8M13 18h5"/>',
      cena: '<path d="M4 3v7a2 2 0 0 0 4 0V3M6 3v18"/><path d="M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>',
      musica: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
      iglesia: '<path d="M12 2v4M10 4h4"/><path d="M6 21V11l6-5 6 5v10z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
      fiesta: '<path d="M4 20l5-14 9 9z"/><path d="M14 4l1 2M19 8l2-1M17 3l-1 2"/>'
    };
    function svg(n) { return '<svg viewBox="0 0 24 24" class="icono">' + (iconos[n] || iconos.anillos) + "</svg>"; }

    $("lugares").innerHTML = [[C.ceremonia, "iglesia"], [C.recepcion, "fiesta"]].map(function (p) {
      var l = p[0];
      return '<article class="lugar">' + svg(p[1]) +
        "<h3>" + esc(l.titulo) + '</h3><p class="hora">' + esc(l.hora) + "</p>" +
        '<p class="nombre-lugar">' + esc(l.lugar) + '</p><p class="dir">' + esc(l.direccion) + "</p>" +
        (l.mapa ? '<a class="btn-linea" target="_blank" rel="noopener" href="' + esc(l.mapa) + '">Cómo llegar</a>' : "") +
        "</article>";
    }).join("");

    $("itinerario").innerHTML = C.itinerario.map(function (i) {
      return '<li><span class="h">' + esc(i.hora) + '</span><span class="ic">' + svg(i.icono).replace(' class="icono"', "") +
        '</span><span class="e">' + esc(i.evento) + "</span></li>";
    }).join("");

    texto("vestTipo", C.vestimenta.tipo);
    texto("vestDetalle", C.vestimenta.detalle);
    $("vestColores").innerHTML = (C.vestimenta.colores || []).map(function (c) {
      return '<span style="background:' + esc(c) + '"></span>';
    }).join("");

    if (!C.regalos || !C.regalos.length) { $("seccionRegalos").hidden = true; }
    else {
      texto("regalosTexto", C.regalosTexto);
      $("regalos").innerHTML = C.regalos.map(function (r) {
        return '<div class="regalo"><h3>' + esc(r.titulo) + "</h3><p>" + esc(r.detalle) + "</p>" +
          (r.enlace ? '<a class="btn-linea" target="_blank" rel="noopener" href="' + esc(r.enlace) + '">Ver</a>' : "") + "</div>";
      }).join("");
    }

    // Calendario
    var ini = new Date(C.fechaBoda), fin = new Date(ini.getTime() + 8 * 3600e3);
    var f = function (d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    $("btnCalendario").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("Boda " + C.novia + " & " + C.novio) +
      "&dates=" + f(ini) + "/" + f(fin) +
      "&location=" + encodeURIComponent(C.ceremonia.lugar + ", " + C.ceremonia.direccion);

    // Fotos: si no existen, mostrar espacio reservado
    document.querySelectorAll(".foto").forEach(function (img) {
      function vacia() { img.parentNode.classList.add("sin-foto"); }
      if (img.complete && !img.naturalWidth) vacia();
      img.addEventListener("error", vacia);
    });
  }

  /* ---------- Cuenta regresiva ---------- */
  function cuenta() {
    var d = Math.max(0, new Date(C.fechaBoda) - new Date());
    var p = function (n) { return String(n).padStart(2, "0"); };
    texto("cDias", p(Math.floor(d / 864e5)));
    texto("cHoras", p(Math.floor(d / 36e5) % 24));
    texto("cMin", p(Math.floor(d / 6e4) % 60));
    texto("cSeg", p(Math.floor(d / 1e3) % 60));
  }

  /* ---------- Datos del invitado ---------- */
  function pintarInvitado() {
    var n = invitado.nombre;
    texto("sobreNombre", n || "Querido invitado");
    texto("saludo", n ? n : "Con mucho cariño");
    if (invitado.pases) {
      var t = invitado.pases === 1 ? "Hemos reservado 1 lugar para ti" : "Hemos reservado " + invitado.pases + " lugares para ustedes";
      texto("pasesHero", t);
      texto("reservados", t);
    }
    actualizarContador();
  }

  /* ---------- Formulario ---------- */
  var cantidad = 1;
  function maximo() {
    if (invitado.pases && C.modoPasesExtra === "bloquear") return invitado.pases;
    return invitado.pases ? invitado.pases + 5 : 10;
  }
  function actualizarContador() {
    cantidad = Math.min(Math.max(1, cantidad), maximo());
    $("fCantidad").textContent = cantidad;
    $("menos").disabled = cantidad <= 1;
    $("mas").disabled = cantidad >= maximo();
    var aviso = $("avisoPases");
    if (invitado.pases && cantidad > invitado.pases) {
      aviso.hidden = false;
      aviso.textContent = "Tu invitación incluye " + invitado.pases + (invitado.pases === 1 ? " lugar" : " lugares") +
        ". Enviaremos tu solicitud a los novios para que la revisen.";
    } else aviso.hidden = true;

    var cont = $("acompanantes"), actuales = cont.querySelectorAll("input");
    var valores = Array.prototype.map.call(actuales, function (i) { return i.value; });
    cont.innerHTML = "";
    for (var i = 1; i < cantidad; i++) {
      var inp = document.createElement("input");
      inp.type = "text"; inp.placeholder = "Nombre del acompañante " + i; inp.value = valores[i - 1] || "";
      inp.setAttribute("aria-label", "Nombre del acompañante " + i);
      cont.appendChild(inp);
    }
  }

  function enviar(e) {
    e.preventDefault();
    var quien = $("fQuien").value.trim();
    var asiste = document.querySelector("input[name=asiste]:checked").value;
    var err = $("error");
    if (quien.length < 3) { err.hidden = false; err.textContent = "Por favor escribe tu nombre completo."; $("fQuien").focus(); return; }
    err.hidden = true;

    var acomp = Array.prototype.map.call($("acompanantes").querySelectorAll("input"), function (i) { return i.value.trim(); }).filter(Boolean);
    var datos = {
      accion: "confirmar", codigo: codigo, dispositivo: dispositivo, equipo: descripcionEquipo(),
      quien: quien, asiste: asiste, cantidad: asiste === "si" ? cantidad : 0,
      acompanantes: asiste === "si" ? acomp.join(", ") : "", mensaje: $("fMensaje").value.trim()
    };

    var btn = $("btnEnviar"); btn.disabled = true; btn.textContent = "Enviando…";
    var p = demo ? new Promise(function (r) { setTimeout(function () { console.log("DEMO — se enviaría:", datos); r({ ok: true }); }, 600); }) : llamar(datos);
    p.then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.error) || "Error");
      guardar("boda_respuesta_" + codigo, JSON.stringify(datos));
      mostrarGracias(datos);
    }).catch(function () {
      err.hidden = false; err.textContent = "No pudimos enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.";
    }).finally(function () { btn.disabled = false; btn.textContent = "Confirmar"; });
  }

  function mostrarGracias(d) {
    $("formRsvp").hidden = true; $("gracias").hidden = false;
    if (d.asiste === "si") {
      texto("graciasTitulo", "¡Gracias!");
      texto("graciasTexto", "Confirmaste " + d.cantidad + (d.cantidad == 1 ? " lugar" : " lugares") + ". ¡Nos vemos en la boda!");
    } else {
      texto("graciasTitulo", "Te extrañaremos");
      texto("graciasTexto", "Gracias por avisarnos. Te llevaremos en el corazón ese día.");
    }
  }

  /* ---------- Sobre y música ---------- */
  function abrirSobre() {
    var s = $("sobre");
    if (s.classList.contains("abriendo")) return;
    s.classList.add("abriendo");
    setTimeout(function () { s.classList.add("abierto"); document.body.classList.remove("bloqueado"); }, 900);
    if (C.musica) { var a = $("audio"); a.play().then(function () { $("btnMusica").classList.add("sonando"); }).catch(function () {}); }
  }

  function iniciar() {
    document.body.classList.add("bloqueado");
    pintarContenido();
    cuenta(); setInterval(cuenta, 1000);

    $("sobre").addEventListener("click", abrirSobre);
    $("sobre").addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirSobre(); } });

    if (C.musica) {
      var a = $("audio"), b = $("btnMusica");
      a.src = C.musica; b.hidden = false;
      b.addEventListener("click", function () {
        if (a.paused) { a.play(); b.classList.add("sonando"); } else { a.pause(); b.classList.remove("sonando"); }
      });
    }

    $("menos").addEventListener("click", function () { cantidad--; actualizarContador(); });
    $("mas").addEventListener("click", function () { cantidad++; actualizarContador(); });
    document.querySelectorAll("input[name=asiste]").forEach(function (r) {
      r.addEventListener("change", function () { $("bloqueAsistentes").hidden = r.value === "no" && r.checked; });
    });
    $("formRsvp").addEventListener("submit", enviar);
    $("btnEditar").addEventListener("click", function () { $("gracias").hidden = true; $("formRsvp").hidden = false; });

    var previa = leer("boda_respuesta_" + codigo);
    if (previa) { try { mostrarGracias(JSON.parse(previa)); } catch (e) {} }

    // Animación al hacer scroll
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("visible"); io.unobserve(x.target); } });
      }, { threshold: 0.15 });
      document.querySelectorAll(".revelar").forEach(function (el) { io.observe(el); });
    } else document.querySelectorAll(".revelar").forEach(function (el) { el.classList.add("visible"); });

    // Cargar datos del invitado y registrar la apertura
    if (demo) {
      $("demo").hidden = false;
      invitado = { nombre: "Familia Ejemplo", pases: 4 };
      pintarInvitado();
    } else {
      pintarInvitado();
      llamar({ accion: "abrir", codigo: codigo, dispositivo: dispositivo, equipo: descripcionEquipo() })
        .then(function (r) {
          if (r && r.ok && r.nombre) { invitado = { nombre: r.nombre, pases: Number(r.pases) || 0 }; pintarInvitado(); }
        }).catch(function () {});
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
