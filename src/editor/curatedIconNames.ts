/**
 * Set curado de íconos para el selector inline de Barra de confianza /
 * ¿Por qué elegirnos? (Editable.tsx → IconPickerPopover). A propósito
 * NO es la lista completa de ~1460 íconos de `lucide-react` que usa el
 * `IconPicker.tsx` del admin (`@/lib/lucideIconNames`) — este paquete
 * lo consume también el público, así que no puede importar nada de
 * `admin/src/lib`. En vez de eso: un set chico (~90) de íconos que
 * tienen sentido para una inmobiliaria, elegido a mano, con búsqueda
 * por texto encima igual que el picker grande del admin.
 *
 * Cualquier ícono guardado antes con el picker grande del admin (fuera
 * de este set) se sigue viendo perfecto — `resolveIcon` no depende de
 * esta lista, sólo el selector para elegir uno NUEVO desde acá adentro
 * se limita a este set. Si hace falta un ícono fuera de esta lista, el
 * picker completo del admin (fuera del editor visual) sigue disponible.
 */
export const CURATED_ICON_NAMES: string[] = [
  'BadgeCheck', 'ShieldCheck', 'CircleCheck', 'CheckCircle2', 'ThumbsUp',
  'Star', 'Award', 'Trophy', 'Sparkles', 'Heart',
  'Home', 'House', 'Building', 'Building2', 'Landmark',
  'Key', 'KeyRound', 'DoorOpen', 'Warehouse', 'MapPin',
  'Compass', 'Globe', 'Map', 'Navigation', 'Route',
  'Phone', 'PhoneCall', 'Mail', 'MessageCircle', 'MessageSquare',
  'Users', 'User', 'UserCheck', 'Handshake', 'Smile',
  'Clock', 'Calendar', 'CalendarCheck', 'Timer', 'History',
  'TrendingUp', 'LineChart', 'BarChart3', 'PiggyBank', 'Wallet',
  'DollarSign', 'Percent', 'Banknote', 'CreditCard', 'Receipt',
  'FileText', 'FileCheck', 'ClipboardCheck', 'ClipboardList', 'Scale',
  'Briefcase', 'GraduationCap', 'BookOpen', 'Search', 'Eye',
  'Camera', 'Image', 'Video', 'Ruler', 'PenTool',
  'Lock', 'ShieldAlert', 'Shield', 'Fingerprint', 'BadgeDollarSign',
  'Sun', 'Sunrise', 'TreePine', 'Leaf', 'Flower2',
  'Car', 'Truck', 'Bus', 'Bike', 'ParkingCircle',
  'Wifi', 'Zap', 'Wrench', 'Hammer', 'Settings',
  'Target', 'Flag', 'Gem', 'Crown',
  'Layers', 'LayoutGrid', 'Grid2x2', 'Square',
];