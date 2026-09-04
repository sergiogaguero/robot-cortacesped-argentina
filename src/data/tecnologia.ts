export const timeComparison = [
  { task: "Corte semanal (500 m²)", manual: "2,5 hs", robot: "0 hs (automático)", savings: "2,5 hs" },
  { task: "Corte mensual", manual: "10 hs", robot: "0 hs", savings: "10 hs" },
  { task: "Corte anual", manual: "120 hs", robot: "0 hs", savings: "120 hs" },
  { task: "Mantenimiento del equipo", manual: "12 hs/año", robot: "2 hs/año", savings: "10 hs" },
  { task: "Limpieza después de cortar", manual: "30 min por corte", robot: "0 min", savings: "26 hs/año" },
];

export const manualVsRobot = [
  { feature: "Requiere que alguien lo opere", manual: true, robot: false },
  { feature: "Funciona bajo lluvia liviana", manual: false, robot: true },
  { feature: "Corte silencioso (< 54 dB)", manual: false, robot: true },
  { feature: "Mulching automático (no hay que recoger el césped)", manual: false, robot: true },
  { feature: "Programable desde el celular", manual: false, robot: true },
  { feature: "Sin cables ni obra para instalar", manual: true, robot: true },
  { feature: "Detección de obstáculos con IA", manual: false, robot: true },
  { feature: "Cero emisiones", manual: false, robot: true },
];

export const techAdvantages = [
  {
    title: "Visión por cámara con IA, sin cables perimetrales",
    description: "Los robots tradicionales necesitan un cable enterrado para saber dónde cortar. La V Series usa tres cámaras e inteligencia artificial para reconocer el césped, los bordes y los obstáculos. Cero obra, instalación en minutos, y si cambiás el diseño del jardín no hay nada que desenterrar.",
    stat: "0 cables",
    statLabel: "para instalar",
  },
  {
    title: "Mulching: el césped se fertiliza solo",
    description: "Como corta un poco cada día, los recortes son finísimos y caen entre las hojas, donde se descomponen en uno o dos días. No hay que rastrillar ni embolsar, y el suelo recibe nutrientes de forma continua.",
    stat: "0 bolsas",
    statLabel: "de césped",
  },
  {
    title: "Consumo mínimo",
    description: "Una carga completa consume poco más que cargar un celular. Comparado con una cortadora a combustión, el ahorro de energía es del orden del 95 % y no hay emisiones ni olor a nafta.",
    stat: "95 %",
    statLabel: "menos energía",
  },
  {
    title: "Seguridad en capas",
    description: "Sensores de impacto, elevación e inclinación detienen las cuchillas al instante ante cualquier situación anormal. Además: bloqueo por PIN, alarma antirrobo y aviso en la app si alguien lo mueve.",
    stat: "< 0,1 s",
    statLabel: "de reacción",
  },
];

export const workCycle = [
  { label: "Carga en la base", time: "~100-120 min" },
  { label: "Analiza el mapa", time: "~30 seg" },
  { label: "Corta el césped", time: "~120-150 min" },
  { label: "Vuelve a la base", time: "Automático" },
];
