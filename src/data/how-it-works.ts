import type { ImageMetadata } from "astro";
import stepCutting from "@/assets/step-cutting.jpg";
import stepMapping from "@/assets/step-mapping.jpg";
import stepMonitoring from "@/assets/step-monitoring.jpg";
import stepPlanning from "@/assets/step-planning.jpg";

export interface Step {
  step: number;
  title: string;
  description: string;
  detail: string;
  image: ImageMetadata;
  alt: string;
}

export const howItWorks: Step[] = [
  {
    step: 1,
    title: "Mapeo inteligente",
    description:
      "La primera vez que lo encendés, el robot recorre el jardín con sus cámaras y arma un mapa preciso del terreno: identifica dónde hay césped, dónde hay canteros, árboles, bordes y pendientes.",
    detail: "La visión con IA captura miles de puntos de referencia y genera un plano de tu espacio verde sin enterrar un solo cable.",
    image: stepMapping,
    alt: "Robot cortacésped recorriendo un jardín para mapearlo",
  },
  {
    step: 2,
    title: "Planificación de ruta",
    description:
      "Con el mapa listo, el algoritmo planifica la ruta de corte más eficiente: cubre cada rincón sin pasar dos veces por el mismo lugar y esquiva las zonas que le marcaste como prohibidas.",
    detail: "Patrones de corte adaptativos que se ajustan a la forma del terreno y optimizan el consumo de batería.",
    image: stepPlanning,
    alt: "Vista del mapa del jardín con la ruta de corte planificada en la app",
  },
  {
    step: 3,
    title: "Corte autónomo",
    description:
      "El robot corta solo. Detecta obstáculos en tiempo real, ajusta la velocidad en las pendientes y, cuando la batería baja, vuelve a la base a cargar y después sigue donde estaba.",
    detail: "Cuchillas flotantes que se adaptan a las irregularidades del terreno para un corte parejo incluso en superficies desniveladas.",
    image: stepCutting,
    alt: "Robot cortacésped cortando el pasto de forma autónoma",
  },
  {
    step: 4,
    title: "Monitoreo y control",
    description:
      "Desde la app TerraMow manejás todo: horarios, zonas, altura de corte e historial. Recibís avisos en tiempo real sobre el estado del robot, estés donde estés.",
    detail: "Mapa en vivo, estadísticas de corte y alertas de mantenimiento en tu celular.",
    image: stepMonitoring,
    alt: "Persona controlando el robot cortacésped desde la app en el celular",
  },
];
