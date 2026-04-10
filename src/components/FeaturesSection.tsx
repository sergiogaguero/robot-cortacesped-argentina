import { Link } from "react-router-dom";
import { Brain, Wifi, Map, Scissors, Smartphone, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Visión con IA Pura",
    description: "Sin cables, sin antenas RTK. Navegación inteligente que se adapta a cualquier jardín complejo en minutos.",
  },
  {
    icon: Map,
    title: "Mapeo Automático",
    description: "Con un solo click, el robot explora y mapea tu jardín. Personalizá zonas y configuraciones desde la app.",
  },
  {
    icon: Scissors,
    title: "Corte de Bordes Avanzado",
    description: "Configuración por segmentos para navegar arbustos y troncos a lo largo de los límites del césped.",
  },
  {
    icon: Wifi,
    title: "100% Inalámbrico",
    description: "Sin cables perimetrales ni estaciones base complejas. Instalación simple y limpia.",
  },
  {
    icon: Smartphone,
    title: "Control Total vía App",
    description: "Programá horarios, ajustá la altura de corte y monitoreá en tiempo real desde tu celular.",
  },
  {
    icon: Shield,
    title: "Seguro e Inteligente",
    description: "Sensores de detección de obstáculos y sistema antirrobo con PIN y alarma integrada.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="tecnologia" className="py-24 lg:py-32 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-4 block">
            Innovación
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tecnología que trabaja por vos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            La V Series de TerraMow redefine el cuidado del jardín con inteligencia artificial de última generación.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 lg:p-8 rounded-2xl border border-border bg-background hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/tecnologia"
            className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/10 transition-colors text-sm"
          >
            Ver guía tecnológica completa →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
