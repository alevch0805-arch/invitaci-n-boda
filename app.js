(function () {
  "use strict";
  var C = window.CONFIG, O = window.OPCIONES;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Utilidades ---------- */
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function texto(id, t) { var el = $(id); if (el) el.textContent = t == null ? "" : t; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mezclar(base, extra) {
    var r = JSON.parse(JSON.stringify(base));
    Object.keys(extra || {}).forEach(function (k) {
      var v = extra[k];
      if (v && typeof v === "object" && !Array.isArray(v) && r[k] && typeof r[k] === "object" && !Array.isArray(r[k])) r[k] = mezclar(r[k], v);
      else if (v !== undefined && v !== null) r[k] = v;
    });
    return r;
  }
  function hora12(h) {
    if (!h || !/^\d{1,2}:\d{2}/.test(h)) return h || "";
    var p = h.split(":"), n = +p[0], s = n >= 12 ? "PM" : "AM";
    return ((n % 12) || 12) + ":" + p[1] + " " + s;
  }
  function fechaLarga(f) {
    if (!f) return "";
    var d = new Date(f + "T12:00");
    if (isNaN(d)) return f;
    var t = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(",", "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function fechaCorta(f) {
    if (!f) return "";
    var d = new Date(f + "T12:00");
    return isNaN(d) ? f : d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  }
  function iniciales(d) { return ((d.novia || " ").trim().charAt(0) + " & " + (d.novio || " ").trim().charAt(0)).toUpperCase(); }

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

  // Llamada a Google Apps Script (JSONP)
  function llamar(params) {
    return new Promise(function (ok, falla) {
      var cb = "cb_" + Math.random().toString(36).slice(2);
      var s = document.createElement("script");
      var t = setTimeout(function () { limpiar(); falla(new Error("Tiempo agotado")); }, 15000);
      function limpiar() { clearTimeout(t); delete window[cb]; s.remove(); }
      window[cb] = function (r) { limpiar(); ok(r); };
      params.callback = cb; params._ = Date.now();
      s.src = C.urlHojaDeCalculo + "?" + Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
      }).join("&");
      s.onerror = function () { limpiar(); falla(new Error("Sin conexión")); };
      document.body.appendChild(s);
    });
  }

  var url = new URLSearchParams(location.search);
  var codigo = (url.get("i") || "").trim().toUpperCase();
  var codigoCliente = (url.get("c") || "").trim().toUpperCase();
  var preview = url.get("preview") === "1";
  var demo = !C.urlHojaDeCalculo;
  var dispositivo = idDispositivo();
  var invitado = { nombre: "", pases: 0 };
  var D = C.datos, Z = C.diseno; // datos y diseño actuales

  /* ---------- Diseño ---------- */
  function aplicarDiseno(z) {
    var root = document.documentElement.style, b = document.body;
    var pal = (O.paletas[z.paleta] || O.paletas.tierra).colores;
    var col = mezclar(pal, z.colores || {});
    var mapa = { fondo: "--blanco", secundario: "--beige", verde: "--salvia", rosa: "--rosa", acento: "--terracota", texto: "--moca", dorado: "--dorado" };
    Object.keys(mapa).forEach(function (k) { if (col[k]) root.setProperty(mapa[k], col[k]); });
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = col.fondo;

    var t = O.tipografias[z.tipografia] || O.tipografias.clasica;
    var href = "https://fonts.googleapis.com/css2?family=" + t.url + "&display=swap";
    if ($("fuentes").getAttribute("href") !== href) $("fuentes").setAttribute("href", href);
    root.setProperty("--serif", '"' + t.titulo + '", Georgia, serif');
    root.setProperty("--script", '"' + t.script + '", cursive');
    root.setProperty("--sans", '"' + t.texto + '", system-ui, sans-serif');

    b.setAttribute("data-fondo", z.fondo || "liso");
    b.setAttribute("data-deco", z.decoracion || "eucalipto");
    document.querySelectorAll(".ramita use").forEach(function (u) { u.setAttribute("href", "#deco-" + (z.decoracion || "eucalipto")); });

    $("marco1").className = "marco forma-" + (z.marcoFoto1 || "arco");
    $("marco2").className = "marco forma-" + (z.marcoFoto2 || "circulo");
    pintarFotos();

    var s = $("sobre");
    s.classList.toggle("estilo-cortina", z.portada === "cortina");
    if (z.portada === "directo" && !preview) { s.classList.add("abierto"); b.classList.remove("bloqueado"); }
    if (z.portada === "directo" && preview) { s.classList.add("abriendo", "abierto"); b.classList.remove("bloqueado"); }
  }

  /* ---------- Contenido ---------- */
  var iconos = {
    anillos: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M8 6l1-2h0l1 2"/>',
    copas: '<path d="M6 3h5l-.5 5a2 2 0 0 1-4 0z"/><path d="M8.5 10v8M6 18h5"/><path d="M13 3h5l-.5 5a2 2 0 0 1-4 0z"/><path d="M15.5 10v8M13 18h5"/>',
    cena: '<path d="M4 3v7a2 2 0 0 0 4 0V3M6 3v18"/><path d="M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>',
    musica: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    iglesia: '<path d="M12 2v4M10 4h4"/><path d="M6 21V11l6-5 6 5v10z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
    fiesta: '<path d="M4 20l5-14 9 9z"/><path d="M14 4l1 2M19 8l2-1M17 3l-1 2"/>',
    pastel: '<path d="M4 21h16M5 21v-6h14v6M7 15v-4h10v4"/><path d="M12 11V8M12 5.5a1 1 0 0 1 0 0"/>',
    foto: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/>',
    luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'
  };
  function svg(n, cls) { return '<svg viewBox="0 0 24 24"' + (cls ? ' class="' + cls + '"' : "") + ">" + (iconos[n] || iconos.anillos) + "</svg>"; }

  function pintarFotos() {
    [["foto1", "marco1", "secFoto1"], ["foto2", "marco2", "secFoto2"]].forEach(function (f) {
      var src = D[f[0]], img = $(f[0]), marco = $(f[1]);
      if (src) {
        marco.classList.remove("sin-foto"); $(f[2]).querySelector(".marco").hidden = false;
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        img.onerror = function () { marco.classList.add("sin-foto"); };
      } else {
        img.removeAttribute("src");
        marco.classList.add("sin-foto");
        marco.hidden = !(preview || demo); // invitación real sin foto: se oculta el marco
      }
    });
  }

  function pintarContenido() {
    var d = D, ini = iniciales(d);
    texto("nombreNovia", d.novia); texto("nombreNovio", d.novio);
    texto("selloIniciales", ini.replace(/\s/g, "")); texto("cortinaIniciales", ini.replace(/\s/g, ""));
    texto("fechaHero", fechaLarga(d.fecha));
    texto("fraseFoto1", d.fraseFoto1); texto("fraseFoto2", d.fraseFoto2); texto("fraseCierre", d.fraseCierre);
    texto("inicialesCierre", ini); texto("fechaCierre", fechaLarga(d.fecha));
    texto("fechaLimite", fechaCorta(d.fechaLimite));
    document.title = (d.novia || "") + " & " + (d.novio || "") + " · Nuestra boda";

    $("lugares").innerHTML = [[d.ceremonia, "Ceremonia", "iglesia"], [d.recepcion, "Recepción", "fiesta"]].filter(function (p) {
      return p[0] && (p[0].lugar || p[0].direccion);
    }).map(function (p) {
      var l = p[0];
      var mapa = l.mapa || (l.direccion ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((l.lugar || "") + " " + l.direccion) : "");
      return '<article class="lugar">' + svg(p[2], "icono") +
        "<h3>" + p[1] + '</h3><p class="hora">' + esc(hora12(l.hora)) + "</p>" +
        '<p class="nombre-lugar">' + esc(l.lugar) + '</p><p class="dir">' + esc(l.direccion) + "</p>" +
        (mapa ? '<a class="btn-linea" target="_blank" rel="noopener" href="' + esc(mapa) + '">Cómo llegar</a>' : "") + "</article>";
    }).join("");

    var it = (d.itinerario || []).filter(function (i) { return i.evento; });
    $("secItinerario").hidden = !it.length;
    $("itinerario").innerHTML = it.map(function (i) {
      return '<li><span class="h">' + esc(hora12(i.hora)) + '</span><span class="ic">' + svg(i.icono) +
        '</span><span class="e">' + esc(i.evento) + "</span></li>";
    }).join("");

    var v = d.vestimenta || {};
    $("secVestimenta").hidden = !(v.tipo || v.detalle);
    texto("vestTipo", v.tipo); texto("vestDetalle", v.detalle);

    var rg = (d.regalos || []).filter(function (r) { return r.titulo || r.detalle; });
    $("seccionRegalos").hidden = !rg.length;
    texto("regalosTexto", d.regalosTexto);
    $("regalos").innerHTML = rg.map(function (r) {
      return '<div class="regalo"><h3>' + esc(r.titulo) + "</h3><p>" + esc(r.detalle) + "</p>" +
        (r.enlace ? '<a class="btn-linea" target="_blank" rel="noopener" href="' + esc(r.enlace) + '">Ver</a>' : "") + "</div>";
    }).join("");

    var inicio = fechaEvento(), fin = new Date(inicio.getTime() + 8 * 3600e3);
    var f = function (x) { return isNaN(x) ? "" : x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    $("btnCalendario").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("Boda " + d.novia + " & " + d.novio) + "&dates=" + f(inicio) + "/" + f(fin) +
      "&location=" + encodeURIComponent(((d.ceremonia || {}).lugar || "") + ", " + ((d.ceremonia || {}).direccion || ""));

    pintarFotos();
    if (d.musica) { $("audio").src = d.musica; $("btnMusica").hidden = false; }
  }

  function fechaEvento() { return new Date((D.fecha || "2030-01-01") + "T" + (((D.ceremonia || {}).hora) || "12:00")); }
  function cuenta() {
    var d = Math.max(0, fechaEvento() - new Date());
    if (isNaN(d)) d = 0;
    var p = function (n) { return String(n).padStart(2, "0"); };
    texto("cDias", p(Math.floor(d / 864e5))); texto("cHoras", p(Math.floor(d / 36e5) % 24));
    texto("cMin", p(Math.floor(d / 6e4) % 60)); texto("cSeg", p(Math.floor(d / 1e3) % 60));
  }

  /* ---------- Invitado ---------- */
  function pintarInvitado() {
    var n = invitado.nombre;
    texto("sobreNombre", n || "Querido invitado");
    texto("saludo", n || "Con mucho cariño");
    if (invitado.pases) {
      var t = invitado.pases === 1 ? "Hemos reservado 1 lugar para ti" : "Hemos reservado " + invitado.pases + " lugares para ustedes";
      texto("pasesHero", t); texto("reservados", t);
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
    $("menos").disabled = cantidad <= 1; $("mas").disabled = cantidad >= maximo();
    var aviso = $("avisoPases");
    if (invitado.pases && cantidad > invitado.pases) {
      aviso.hidden = false;
      aviso.textContent = "Tu invitación incluye " + invitado.pases + (invitado.pases === 1 ? " lugar" : " lugares") +
        ". Enviaremos tu solicitud a los novios para que la revisen.";
    } else aviso.hidden = true;
    var cont = $("acompanantes");
    var valores = Array.prototype.map.call(cont.querySelectorAll("input"), function (i) { return i.value; });
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
    if (preview) { err.hidden = false; err.textContent = "Vista previa: aquí tus invitados confirmarán su asistencia."; return; }
    if (quien.length < 3) { err.hidden = false; err.textContent = "Por favor escribe tu nombre completo."; $("fQuien").focus(); return; }
    err.hidden = true;
    var acomp = Array.prototype.map.call($("acompanantes").querySelectorAll("input"), function (i) { return i.value.trim(); }).filter(Boolean);
    var datos = {
      accion: "confirmar", codigo: codigo, cliente: codigoCliente, dispositivo: dispositivo, equipo: descripcionEquipo(),
      quien: quien, asiste: asiste, cantidad: asiste === "si" ? cantidad : 0,
      acompanantes: asiste === "si" ? acomp.join(", ") : "", mensaje: $("fMensaje").value.trim()
    };
    var btn = $("btnEnviar"); btn.disabled = true; btn.textContent = "Enviando…";
    var p = demo ? new Promise(function (r) { setTimeout(function () { r({ ok: true }); }, 600); }) : llamar(datos);
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

  /* ---------- Portada ---------- */
  function abrirSobre() {
    var s = $("sobre");
    if (s.classList.contains("abriendo")) return;
    s.classList.add("abriendo");
    setTimeout(function () { s.classList.add("abierto"); document.body.classList.remove("bloqueado"); }, s.classList.contains("estilo-cortina") ? 1300 : 900);
    if (D.musica) { $("audio").play().then(function () { $("btnMusica").classList.add("sonando"); }).catch(function () {}); }
  }
  function cerrarSobre() {
    var s = $("sobre");
    s.classList.remove("abriendo", "abierto");
    document.body.classList.add("bloqueado");
    window.scrollTo(0, 0);
  }

  function mostrar() {
    aplicarDiseno(Z); pintarContenido(); aplicarEspecial(Z.especial || {}); pintarInvitado(); cuenta();
    document.body.classList.remove("cargando");
  }

  /* ---------- Ajustes especiales (solo los pone el administrador) ---------- */
  var fuentesCargadas = {}, archivoFuente = { id: "", listo: false };
  function cargarGoogleFont(nombre) {
    if (!nombre || fuentesCargadas[nombre]) return;
    fuentesCargadas[nombre] = true;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(nombre).replace(/%20/g, "+") + ":wght@400;500;600&display=swap";
    l.onerror = function () { // algunas letras no tienen esos grosores
      l.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(nombre).replace(/%20/g, "+") + "&display=swap";
      l.onerror = null;
    };
    document.head.appendChild(l);
  }
  function cargarArchivoFuente(id) {
    if (!id || archivoFuente.id === id) return;
    archivoFuente = { id: id, listo: false };
    var desdeBase64 = function (b64) {
      var bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var ff = new FontFace("LetraPropia", bytes.buffer);
      return ff.load().then(function (f) { document.fonts.add(f); archivoFuente.listo = true; });
    };
    if (/^data:/.test(id)) { desdeBase64(id.split(",")[1]).catch(function () {}); return; } // modo demo
    if (!C.urlHojaDeCalculo || !window.FontFace) return;
    llamar({ accion: "fuente", id: id }).then(function (r) { if (r && r.ok) return desdeBase64(r.data); }).catch(function () {});
  }

  function aplicarEspecial(e) {
    var root = document.documentElement.style, b = document.body;
    var f = e.fuentes || {};
    if (e.archivoFuente && e.archivoFuente.id) cargarArchivoFuente(e.archivoFuente.id);
    var ranuras = { nombres: "--nombres", titulos: "--serif", manuscrita: "--script", textos: "--sans" };
    var respaldo = { nombres: "Georgia, serif", titulos: "Georgia, serif", manuscrita: "cursive", textos: "system-ui, sans-serif" };
    Object.keys(ranuras).forEach(function (k) {
      var r = f[k] || {};
      if (r.archivo && e.archivoFuente && e.archivoFuente.id) root.setProperty(ranuras[k], '"LetraPropia", ' + respaldo[k]);
      else if (r.google) { cargarGoogleFont(r.google); root.setProperty(ranuras[k], '"' + r.google.replace(/"/g, "") + '", ' + respaldo[k]); }
      else if (k === "nombres") root.removeProperty("--nombres");
    });

    var a = e.ajustes || {};
    root.setProperty("--k-nombres", (a.tamNombres || 100) / 100);
    root.setProperty("--k-titulos", (a.tamTitulos || 100) / 100);
    root.setProperty("--velo", ((100 - (a.textura == null ? 100 : a.textura)) / 100 * 0.9).toFixed(2));
    b.classList.toggle("nombres-normal", a.mayusculas === false);

    var d = e.deco || {};
    function img(sel, dato) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (dato && dato.url) { if (el.getAttribute("src") !== dato.url) el.src = dato.url; el.hidden = false; }
        else { el.hidden = true; el.removeAttribute("src"); }
      });
    }
    var pr = d.principal || {};
    img(".ramita-img", pr); b.classList.toggle("deco-propia", !!pr.url);
    root.setProperty("--deco-tam", Math.round(180 * (pr.tam || 100) / 100) + "px");
    root.setProperty("--deco-op", (pr.opacidad == null ? 100 : pr.opacidad) / 100);

    var es = d.esquinaSup || {}, ei = d.esquinaInf || {};
    img(".esquina.sup", es); img(".esquina.inf", ei);
    b.classList.toggle("esq-sup", !!es.url);
    root.setProperty("--esq-tam", Math.round(150 * ((es.tam || ei.tam || 100) / 100)) + "px");
    root.setProperty("--esq-op", ((es.opacidad == null ? 100 : es.opacidad)) / 100);

    var fo = d.fondo || {};
    if (fo.url) {
      root.setProperty("--fondo-img", 'url("' + fo.url + '")');
      root.setProperty("--fondo-op", (fo.opacidad == null ? 40 : fo.opacidad) / 100);
      root.setProperty("--fondo-tam", fo.modo === "repetir" ? "320px auto" : "cover");
      root.setProperty("--fondo-rep", fo.modo === "repetir" ? "repeat" : "no-repeat");
    } else root.setProperty("--fondo-img", "none");

    var mo = d.monograma || {};
    img(".mono", mo); b.classList.toggle("con-mono", !!mo.url);
    root.setProperty("--mono-tam", Math.round(120 * (mo.tam || 100) / 100) + "px");

    // Secciones extra
    ["inicio", "despues-foto1", "despues-itinerario", "antes-confirmacion", "antes-cierre"].forEach(function (pos) { $("extra-" + pos).innerHTML = ""; });
    (e.secciones || []).forEach(function (s, i) {
      var cont = $("extra-" + (s.posicion || "antes-confirmacion"));
      if (!cont || !(s.titulo || s.texto || (s.items || []).length || (s.imagenes || []).length || s.enlace)) return;
      if (s.tipo === "canva") { cont.insertAdjacentHTML("beforeend", seccionCanva(s, i)); return; }
      var html = '<section class="seccion extra revelar visible' + (s.fondoAlterno ? " beige" : "") + '" data-seccion="extra' + i + '">' +
        (s.titulo ? '<h2 class="titulo">' + esc(s.titulo) + "</h2>" : "");
      if (s.texto) html += '<p class="texto texto-extra">' + esc(s.texto) + "</p>";
      if (s.tipo === "lista" && (s.items || []).length) {
        html += '<ul class="lista-extra">' + s.items.filter(function (it) { return it.nombre; }).map(function (it) {
          return "<li><strong>" + esc(it.nombre) + "</strong>" + (it.rol ? "<span>" + esc(it.rol) + "</span>" : "") + "</li>";
        }).join("") + "</ul>";
      }
      if (s.tipo === "galeria" && (s.imagenes || []).length) {
        html += '<div class="galeria">' + s.imagenes.map(function (u) { return '<img src="' + esc(u) + '" alt="" loading="lazy" />'; }).join("") + "</div>";
      }
      cont.insertAdjacentHTML("beforeend", html + "</section>");
    });
  }

  /* Sección diseñada en Canva: imágenes exportadas o enlace vivo (Compartir → Insertar) */
  function seccionCanva(s, i) {
    var html = '<section class="seccion extra canva revelar visible' + (s.sinMargen !== false ? " sin-margen" : "") + (s.fondoAlterno ? " beige" : "") +
      '" data-seccion="extra' + i + '">' + (s.titulo ? '<h2 class="titulo">' + esc(s.titulo) + "</h2>" : "") +
      (s.texto ? '<p class="texto texto-extra">' + esc(s.texto) + "</p>" : "");
    if (s.modo === "enlace") {
      if (/^https:\/\/www\.canva\.com\/design\/[\w-]+(\/[\w-]+)?\/view\?embed$/.test(s.enlace || "")) {
        html += '<div class="canva-marco" style="padding-top:' + (Number(s.proporcion) || 177.78) + '%">' +
          '<iframe loading="lazy" src="' + esc(s.enlace) + '" allowfullscreen allow="fullscreen" title="' + esc(s.titulo || "Diseño") + '"></iframe></div>';
      }
    } else {
      html += '<div class="canva-imgs">' + (s.imagenes || []).map(function (u) { return '<img src="' + esc(u) + '" alt="" loading="lazy" />'; }).join("") + "</div>";
    }
    return html + "</section>";
  }

  /* ---------- Inicio ---------- */
  function iniciar() {
    document.body.classList.add("bloqueado");
    if (preview) document.body.classList.add("preview");
    setInterval(cuenta, 1000);

    $("sobre").addEventListener("click", abrirSobre);
    $("sobre").addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirSobre(); } });
    $("btnMusica").addEventListener("click", function () {
      var a = $("audio"), b = $("btnMusica");
      if (a.paused) { a.play(); b.classList.add("sonando"); } else { a.pause(); b.classList.remove("sonando"); }
    });
    $("menos").addEventListener("click", function () { cantidad--; actualizarContador(); });
    $("mas").addEventListener("click", function () { cantidad++; actualizarContador(); });
    document.querySelectorAll("input[name=asiste]").forEach(function (r) {
      r.addEventListener("change", function () { $("bloqueAsistentes").hidden = r.value === "no" && r.checked; });
    });
    $("formRsvp").addEventListener("submit", enviar);
    $("btnEditar").addEventListener("click", function () { $("gracias").hidden = true; $("formRsvp").hidden = false; });

    var previa = leer("boda_respuesta_" + codigo);
    if (previa && !preview) { try { mostrarGracias(JSON.parse(previa)); } catch (e) {} }

    if ("IntersectionObserver" in window && !preview) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("visible"); io.unobserve(x.target); } });
      }, { threshold: 0.12 });
      document.querySelectorAll(".revelar").forEach(function (el) { io.observe(el); });
    } else document.querySelectorAll(".revelar").forEach(function (el) { el.classList.add("visible"); });

    // --- Vista previa dentro del diseñador ---
    if (preview) {
      invitado = { nombre: "Familia Ejemplo", pases: 4 };
      window.addEventListener("message", function (ev) {
        var m = ev.data || {};
        if (m.tipo === "actualizar") {
          D = mezclar(C.datos, m.datos || {}); Z = mezclar(C.diseno, m.diseno || {});
          if (m.datos && m.datos.itinerario) D.itinerario = m.datos.itinerario;
          if (m.datos && m.datos.regalos) D.regalos = m.datos.regalos;
          var portadaCambio = document.body.getAttribute("data-portada") !== Z.portada;
          document.body.setAttribute("data-portada", Z.portada);
          mostrar();
          if (portadaCambio && Z.portada !== "directo") cerrarSobre();
        } else if (m.tipo === "portada") {
          cerrarSobre();
        } else if (m.tipo === "ir") {
          if (!$("sobre").classList.contains("abierto")) abrirSobre();
          var el = document.querySelector('[data-seccion="' + m.seccion + '"]');
          if (el) setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 700);
        }
      });
      if (window.parent !== window) window.parent.postMessage({ tipo: "listo" }, "*");
      setTimeout(function () { if (document.body.classList.contains("cargando")) mostrar(); }, 2500);
      return;
    }

    // --- Modo demostración (sin hoja conectada) ---
    if (demo) {
      $("demo").hidden = false;
      try {
        var g = JSON.parse(leer("boda_demo_" + (codigoCliente || "DEMO")) || "null");
        if (g) { D = mezclar(C.datos, g.datos); Z = mezclar(C.diseno, g.diseno); if (g.datos) { D.itinerario = g.datos.itinerario || D.itinerario; D.regalos = g.datos.regalos || D.regalos; } }
      } catch (e) {}
      invitado = { nombre: "Familia Ejemplo", pases: 4 };
      mostrar();
      return;
    }

    // --- Invitación real ---
    var peticion = codigo
      ? llamar({ accion: "abrir", codigo: codigo, dispositivo: dispositivo, equipo: descripcionEquipo() })
      : llamar({ accion: "cliente", cl: codigoCliente });
    peticion.then(function (r) {
      if (r && r.ok) {
        if (r.nombre) invitado = { nombre: r.nombre, pases: Number(r.pases) || 0 };
        // "abrir" (invitado) trae el cliente dentro de r.cliente; "cliente" (vista ?c=) lo trae directo
        var cl = r.cliente || (codigo ? null : r);
        if (cl) {
          codigoCliente = cl.codigo || codigoCliente;
          D = mezclar(C.datos, cl.datos || {}); Z = mezclar(C.diseno, cl.diseno || {});
          if (cl.datos) { D.itinerario = cl.datos.itinerario || D.itinerario; D.regalos = cl.datos.regalos || D.regalos; }
        }
      }
    }).catch(function () {}).finally(mostrar);
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
