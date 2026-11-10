/* ==========================================================
   CONFIGURACIÓN DE LA INVITACIÓN
   Cambia aquí todos los datos. No necesitas tocar nada más.
   ========================================================== */
window.CONFIG = {
  // --- Novios ---
  novia: "Nombre Novia",
  novio: "Nombre Novio",
  iniciales: "N & N",

  // --- Fecha (formato: AAAA-MM-DDTHH:MM, hora local) ---
  fechaBoda: "2027-05-15T17:00",
  fechaTexto: "Sábado 15 de mayo de 2027",
  fechaLimiteConfirmacion: "15 de abril de 2027",

  // --- Frases ---
  fraseFoto1: "Y de pronto, todo tuvo sentido.",
  fraseFoto2: "Lo mejor de nuestra historia está por comenzar.",
  fraseCierre: "Gracias por ser parte de nuestra historia.",

  // --- Ceremonia ---
  ceremonia: {
    titulo: "Ceremonia",
    hora: "5:00 PM",
    lugar: "Nombre de la iglesia o lugar",
    direccion: "Calle, número, colonia, ciudad",
    mapa: "https://maps.google.com/?q=Catedral"
  },

  // --- Recepción ---
  recepcion: {
    titulo: "Recepción",
    hora: "7:00 PM",
    lugar: "Nombre del salón o hacienda",
    direccion: "Calle, número, colonia, ciudad",
    mapa: "https://maps.google.com/?q=Hacienda"
  },

  // --- Itinerario ---
  itinerario: [
    { hora: "5:00 PM", evento: "Ceremonia", icono: "anillos" },
    { hora: "7:00 PM", evento: "Cóctel de bienvenida", icono: "copas" },
    { hora: "8:30 PM", evento: "Cena", icono: "cena" },
    { hora: "10:00 PM", evento: "¡A bailar!", icono: "musica" }
  ],

  // --- Código de vestimenta ---
  vestimenta: {
    tipo: "Formal",
    detalle: "Te sugerimos tonos tierra y neutros. Reservamos el blanco para la novia.",
    colores: ["#D9C3A5", "#8A9A6F", "#E3B5A4", "#C0643C", "#7A5040"]
  },

  // --- Regalos (deja la lista vacía [] para ocultar la sección) ---
  regalosTexto: "Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con nosotros:",
  regalos: [
    { titulo: "Mesa de regalos", detalle: "Liverpool · Evento 00000000", enlace: "" },
    { titulo: "Transferencia", detalle: "Banco · CLABE 000 000 0000 0000 0000", enlace: "" }
  ],

  // --- Música de fondo (ruta a un mp3, ej. "musica/cancion.mp3"; vacío = sin música) ---
  musica: "",

  // --- Conexión con Google Sheets ---
  // Pega aquí la URL de la "Aplicación web" de Apps Script (ver LEEME.md).
  // Mientras esté vacía, la invitación funciona en MODO DEMO.
  urlHojaDeCalculo: "",

  // --- Si piden más lugares de los asignados ---
  // "avisar"   -> lo permite y te marca una alerta en la hoja (recomendado)
  // "bloquear" -> no puede elegir más de sus pases
  modoPasesExtra: "avisar"
};
