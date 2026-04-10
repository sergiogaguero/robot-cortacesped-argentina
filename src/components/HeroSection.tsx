import { ArrowDown } from "lucide-react";
import heroImage from "@/assets/hero-mower.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Robot cortacésped TerraMow en césped"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8 pt-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 backdrop-blur-sm mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              Distribuidor oficial en Argentina
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            El futuro del
            <br />
            <span className="text-gradient">corte inteligente</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Robots cortacésped TerraMow V Series. Navegación con IA, sin cables, sin antenas. Tu jardín perfecto con un solo click.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <a
              href="#productos"
              className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
            >
              Ver Modelos
            </a>
            <a
              href="#tecnologia"
              className="px-8 py-4 border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors text-center"
            >
              Descubrí la Tecnología
            </a>
          </div>
        </div>
      </div>

      <a
        href="#productos"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float"
      >
        <ArrowDown className="text-muted-foreground" size={24} />
      </a>
    </section>
  );
};

export default HeroSection;
