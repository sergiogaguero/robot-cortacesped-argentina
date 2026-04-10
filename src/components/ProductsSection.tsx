import { ArrowRight } from "lucide-react";
import mowerV600 from "@/assets/mower-v600.jpg";
import mowerV1000 from "@/assets/mower-v1000.jpg";

const products = [
  {
    name: "TerraMow V600",
    tagline: "Ideal para jardines medianos",
    image: mowerV600,
    coverage: "Hasta 600 m²",
    features: ["Navegación IA sin cables", "Mapeo automático", "Corte de bordes avanzado", "Control vía App"],
    url: "https://sergiogaguero.mitiendanube.com/productos/robot-cortacesped-terramow-v600/",
    alt: "Robot cortacésped TerraMow V600 con navegación por IA para jardines de hasta 600m²",
  },
  {
    name: "TerraMow V1000",
    tagline: "Máxima potencia y cobertura",
    image: mowerV1000,
    coverage: "Hasta 1000 m²",
    features: ["Navegación IA sin cables", "Mapeo automático", "Corte de bordes avanzado", "Control vía App"],
    url: "https://sergiogaguero.mitiendanube.com/productos/robot-cortacesped-terramow-v1000/",
    alt: "Robot cortacésped TerraMow V1000 con navegación por IA para jardines de hasta 1000m²",
  },
];

const ProductsSection = () => {
  return (
    <section id="productos" className="py-24 lg:py-32" aria-label="Productos robot cortacésped TerraMow">
      <div className="container mx-auto px-4 lg:px-8">
        <header className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-4 block">
            V Series
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Elegí tu robot cortacésped
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Tecnología de punta con visión artificial. Sin cables, sin antenas RTK. Configuración en minutos.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {products.map((product) => (
            <article key={product.name}>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 glow-border hover:animate-pulse-glow"
              >
                <div className="aspect-square overflow-hidden bg-secondary/30">
                  <img
                    src={product.image}
                    alt={product.alt}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                    <ArrowRight className="text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transition-transform duration-300" size={20} />
                  </div>
                  <p className="text-primary font-medium mb-1">{product.coverage}</p>
                  <p className="text-muted-foreground text-sm mb-4">{product.tagline}</p>
                  <ul className="flex flex-wrap gap-2" aria-label={`Características del ${product.name}`}>
                    {product.features.map((f) => (
                      <li
                        key={f}
                        className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 py-3 text-center bg-primary text-primary-foreground font-semibold rounded-lg group-hover:opacity-90 transition-opacity">
                    Comprar ahora
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
