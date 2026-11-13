/* ==========================================================
   CONFIGURACIÓN GENERAL
   Los datos y el diseño de cada pareja los llena el cliente
   en disenar.html y se guardan en tu hoja de Google.
   Lo de abajo solo se usa como valores de ejemplo.
   ========================================================== */
window.CONFIG = {
  // URL de la "Aplicación web" de Apps Script (ver LEEME.md).
  // Mientras esté vacía, todo funciona en MODO DEMO (se guarda solo en este navegador).
  urlHojaDeCalculo: "",

  // Si un invitado pide más lugares de los asignados:
  // "avisar" -> lo permite y te marca una alerta (recomendado) · "bloquear" -> no lo permite
  modoPasesExtra: "avisar",

  // Tu contacto (aparece en el diseñador para que el cliente te escriba)
  contactoNegocio: "WhatsApp 55 0000 0000",

  // ---------- Datos de ejemplo ----------
  datos: {
    novia: "Laura",
    novio: "Carlos",
    fecha: "2027-05-15",
    fechaLimite: "2027-04-15",
    fraseFoto1: "Y de pronto, todo tuvo sentido.",
    fraseFoto2: "Lo mejor de nuestra historia está por comenzar.",
    fraseCierre: "Gracias por ser parte de nuestra historia.",
    ceremonia: { lugar: "Parroquia de San Juan", direccion: "Calle, número, colonia, ciudad", hora: "17:00", mapa: "" },
    recepcion: { lugar: "Hacienda Los Olivos", direccion: "Calle, número, colonia, ciudad", hora: "19:00", mapa: "" },
    itinerario: [
      { hora: "17:00", evento: "Ceremonia", icono: "anillos" },
      { hora: "19:00", evento: "Cóctel de bienvenida", icono: "copas" },
      { hora: "20:30", evento: "Cena", icono: "cena" },
      { hora: "22:00", evento: "¡A bailar!", icono: "musica" }
    ],
    vestimenta: { tipo: "Formal", detalle: "Te sugerimos tonos tierra y neutros. Reservamos el blanco para la novia." },
    regalosTexto: "Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con nosotros:",
    regalos: [
      { titulo: "Mesa de regalos", detalle: "Tienda · Evento 00000000", enlace: "" },
      { titulo: "Transferencia", detalle: "Banco · CLABE 000 000 0000 0000 0000", enlace: "" }
    ],
    foto1: "",
    foto2: "",
    musica: ""
  },

  // ---------- Diseño de ejemplo ----------
  diseno: {
    paleta: "tierra",
    colores: null,            // si el cliente personaliza colores, se guardan aquí
    fondo: "papel",
    tipografia: "clasica",
    decoracion: "eucalipto",
    marcoFoto1: "arco",
    marcoFoto2: "circulo",
    portada: "sobre",
    referencias: {}
  }
};
