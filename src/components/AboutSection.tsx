import { CheckCircle } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="nosotros" className="py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-4 block">
              Sobre Nosotros
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Robot Cortacésped Argentina
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Somos un emprendimiento argentino dedicado a acercar la tecnología más avanzada en robótica de jardín al mercado local.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                "Distribuidor oficial de TerraMow en Argentina",
                "Asesoramiento personalizado para tu jardín",
                "Soporte técnico local y postventa",
                "Envíos a todo el país",
                "Financiación disponible",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="text-primary mt-0.5 shrink-0" size={20} />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-4">¿Por qué elegirnos?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Creemos que mantener un jardín impecable no tiene por qué ser una tarea agotadora. Con los robots cortacésped TerraMow, combinamos lo último en inteligencia artificial con la practicidad que necesitás.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Nuestro equipo te acompaña desde la elección del modelo ideal hasta la configuración y el soporte continuo. Porque tu tiempo vale, dejá que la tecnología trabaje por vos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
