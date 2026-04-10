import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿Necesita cables perimetrales para funcionar?",
    a: "No. Los robots TerraMow V Series utilizan visión artificial con IA para navegar. No requieren cables perimetrales, antenas RTK ni balizas. Simplemente presioná un botón y empezá a cortar.",
  },
  {
    q: "¿Qué superficie cubre cada modelo?",
    a: "El TerraMow V600 cubre hasta 600 m² y es ideal para jardines medianos. El V1000 cubre hasta 1000 m², perfecto para terrenos más amplios.",
  },
  {
    q: "¿Cómo se controla el robot?",
    a: "A través de la app TerraMow, disponible para iOS y Android. Desde ahí podés programar horarios, ajustar la altura de corte, definir zonas de trabajo y monitorear el progreso en tiempo real.",
  },
  {
    q: "¿Es seguro con mascotas y niños?",
    a: "Sí. Los robots cuentan con sensores de detección de obstáculos que los detienen o redirigen automáticamente. Además, incluyen sistema antirrobo con PIN y alarma.",
  },
  {
    q: "¿Hacen envíos a todo el país?",
    a: "Sí, realizamos envíos a toda la Argentina. Podés hacer tu compra directamente desde nuestra tienda online y coordinamos el envío a tu domicilio.",
  },
  {
    q: "¿Ofrecen garantía?",
    a: "Sí. Todos nuestros productos cuentan con garantía oficial. Además, ofrecemos soporte técnico local para cualquier consulta o necesidad de mantenimiento.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 lg:py-32 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-4 block">
              Preguntas Frecuentes
            </span>
            <h2 className="text-3xl md:text-5xl font-bold">
              ¿Tenés dudas?
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-xl px-6 bg-background data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
