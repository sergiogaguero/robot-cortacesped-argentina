import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Zap, Brain, Eye, Map, Smartphone, Shield, Leaf, TrendingDown, Timer, CheckCircle2, XCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { breadcrumbTecnologia, howItWorksSchema } from "@/lib/seo-data";
import logo from "@/assets/logo.png";
import stepMapping from "@/assets/step-mapping.jpg";
import stepPlanning from "@/assets/step-planning.jpg";
import stepCutting from "@/assets/step-cutting.jpg";
import stepMonitoring from "@/assets/step-monitoring.jpg";

const timeComparison = [
  { task: "Corte semanal (500m²)", manual: "2.5 hs", robot: "0 hs (automático)", savings: "2.5 hs" },
  { task: "Corte mensual", manual: "10 hs", robot: "0 hs", savings: "10 hs" },
  { task: "Corte anual", manual: "120 hs", robot: "0 hs", savings: "120 hs" },
  { task: "Mantenimiento del equipo", manual: "12 hs/año", robot: "2 hs/año", savings: "10 hs" },
  { task: "Limpieza post-corte", manual: "30 min/corte", robot: "0 min", savings: "26 hs/año" },
];

const manualVsRobot = [
  { feature: "Requiere operador", manual: true, robot: false },
  { feature: "Funciona bajo lluvia", manual: false, robot: true },
  { feature: "Corte silencioso", manual: false, robot: true },
  { feature: "Mulching automático", manual: false, robot: true },
  { feature: "Programable por app", manual: false, robot: true },
  { feature: "Instalación sin cables", manual: true, robot: true },
  { feature: "Detección de obstáculos con IA", manual: false, robot: true },
  { feature: "Cero emisiones de CO₂", manual: false, robot: true },
];

const stepImages = [stepMapping, stepPlanning, stepCutting, stepMonitoring];

const howItWorks = [
  {
    step: 1,
    title: "Mapeo Inteligente",
    description: "Al encender el robot por primera vez, este recorre todo tu jardín utilizando cámaras y sensores LiDAR para crear un mapa 3D preciso del terreno, identificando obstáculos, pendientes y bordes.",
    icon: Map,
    detail: "La cámara de visión por IA captura miles de puntos de referencia para generar un plano centimétrico de tu espacio verde.",
  },
  {
    step: 2,
    title: "Planificación de Ruta",
    description: "Con el mapa creado, el algoritmo de IA planifica la ruta más eficiente de corte, cubriendo cada centímetro sin pasar dos veces por el mismo lugar.",
    icon: Brain,
    detail: "Patrones de corte adaptativos que se ajustan a la forma del terreno, evitando zonas excluidas y optimizando el consumo de batería.",
  },
  {
    step: 3,
    title: "Corte Autónomo",
    description: "El robot ejecuta el corte de forma completamente autónoma. Detecta obstáculos en tiempo real, ajusta la velocidad en pendientes y regresa solo a cargar.",
    icon: Zap,
    detail: "Cuchillas flotantes que se adaptan a las irregularidades del terreno, garantizando un corte uniforme incluso en superficies desniveladas.",
  },
  {
    step: 4,
    title: "Monitoreo y Control",
    description: "Desde la app TerraMow controlás todo: horarios, zonas, altura de corte e historial. Recibís notificaciones en tiempo real sobre el estado del robot.",
    icon: Smartphone,
    detail: "Interfaz intuitiva con vista del mapa en vivo, estadísticas de corte y alertas de mantenimiento predictivo.",
  },
];

const techAdvantages = [
  {
    icon: Eye,
    title: "Visión por IA sin cables perimetrales",
    description: "A diferencia de los robots tradicionales que necesitan cables enterrados para definir los límites, la V Series usa visión artificial avanzada. Esto significa: cero obra civil, instalación en minutos y adaptación instantánea si cambiás el diseño del jardín.",
    stat: "0 cables",
    statLabel: "necesarios",
  },
  {
    icon: Leaf,
    title: "Mulching: fertilización natural",
    description: "Las micro-partículas de césped cortado se reintegran al suelo como fertilizante orgánico. El resultado es un césped más verde, más sano y con menor necesidad de riego y fertilizantes químicos.",
    stat: "30%",
    statLabel: "menos riego",
  },
  {
    icon: TrendingDown,
    title: "Consumo energético mínimo",
    description: "Un robot cortacésped consume en promedio lo mismo que cargar un celular. Comparado con una cortadora a combustión, el ahorro energético es del 95% y las emisiones de CO₂ son nulas.",
    stat: "95%",
    statLabel: "menos energía",
  },
  {
    icon: Shield,
    title: "Seguridad avanzada",
    description: "Sensores ultrasónicos, de impacto y de elevación detienen las cuchillas instantáneamente ante cualquier peligro. Sistema antirrobo con PIN, alarma y rastreo GPS.",
    stat: "< 0.1s",
    statLabel: "tiempo de reacción",
  },
];

const Tecnologia = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Tecnología Robot Cortacésped con IA"
        description="Guía completa sobre cómo funciona un robot cortacésped con inteligencia artificial TerraMow. Navegación autónoma, ahorro de tiempo y comparativa vs corte manual."
        canonical="/tecnologia"
        jsonLd={[breadcrumbTecnologia, howItWorksSchema]}
      />
      {/* Navbar simplificado */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Robot Cortacésped Argentina" className="h-10 lg:h-14 w-auto" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Volver al inicio
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 lg:pt-36 pb-16 lg:pb-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-4 block">
            Guía Tecnológica
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            ¿Cómo funciona un <span className="text-gradient">Robot Cortacésped</span>?
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Descubrí en detalle la tecnología detrás de la V Series de TerraMow: inteligencia artificial, navegación autónoma y ahorro real de tiempo y dinero.
          </p>
        </div>
      </section>

      {/* Cómo funciona - Diagrama de pasos */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Así trabaja el robot, paso a paso</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Desde que lo encendés hasta que tu jardín está perfecto, sin que hagas nada.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {howItWorks.map((step, idx) => (
              <div key={step.step} className="relative">
                {idx < howItWorks.length - 1 && (
                  <div className="absolute left-8 top-24 w-0.5 h-16 bg-gradient-to-b from-primary/40 to-transparent hidden lg:block" />
                )}
                <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8 rounded-2xl border border-border bg-background hover:border-primary/30 transition-all duration-300">
                  <div className="lg:w-1/3 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <step.icon className="text-primary" size={28} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Paso {step.step}</span>
                        <h3 className="text-xl font-bold mt-1">{step.title}</h3>
                      </div>
                    </div>
                    <img
                      src={stepImages[idx]}
                      alt={step.title}
                      loading="lazy"
                      width={640}
                      height={640}
                      className="w-full rounded-xl object-cover aspect-square"
                    />
                  </div>
                  <div className="lg:w-2/3 space-y-3">
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="text-primary font-semibold">Detalle técnico:</span> {step.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ventajas tecnológicas con stats */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ventajas tecnológicas clave</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada característica está diseñada para darte el mejor resultado con el menor esfuerzo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {techAdvantages.map((adv) => (
              <div
                key={adv.title}
                className="p-6 lg:p-8 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <adv.icon className="text-primary" size={24} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{adv.stat}</div>
                    <div className="text-xs text-muted-foreground">{adv.statLabel}</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{adv.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{adv.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparativa de tiempo */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <Timer className="text-primary" size={28} />
              <h2 className="text-3xl md:text-4xl font-bold">Ahorro real de tiempo</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Mirá cuántas horas recuperás al año dejando que el robot haga el trabajo pesado.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 p-4 rounded-t-2xl bg-primary/10 border border-primary/20 text-sm font-semibold">
              <div>Tarea</div>
              <div className="text-center">Manual</div>
              <div className="text-center">Robot</div>
              <div className="text-center text-primary">Ahorro</div>
            </div>
            {/* Rows */}
            {timeComparison.map((row, idx) => (
              <div
                key={row.task}
                className={`grid grid-cols-4 gap-4 p-4 border-x border-b border-border text-sm ${
                  idx % 2 === 0 ? "bg-background" : "bg-secondary/30"
                } ${idx === timeComparison.length - 1 ? "rounded-b-2xl" : ""}`}
              >
                <div className="font-medium text-foreground">{row.task}</div>
                <div className="text-center text-muted-foreground">{row.manual}</div>
                <div className="text-center text-primary font-medium">{row.robot}</div>
                <div className="text-center font-bold text-primary">{row.savings}</div>
              </div>
            ))}

            <div className="mt-8 p-6 rounded-2xl border border-primary/20 bg-primary/5 text-center">
              <div className="text-5xl font-bold text-primary mb-2">+168 hs</div>
              <p className="text-muted-foreground">
                de tiempo libre por año — equivale a <span className="text-foreground font-semibold">21 días laborables</span> completos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Manual vs Robot */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Corte manual vs. Robot con IA</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Una comparativa clara para que veas por qué cada vez más hogares eligen la automatización.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4 p-4 rounded-t-2xl bg-primary/10 border border-primary/20 text-sm font-semibold">
              <div>Característica</div>
              <div className="text-center">Manual</div>
              <div className="text-center">Robot IA</div>
            </div>
            {manualVsRobot.map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 gap-4 p-4 border-x border-b border-border text-sm ${
                  idx % 2 === 0 ? "bg-background" : "bg-secondary/30"
                } ${idx === manualVsRobot.length - 1 ? "rounded-b-2xl" : ""}`}
              >
                <div className="font-medium">{row.feature}</div>
                <div className="flex justify-center">
                  {row.manual ? (
                    <CheckCircle2 size={20} className="text-muted-foreground" />
                  ) : (
                    <XCircle size={20} className="text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex justify-center">
                  {row.robot ? (
                    <CheckCircle2 size={20} className="text-primary" />
                  ) : (
                    <XCircle size={20} className="text-muted-foreground/40" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diagrama visual del ciclo de trabajo */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ciclo de trabajo autónomo</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              El robot repite este ciclo de forma autónoma, manteniendo tu jardín siempre perfecto.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              {[
                { icon: "🔋", label: "Carga en base", time: "~60 min" },
                { icon: "🗺️", label: "Analiza el mapa", time: "~30 seg" },
                { icon: "✂️", label: "Corta el césped", time: "~90 min" },
                { icon: "🏠", label: "Regresa a base", time: "Auto" },
              ].map((phase, idx) => (
                <div key={phase.label} className="flex items-center gap-4 sm:gap-2 sm:flex-col">
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-primary/20 to-primary/5 border border-border text-center min-w-[120px]">
                    <div className="text-3xl sm:text-4xl mb-2">{phase.icon}</div>
                    <h4 className="font-semibold text-sm mb-1">{phase.label}</h4>
                    <span className="text-xs text-primary font-medium">{phase.time}</span>
                  </div>
                  {idx < 3 && (
                    <span className="text-primary text-xl font-bold sm:rotate-0 rotate-90 hidden sm:block">→</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
                ↻ El ciclo se repite automáticamente según tu programación
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para recuperar tu tiempo?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Explorá los modelos V600 y V1000 de TerraMow y elegí el que mejor se adapte a tu jardín.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://sergiogaguero.mitiendanube.com/productos/robot-cortacesped-terramow-v600/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Ver TerraMow V600
            </a>
            <a
              href="https://sergiogaguero.mitiendanube.com/productos/robot-cortacesped-terramow-v1000/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors"
            >
              Ver TerraMow V1000
            </a>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 mt-8 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Robot Cortacésped Argentina — Distribuidor autorizado de{" "}
            <a href="https://www.terramow.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              TerraMow
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Tecnologia;
