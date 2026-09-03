/**
 * Sinónimos de búsqueda para `searchIcons()` (`curatedIconNames.ts`,
 * misma carpeta). El nombre de cada ícono de `lucide-react` es en
 * inglés (`ShieldCheck`, `Handshake`, `PiggyBank`...) — sin este
 * diccionario, alguien que escribe "casa" o "seguridad" en el buscador
 * no encuentra nada, aunque el ícono exista, porque `searchIcons` sólo
 * podría comparar contra el nombre en inglés.
 *
 * No hace falta (ni conviene) traducir los ~1460 nombres de
 * `allIconNames.ts` uno por uno: se cubren acá los que de verdad
 * importan para el sitio de una inmobiliaria — los que ya estaban en
 * `CURATED_ICON_NAMES` (el set por defecto, sin buscar nada) más
 * algunos que se suman ahora a la variedad general. Cualquier ícono
 * SIN entrada acá se sigue pudiendo encontrar escribiendo (parte de)
 * su nombre en inglés — ninguna búsqueda que ya funcionaba antes deja
 * de funcionar, esto sólo agrega caminos nuevos para encontrar lo
 * mismo.
 *
 * Cada entrada es una lista de palabras sueltas (no frases) — más
 * fácil de mantener, y `searchIcons` compara por "incluye", así que
 * "seguro" matchea tanto en la entrada "seguro" como dentro de una
 * palabra más larga que la contenga — ver `normalize()` en
 * `curatedIconNames.ts` para cómo se ignoran mayúsculas/tildes.
 */
export const ICON_SYNONYMS: Record<string, string[]> = {
  /* ---- Confianza / calidad / garantía ---- */
  BadgeCheck: ['verificado', 'garantia', 'garantizado', 'certificado', 'aprobado', 'sello'],
  ShieldCheck: ['seguridad', 'seguro', 'proteccion', 'protegido', 'confianza', 'garantia'],
  CircleCheck: ['check', 'listo', 'ok', 'correcto', 'hecho', 'confirmado'],
  CircleCheckBig: ['check', 'listo', 'ok', 'correcto', 'hecho', 'confirmado'],
  Star: ['estrella', 'calificacion', 'rating', 'destacado', 'favorito'],
  Award: ['premio', 'reconocimiento', 'medalla', 'logro'],
  Trophy: ['trofeo', 'premio', 'ganador', 'campeon'],
  Sparkles: ['nuevo', 'destacado', 'brillante', 'especial', 'magia'],
  Heart: ['corazon', 'favorito', 'me gusta', 'amor', 'guardado'],
  ScanFace: ['identidad', 'seguridad', 'verificacion', 'reconocimiento'],
  BadgeDollarSign: ['precio', 'garantia', 'oferta', 'promocion'],

  /* ---- Casas / inmuebles / construcción ---- */
  House: ['casa', 'inicio', 'hogar', 'vivienda', 'inmueble', 'propiedad'],
  Building: ['edificio', 'departamento', 'oficina', 'torre'],
  Building2: ['edificio', 'departamento', 'oficina', 'torre', 'empresa'],
  Landmark: ['banco', 'institucion', 'monumento', 'edificio publico'],
  Warehouse: ['galpon', 'deposito', 'nave industrial', 'bodega'],
  DoorOpen: ['puerta', 'entrada', 'acceso', 'ingreso'],
  Key: ['llave', 'entrega', 'acceso', 'llaves'],
  KeyRound: ['llave', 'entrega', 'acceso', 'llaves'],
  Ruler: ['medida', 'superficie', 'metros', 'plano', 'tamaño'],
  PenTool: ['diseño', 'plano', 'boceto', 'proyecto'],
  Hammer: ['obra', 'construccion', 'reforma', 'refaccion'],
  Wrench: ['mantenimiento', 'reparacion', 'herramienta', 'arreglo'],
  Sofa: ['living', 'sillon', 'amoblado', 'muebles'],
  Armchair: ['sillon', 'amoblado', 'muebles', 'living'],
  BedDouble: ['dormitorio', 'habitacion', 'cama', 'cuarto'],
  Bath: ['baño', 'bano'],
  Trees: ['jardin', 'parque', 'verde', 'arboles', 'naturaleza'],
  TreePine: ['arbol', 'jardin', 'naturaleza', 'verde'],
  Leaf: ['hoja', 'ecologico', 'natural', 'verde', 'jardin'],
  Flower2: ['flor', 'jardin', 'naturaleza'],
  Sun: ['sol', 'luminoso', 'luz', 'dia'],
  Sunrise: ['amanecer', 'luminoso', 'orientacion'],
  CircleParking: ['estacionamiento', 'cochera', 'garage', 'parking', 'auto'],

  /* ---- Ubicación / cobertura ---- */
  MapPin: ['ubicacion', 'direccion', 'zona', 'lugar', 'mapa'],
  Compass: ['brujula', 'orientacion', 'direccion', 'explorar'],
  Globe: ['mundo', 'internacional', 'global', 'planeta'],
  Map: ['mapa', 'zona', 'plano', 'ubicacion'],
  Navigation: ['navegacion', 'ubicacion', 'direccion', 'gps'],
  Route: ['ruta', 'camino', 'recorrido', 'trayecto'],

  /* ---- Contacto ---- */
  Phone: ['telefono', 'llamar', 'contacto', 'llamada'],
  PhoneCall: ['telefono', 'llamar', 'contacto', 'llamada'],
  Mail: ['correo', 'email', 'mensaje', 'contacto'],
  MessageCircle: ['mensaje', 'whatsapp', 'chat', 'consulta'],
  MessageSquare: ['mensaje', 'chat', 'consulta', 'comentario'],

  /* ---- Personas / equipo / clientes ---- */
  Users: ['personas', 'equipo', 'clientes', 'gente', 'usuarios'],
  User: ['persona', 'cliente', 'usuario', 'perfil'],
  UserCheck: ['cliente verificado', 'agente', 'aprobado'],
  Handshake: ['acuerdo', 'trato', 'confianza', 'alianza', 'negocio'],
  ThumbsUp: ['recomendado', 'me gusta', 'aprobacion', 'bien', 'sonrisa', 'satisfaccion', 'contento'],

  /* ---- Tiempo ---- */
  Clock: ['reloj', 'hora', 'horario', 'tiempo'],
  Calendar: ['calendario', 'fecha', 'turno', 'agenda'],
  CalendarCheck: ['turno confirmado', 'agendado', 'reserva'],
  Timer: ['tiempo', 'cronometro', 'rapido'],
  Hourglass: ['tiempo', 'trayectoria', 'antiguedad', 'experiencia', 'espera'],

  /* ---- Dinero / finanzas ---- */
  TrendingUp: ['crecimiento', 'inversion', 'suba', 'rentabilidad'],
  ChartLine: ['grafico', 'estadistica', 'analisis', 'tendencia'],
  ChartBar: ['grafico', 'estadistica', 'analisis', 'datos'],
  PiggyBank: ['ahorro', 'inversion', 'chanchito', 'plata'],
  Wallet: ['billetera', 'dinero', 'plata', 'presupuesto'],
  DollarSign: ['dolar', 'precio', 'plata', 'dinero', 'costo'],
  Percent: ['porcentaje', 'descuento', 'tasa', 'interes'],
  Banknote: ['billete', 'dinero', 'plata', 'efectivo'],
  CreditCard: ['tarjeta', 'pago', 'financiacion', 'credito'],
  Receipt: ['factura', 'recibo', 'comprobante', 'ticket'],

  /* ---- Documentos / legal ---- */
  FileText: ['documento', 'papel', 'archivo', 'contrato'],
  FileCheck: ['documento aprobado', 'contrato firmado', 'tramite'],
  ClipboardCheck: ['tramite', 'checklist', 'aprobado'],
  ClipboardList: ['lista', 'checklist', 'tramite', 'requisitos'],
  Scale: ['legal', 'ley', 'balanza', 'justicia', 'abogado'],
  Briefcase: ['trabajo', 'profesional', 'negocio', 'maletin', 'empresa'],
  GraduationCap: ['titulo', 'estudios', 'profesional', 'matricula'],
  BookOpen: ['libro', 'historia', 'informacion', 'nuestra historia'],

  /* ---- Ver / mostrar ---- */
  Search: ['buscar', 'lupa', 'encontrar'],
  Eye: ['ver', 'vista', 'visita', 'mostrar'],
  Camera: ['foto', 'fotografia', 'imagen', 'camara'],
  Image: ['imagen', 'foto', 'galeria'],
  Video: ['video', 'recorrido virtual', 'tour'],

  /* ---- Seguridad ---- */
  Lock: ['candado', 'seguridad', 'privado', 'protegido'],
  ShieldAlert: ['alerta', 'seguridad', 'atencion', 'aviso'],
  Shield: ['escudo', 'seguridad', 'proteccion'],

  /* ---- Transporte ---- */
  Car: ['auto', 'coche', 'vehiculo', 'transporte'],
  Truck: ['camion', 'mudanza', 'transporte', 'flete'],
  Bus: ['colectivo', 'transporte publico', 'bondi'],
  Bike: ['bicicleta', 'bici', 'transporte'],

  /* ---- Servicios / tecnología ---- */
  Wifi: ['internet', 'wifi', 'conexion', 'señal'],
  Zap: ['electricidad', 'rapido', 'energia', 'luz'],
  Settings: ['configuracion', 'ajustes', 'opciones', 'engranaje'],
  Target: ['objetivo', 'meta', 'foco', 'precision'],
  Flag: ['bandera', 'meta', 'destacado', 'hito'],
  Gem: ['joya', 'premium', 'exclusivo', 'lujo'],
  Crown: ['corona', 'premium', 'lujo', 'exclusivo', 'top'],
  Layers: ['capas', 'niveles', 'pisos'],
  LayoutGrid: ['grilla', 'catalogo', 'cuadricula'],
  Grid2x2: ['grilla', 'cuadricula', 'organizado'],
  Square: ['cuadrado', 'espacio', 'metro cuadrado'],

  /* ---- Ampliación (variedad extra, comodidades típicas de una ficha) ---- */
  ThermometerSun: ['clima', 'temperatura', 'calido', 'calefaccion'],
  Snowflake: ['aire acondicionado', 'frio', 'clima', 'climatizado'],
  Droplet: ['agua', 'pileta', 'humedad'],
  Droplets: ['agua', 'pileta', 'lluvia'],
  Dumbbell: ['gimnasio', 'ejercicio', 'fitness'],
  Dog: ['mascotas', 'perro', 'pet friendly'],
  Cat: ['mascotas', 'gato', 'pet friendly'],
  Baby: ['familia', 'bebe', 'niños'],
  Accessibility: ['accesibilidad', 'discapacidad', 'rampa'],
  Recycle: ['reciclaje', 'ecologico', 'sustentable'],
  Sprout: ['sustentable', 'ecologico', 'jardin', 'nuevo'],
};
