(function () {
  "use strict";
  var C = window.CONFIG, O = window.OPCIONES;
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  var cliente = (new URLSearchParams(location.search).get("c") || "DEMO").trim().toUpperCase();
  var demo = !C.urlHojaDeCalculo;
  var D = JSON.parse(JSON.stringify(C.datos));
  var Z = JSON.parse(JSON.stringify(C.diseno));
  var estado = "diseñando";
  var soloLectura = false;
  var frameListo = false;

  /* ---------- Utilidades ---------- */
  function leerLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardarLS(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function obtener(obj, ruta) { return ruta.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }
  function asignar(obj, ruta, v) {
    var p = ruta.split("."), o = obj;
    for (var i = 0; i < p.length - 1; i++) { if (!o[p[i]] || typeof o[p[i]] !== "object") o[p[i]] = {}; o = o[p[i]]; }
    o[p[p.length - 1]] = v;
  }
  function mezclar(base, extra) {
    var r = JSON.parse(JSON.stringify(base));
    Object.keys(extra || {}).forEach(function (k) {
      var v = extra[k];
      if (v && typeof v === "object" && !Array.isArray(v) && r[k] && typeof r[k] === "object" && !Array.isArray(r[k])) r[k] = mezclar(r[k], v);
      else if (v !== undefined && v !== null) r[k] = v;
    });
    return r;
  }

  function llamar(params) {
    return new Promise(function (ok, falla) {
      var cb = "cb_" + Math.random().toString(36).slice(2);
      var s = document.createElement("script");
      var t = setTimeout(function () { limpiar(); falla(new Error("Tiempo agotado")); }, 20000);
      function limpiar() { clearTimeout(t); delete window[cb]; s.remove(); }
      window[cb] = function (r) { limpiar(); ok(r); };
      params.callback = cb; params._ = Date.now();
      s.src = C.urlHojaDeCalculo + "?" + Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
      s.onerror = function () { limpiar(); falla(new Error("Sin conexión")); };
      document.body.appendChild(s);
    });
  }
  function enviarPost(obj) {
    return fetch(C.urlHojaDeCalculo, { method: "POST", body: JSON.stringify(obj) }).then(function (r) { return r.json(); });
  }

  /* ---------- Vista previa ---------- */
  var frame = $("frame"), tPrev;
  function actualizarVista() {
    clearTimeout(tPrev);
    tPrev = setTimeout(function () {
      if (frame.contentWindow) frame.contentWindow.postMessage({ tipo: "actualizar", datos: D, diseno: Z }, "*");
    }, 120);
  }
  function irA(seccion) {
    if (!frame.contentWindow) return;
    if (seccion === "portada") frame.contentWindow.postMessage({ tipo: "portada" }, "*");
    else frame.contentWindow.postMessage({ tipo: "ir", seccion: seccion }, "*");
  }
  window.addEventListener("message", function (ev) {
    if (ev.data && ev.data.tipo === "listo") { frameListo = true; actualizarVista(); }
  });
  frame.addEventListener("load", function () { setTimeout(actualizarVista, 50); });

  /* ---------- Guardado ---------- */
  var tGuardar, pendiente = false, guardando = false;
  function marcarCambio() {
    if (soloLectura) return;
    pendiente = true;
    estadoGuardado("Cambios sin guardar…");
    guardarLS("boda_borrador_" + cliente, JSON.stringify({ datos: D, diseno: Z }));
    actualizarVista();
    clearTimeout(tGuardar);
    tGuardar = setTimeout(function () { guardar(false); }, 2500);
  }
  function estadoGuardado(t, ok) { var g = $("guardado"); g.textContent = t; g.classList.toggle("ok", !!ok); }

  function guardar(enviar) {
    if (soloLectura) return Promise.resolve({ ok: false });
    clearTimeout(tGuardar);
    guardando = true;
    estadoGuardado("Guardando…");
    var p;
    if (demo) {
      var nuevoEstado = enviar ? "enviado" : estado;
      guardarLS("boda_demo_" + cliente, JSON.stringify({ datos: D, diseno: Z, estado: nuevoEstado }));
      p = Promise.resolve({ ok: true, estado: nuevoEstado });
    } else {
      p = enviarPost({ accion: "guardar", c: cliente, datos: D, diseno: Z, enviar: !!enviar });
    }
    return p.then(function (r) {
      guardando = false;
      if (!r || !r.ok) throw new Error((r && r.error) || "Error");
      pendiente = false;
      if (r.estado) ponerEstado(r.estado);
      var h = new Date().toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
      estadoGuardado("✓ Guardado " + h, true);
      return r;
    }).catch(function (e) {
      guardando = false;
      estadoGuardado("⚠️ No se pudo guardar. Reintentando…");
      tGuardar = setTimeout(function () { guardar(false); }, 8000);
      throw e;
    });
  }
  window.addEventListener("beforeunload", function (e) { if (pendiente || guardando) { e.preventDefault(); e.returnValue = ""; } });

  function ponerEstado(e) {
    estado = String(e || "diseñando").toLowerCase();
    var chip = $("chipEstado");
    chip.className = "chip";
    if (estado.indexOf("aprob") !== -1) {
      chip.textContent = "✅ Aprobado"; chip.classList.add("aprobado");
      soloLectura = true; document.body.classList.add("solo-lectura");
      $("avisoAprobado").hidden = false; $("btnEnviarDiseno").disabled = true;
      estadoGuardado("Diseño aprobado", true);
    } else if (estado.indexOf("enviad") !== -1) {
      chip.textContent = "📩 Enviado"; chip.classList.add("enviado");
      $("btnEnviarDiseno").textContent = "Reenviar cambios";
    } else {
      chip.textContent = "✏️ Diseñando";
    }
  }

  /* ---------- Campos simples ---------- */
  function enlazarCampos() {
    $$("[data-campo]").forEach(function (el) {
      var v = obtener(D, el.dataset.campo);
      el.value = v == null ? "" : v;
      el.addEventListener("input", function () {
        asignar(D, el.dataset.campo, el.value);
        if (el.dataset.campo === "novia" || el.dataset.campo === "novio") tituloPareja();
        marcarCambio();
      });
    });
  }
  function tituloPareja() { $("tituloPareja").textContent = (D.novia || "Novia") + " & " + (D.novio || "Novio"); }

  /* ---------- Tarjetas de opciones ---------- */
  function tarjetas(contenedor, nombre, opciones, actual, contenido, alCambiar) {
    contenedor.innerHTML = Object.keys(opciones).map(function (k) {
      return '<label class="tarjeta' + (k === actual ? " activa" : "") + '"><input type="radio" name="' + nombre + '" value="' + k + '"' +
        (k === actual ? " checked" : "") + " />" + contenido(k, opciones[k]) + "</label>";
    }).join("");
    $$("input", contenedor).forEach(function (inp) {
      inp.addEventListener("change", function () {
        $$(".tarjeta", contenedor).forEach(function (t) { t.classList.toggle("activa", t.querySelector("input").checked); });
        alCambiar(inp.value);
      });
    });
  }

  function pintarOpciones() {
    // Paletas
    tarjetas($("opPaletas"), "paleta", O.paletas, Z.colores ? "" : Z.paleta, function (k, p) {
      var c = p.colores;
      return '<div class="muestras">' + ["fondo", "secundario", "verde", "rosa", "acento", "texto", "dorado"].map(function (n) {
        return '<span style="background:' + c[n] + '"></span>';
      }).join("") + "</div>" + esc(p.nombre);
    }, function (v) { Z.paleta = v; Z.colores = null; pintarColoresPropios(); marcarCambio(); });

    // Fondos
    tarjetas($("opFondos"), "fondo", O.fondos, Z.fondo, function (k, n) {
      return '<div class="muestra-fondo mf-' + k + '"></div>' + esc(n);
    }, function (v) { Z.fondo = v; marcarCambio(); });

    // Tipografías
    tarjetas($("opTipografias"), "tipo", O.tipografias, Z.tipografia, function (k, t) {
      return '<div class="muestra-tipo"><div class="t1" style="font-family:\'' + t.titulo + '\'">BODA</div>' +
        '<div class="t2" style="font-family:\'' + t.script + '\'">' + esc((D.novia || "Laura") + " & " + (D.novio || "Carlos")) + "</div>" +
        '<div class="t3" style="font-family:\'' + t.texto + '\'">' + esc(t.nombre) + "</div></div>";
    }, function (v) { Z.tipografia = v; marcarCambio(); });

    // Decoración
    var iconosDeco = { eucalipto: "🌿", flores: "🌸", dorado: "◇", lineas: "═", ninguno: "○" };
    tarjetas($("opDecoraciones"), "deco", O.decoraciones, Z.decoracion, function (k, n) {
      return '<div class="muestra-icono">' + iconosDeco[k] + "</div>" + esc(n);
    }, function (v) { Z.decoracion = v; marcarCambio(); });

    // Portada
    var iconosPortada = { sobre: "✉️", cortina: "🎭", directo: "📜" };
    tarjetas($("opPortadas"), "portada", O.portadas, Z.portada, function (k, n) {
      return '<div class="muestra-icono">' + iconosPortada[k] + "</div>" + esc(n);
    }, function (v) { Z.portada = v; marcarCambio(); setTimeout(function () { irA("portada"); }, 300); });

    // Marcos de fotos
    $$("[data-opcion]").forEach(function (cont) {
      var campo = cont.dataset.opcion;
      tarjetas(cont, campo, O.marcos, Z[campo], function (k, n) {
        return '<div class="forma ' + k + '"></div>' + esc(n);
      }, function (v) { Z[campo] = v; marcarCambio(); irA(campo === "marcoFoto1" ? "fotos" : "foto2"); });
    });
  }

  function coloresActuales() { return mezclar((O.paletas[Z.paleta] || O.paletas.tierra).colores, Z.colores || {}); }
  function pintarColoresPropios() {
    var col = coloresActuales();
    $("coloresPropios").innerHTML = Object.keys(O.nombresColores).map(function (k) {
      return '<label class="color-propio"><input type="color" data-color="' + k + '" value="' + col[k] + '" />' + esc(O.nombresColores[k]) + "</label>";
    }).join("");
    $$("[data-color]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        Z.colores = Z.colores || {};
        Z.colores[inp.dataset.color] = inp.value;
        $$("#opPaletas .tarjeta").forEach(function (t) { t.classList.remove("activa"); });
        marcarCambio();
      });
    });
  }

  /* ---------- Listas ---------- */
  function pintarItinerario() {
    var cont = $("listaItinerario");
    cont.innerHTML = (D.itinerario || []).map(function (it, i) {
      return '<div class="item" data-i="' + i + '">' +
        '<input type="time" data-k="hora" value="' + esc(it.hora) + '" aria-label="Hora" />' +
        '<input type="text" class="evento" data-k="evento" value="' + esc(it.evento) + '" placeholder="Momento" aria-label="Momento" />' +
        '<select data-k="icono" aria-label="Icono">' + Object.keys(O.iconos).map(function (k) {
          return '<option value="' + k + '"' + (k === it.icono ? " selected" : "") + ">" + esc(O.iconos[k]) + "</option>";
        }).join("") + "</select>" +
        '<button type="button" class="borrar" aria-label="Quitar">✕</button></div>';
    }).join("");
    $$(".item", cont).forEach(function (row) {
      var i = +row.dataset.i;
      $$("[data-k]", row).forEach(function (el) {
        el.addEventListener("input", function () { D.itinerario[i][el.dataset.k] = el.value; marcarCambio(); });
      });
      row.querySelector(".borrar").addEventListener("click", function () { D.itinerario.splice(i, 1); pintarItinerario(); marcarCambio(); });
    });
  }
  function pintarRegalos() {
    var cont = $("listaRegalos");
    cont.innerHTML = (D.regalos || []).map(function (r, i) {
      return '<div class="item regalo" data-i="' + i + '"><div class="campos">' +
        '<input type="text" data-k="titulo" value="' + esc(r.titulo) + '" placeholder="Ej. Mesa de regalos" aria-label="Título" />' +
        '<input type="text" data-k="detalle" value="' + esc(r.detalle) + '" placeholder="Tienda y número / datos bancarios" aria-label="Detalle" />' +
        '<input type="url" data-k="enlace" value="' + esc(r.enlace) + '" placeholder="Enlace (opcional)" aria-label="Enlace" />' +
        '</div><button type="button" class="borrar" aria-label="Quitar">✕</button></div>';
    }).join("");
    $$(".item", cont).forEach(function (row) {
      var i = +row.dataset.i;
      $$("[data-k]", row).forEach(function (el) {
        el.addEventListener("input", function () { D.regalos[i][el.dataset.k] = el.value; marcarCambio(); });
      });
      row.querySelector(".borrar").addEventListener("click", function () { D.regalos.splice(i, 1); pintarRegalos(); marcarCambio(); });
    });
  }

  /* ---------- Imágenes ---------- */
  function reducir(archivo, max) {
    return new Promise(function (ok, falla) {
      var lector = new FileReader();
      lector.onerror = falla;
      lector.onload = function () {
        var img = new Image();
        img.onerror = falla;
        img.onload = function () {
          var e = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement("canvas");
          c.width = Math.round(img.width * e); c.height = Math.round(img.height * e);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL("image/jpeg", 0.85));
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }
  function subir(archivo, tipo, seccion, max) {
    return reducir(archivo, max).then(function (dataUrl) {
      if (demo) return { ok: true, url: dataUrl };
      return enviarPost({ accion: "subir", c: cliente, tipo: tipo, seccion: seccion, nombre: archivo.name, data: dataUrl.split(",")[1] });
    }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.error) || "Error al subir");
      return r.url;
    });
  }

  function pintarMiniFotos() {
    ["foto1", "foto2"].forEach(function (f, i) {
      var m = $("mini" + (i + 1));
      m.style.backgroundImage = D[f] ? 'url("' + D[f] + '")' : "";
      m.classList.toggle("con-foto", !!D[f]);
    });
  }
  function enlazarFotos() {
    $$("[data-subir-foto]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var f = inp.files[0]; if (!f) return;
        var campo = inp.dataset.subirFoto, boton = inp.parentNode;
        boton.classList.add("ocupado"); boton.firstChild.textContent = "Subiendo…";
        subir(f, campo, "Fotos", 1800).then(function (url) {
          D[campo] = url; pintarMiniFotos(); marcarCambio(); irA(campo === "foto1" ? "fotos" : "foto2");
        }).catch(function () { alert("No se pudo subir la foto. Inténtalo de nuevo."); })
          .finally(function () { boton.classList.remove("ocupado"); boton.firstChild.textContent = "Subir foto"; inp.value = ""; });
      });
    });
    $$("[data-quitar-foto]").forEach(function (b) {
      b.addEventListener("click", function () { D[b.dataset.quitarFoto] = ""; pintarMiniFotos(); marcarCambio(); });
    });
  }

  /* ---------- Referencias por paso ---------- */
  function agregarReferencias() {
    Z.referencias = Z.referencias || {};
    $$(".paso").forEach(function (paso) {
      var clave = paso.dataset.paso;
      var nodo = $("tplRef").content.cloneNode(true);
      var ref = nodo.querySelector(".ref");
      if (clave === "general") ref.querySelector(".ref-titulo").innerHTML = "📎 Ideas e imágenes de referencia";
      paso.querySelector(".cuerpo").appendChild(nodo);
      var datos = Z.referencias[clave] = Z.referencias[clave] || { comentario: "", imagenes: [] };
      var ta = ref.querySelector(".ref-comentario"), cont = ref.querySelector(".ref-imagenes"), inp = ref.querySelector(".ref-archivo");
      ta.value = datos.comentario || "";
      ta.addEventListener("input", function () { datos.comentario = ta.value; marcarCambio(); });

      function pintar() {
        cont.innerHTML = datos.imagenes.map(function (im, i) {
          return '<div class="ref-img" style="background-image:url(\'' + esc(im.url) + '\')"><button type="button" data-i="' + i + '" aria-label="Quitar">✕</button></div>';
        }).join("");
        $$("button", cont).forEach(function (b) {
          b.addEventListener("click", function () { datos.imagenes.splice(+b.dataset.i, 1); pintar(); marcarCambio(); });
        });
      }
      pintar();

      inp.addEventListener("change", function () {
        var archivos = Array.prototype.slice.call(inp.files || []);
        archivos.forEach(function (f) {
          var tmp = document.createElement("div");
          tmp.className = "ref-img subiendo"; tmp.textContent = "Subiendo…";
          cont.appendChild(tmp);
          var titulo = paso.querySelector("summary").textContent.replace(/^\s*\d+\s*/, "").trim();
          subir(f, "referencia", titulo, 1400).then(function (url) {
            datos.imagenes.push({ url: url, nombre: f.name }); pintar(); marcarCambio();
          }).catch(function () { tmp.remove(); alert("No se pudo subir " + f.name); });
        });
        inp.value = "";
      });
    });
  }

  /* ---------- Interfaz ---------- */
  function enlazarInterfaz() {
    $$(".paso").forEach(function (p) {
      p.addEventListener("toggle", function () { if (p.open && p.dataset.ir) irA(p.dataset.ir); });
    });
    $("btnVer").addEventListener("click", function () { $("vista").classList.add("abierta"); actualizarVista(); });
    $("btnCerrarVista").addEventListener("click", function () { $("vista").classList.remove("abierta"); });
    $("btnVerPortada").addEventListener("click", function () { irA("portada"); });
    $("btnRestablecerColores").addEventListener("click", function () {
      Z.colores = null; pintarColoresPropios(); pintarOpciones(); marcarCambio();
    });
    $("addItinerario").addEventListener("click", function () {
      D.itinerario = D.itinerario || []; D.itinerario.push({ hora: "", evento: "", icono: "fiesta" }); pintarItinerario();
      var u = $$("#listaItinerario .evento").pop(); if (u) u.focus();
    });
    $("addRegalo").addEventListener("click", function () {
      D.regalos = D.regalos || []; D.regalos.push({ titulo: "", detalle: "", enlace: "" }); pintarRegalos();
    });
    $("btnEnviarDiseno").addEventListener("click", function () {
      if (!D.novia || !D.novio || !D.fecha) {
        alert("Antes de enviar, completa los nombres y la fecha de la boda (paso 1).");
        var p1 = document.querySelector('[data-paso="datos"]'); p1.open = true; p1.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (!confirm("¿Enviar tu diseño? Podrás seguir haciendo cambios hasta que lo aprobemos.")) return;
      var b = $("btnEnviarDiseno"); b.disabled = true;
      guardar(true).then(function () { $("modal").hidden = false; })
        .catch(function () { alert("No se pudo enviar. Revisa tu conexión e inténtalo de nuevo."); })
        .finally(function () { if (!soloLectura) b.disabled = false; });
    });
    $("modalCerrar").addEventListener("click", function () { $("modal").hidden = true; });
    $$(".contacto").forEach(function (el) { el.textContent = C.contactoNegocio || ""; });
  }

  function arrancar(datos, diseno, est) {
    D = mezclar(C.datos, datos || {});
    if (datos && datos.itinerario) D.itinerario = datos.itinerario;
    if (datos && datos.regalos) D.regalos = datos.regalos;
    Z = mezclar(C.diseno, diseno || {});
    Z.referencias = (diseno && diseno.referencias) || {};
    tituloPareja();
    enlazarCampos(); pintarOpciones(); pintarColoresPropios(); pintarItinerario(); pintarRegalos();
    pintarMiniFotos(); enlazarFotos(); agregarReferencias(); enlazarInterfaz();
    ponerEstado(est);
    document.body.classList.remove("cargando");
    if (frameListo) actualizarVista();
  }

  /* ---------- Inicio ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (demo) {
      var g = null;
      try { g = JSON.parse(leerLS("boda_demo_" + cliente) || "null"); } catch (e) {}
      arrancar(g && g.datos, g && g.diseno, g && g.estado);
      estadoGuardado("Modo demostración · se guarda en este navegador");
      return;
    }
    llamar({ accion: "cliente", c: cliente, editar: 1 }).then(function (r) {
      if (!r || !r.ok) throw new Error("no encontrado");
      var borrador = null;
      try { borrador = JSON.parse(leerLS("boda_borrador_" + cliente) || "null"); } catch (e) {}
      // Si hay cambios locales que no alcanzaron a guardarse, se usan esos
      var usarLocal = borrador && !r.datosGuardados;
      arrancar(usarLocal ? borrador.datos : r.datos, usarLocal ? borrador.diseno : r.diseno, r.estado);
      if (r.pareja && !r.datos) $("tituloPareja").textContent = r.pareja;
      estadoGuardado(r.datosGuardados ? "✓ Todo guardado" : "Empieza a diseñar", !!r.datosGuardados);
    }).catch(function () {
      document.body.classList.remove("cargando");
      $("pantallaError").hidden = false;
    });
  });
})();
