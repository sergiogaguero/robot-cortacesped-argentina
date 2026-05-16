import { useNavigate } from "react-router-dom";
import { SiWhatsapp } from "react-icons/si";
import { ArrowLeft, Check } from "lucide-react";
import mowerV1000 from "@/assets/mower-v1000.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProductDetail = () => {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    const whatsappNumber = "5492494028837";
    const message = "Estoy interesado en comprar el robot TerraMow V1000";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const specifications = [
    {
      category: "Parámetros Generales",
      items: [
        { label: "Tecnología de Navegación", value: "TerraVision™ 2.0 Visión AI de triple cámara" },
        { label: "Conectividad de red", value: "Wi-Fi / Red celular 4G" },
        { label: "Área de corte recomendada", value: "1200 m² (0,3 acres)" },
        { label: "Área de Corte por Hora", value: "80-120 m² (depende de la complejidad del césped)" },
        { label: "Área de Corte por Carga Completa", value: "160-300 m²" },
        { label: "Altura de corte", value: "25-75 mm (1″-3″)" },
        { label: "Ancho de Corte", value: "203 mm (8″)" },
      ],
    },
    {
      category: "Funciones Inteligentes",
      items: [
        { label: "Mapeo Automático de IA", value: "Sí", isFeature: true },
        { label: "Evitación de Obstáculos 3D", value: "Sí", isFeature: true },
        { label: "Ajuste Eléctrico de Altura de Corte", value: "Sí", isFeature: true },
        { label: "Recarga Automática", value: "Sí", isFeature: true },
        { label: "Detección de lluvia", value: "Sí", isFeature: true },
        { label: "Actualización OTA (Over-the-Air)", value: "Sí", isFeature: true },
      ],
    },
    {
      category: "Batería",
      items: [
        { label: "Capacidad de la batería", value: "4,5 Ah / 98,55 Wh" },
        { label: "Tiempo de carga", value: "120 minutos" },
        { label: "Duración por carga completa", value: "150 minutos" },
      ],
    },
    {
      category: "Otras Especificaciones",
      items: [
        { label: "Nivel de ruido", value: "< 54 dB" },
        { label: "Clasificación de impermeabilidad IP", value: "IPX6" },
        { label: "Temperatura recomendada", value: "0-55 °C (32-131 °F)" },
        { label: "Inclinación máxima de operación", value: "18° (32,5%)" },
        { label: "Voltaje de trabajo", value: "24V CC" },
        { label: "Peso del Robot", value: "11,8 kg (26 libras)" },
        { label: "Dimensiones del Robot", value: "60,2 x 39,4 x 33,1 cm" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span>Volver a productos</span>
          </button>

          {/* Product Header */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Image Section */}
            <div className="flex items-center justify-center">
              <div className="aspect-square w-full max-w-md bg-secondary/30 rounded-2xl overflow-hidden">
                <img
                  src={mowerV1000}
                  alt="Robot cortacésped TerraMow V1000"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Info Section */}
            <div className="flex flex-col justify-center">
              <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
                V Series
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">TerraMow V1000</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Máxima potencia y cobertura para jardines grandes
              </p>

              {/* Price */}
              <div className="mb-8">
                <p className="text-sm text-muted-foreground mb-2">Precio:</p>
                <p className="text-4xl font-bold text-primary">$2,100 USD</p>
              </div>

              {/* Key Features */}
              <div className="mb-8 space-y-3">
                <p className="font-semibold text-sm uppercase text-muted-foreground">Características principales:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <Check className="text-green-500" size={20} />
                    <span>Navegación IA sin cables ni antenas RTK</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="text-green-500" size={20} />
                    <span>Cobertura hasta 1200 m²</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="text-green-500" size={20} />
                    <span>Visión AI de triple cámara TerraVision™ 2.0</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="text-green-500" size={20} />
                    <span>Impermeabilidad IPX6</span>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 hover:shadow-lg text-lg"
              >
                <SiWhatsapp size={24} />
                Comprar por WhatsApp
              </button>
            </div>
          </div>

          {/* Specifications Section */}
          <section className="mt-24">
            <h2 className="text-3xl font-bold mb-12">Especificaciones Técnicas</h2>

            <div className="space-y-12">
              {specifications.map((spec) => (
                <div key={spec.category} className="border-t border-border pt-8">
                  <h3 className="text-2xl font-semibold mb-6">{spec.category}</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {spec.items.map((item) => (
                      <div key={item.label} className="flex flex-col">
                        <p className="text-sm font-medium text-muted-foreground mb-2">{item.label}</p>
                        <p className="text-base text-foreground flex items-center gap-2">
                          {item.isFeature && <Check className="text-green-500" size={18} />}
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Additional Info */}
          <section className="mt-24 bg-card border border-border rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl font-bold mb-4">¿Por qué elegir el V1000?</h3>
            <p className="text-muted-foreground mb-4">
              El TerraMow V1000 es la solución perfecta para propiedades grandes que requieren un mantenimiento
              profesional. Con cobertura de hasta 1200 m², tecnología IA de última generación y duración de batería
              extendida, proporciona un corte consistente y eficiente sin la necesidad de cables perimetrales o
              sistemas RTK complejos.
            </p>
            <p className="text-muted-foreground">
              Contacta con nosotros por WhatsApp para conocer más detalles, disponibilidad y opciones de financiación.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
