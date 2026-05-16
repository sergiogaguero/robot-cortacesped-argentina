import { SiWhatsapp } from "react-icons/si";

export function WhatsAppButton() {
  const whatsappNumber = "5492494028837";
  const message = "Estoy interesado en el producto";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-whatsapp-pulse"
      aria-label="Contactar por WhatsApp"
    >
      <SiWhatsapp className="w-7 h-7" />
    </a>
  );
}
