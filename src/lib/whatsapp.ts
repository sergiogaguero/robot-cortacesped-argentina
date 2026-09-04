import { site } from "@/config/site";

export type WaContext = "general" | "product" | "priceARS" | "article" | "compare";

export function whatsappMessage(context: WaContext, subject = ""): string {
  switch (context) {
    case "product":
      return `Hola, quiero consultar por el ${subject}.`;
    case "priceARS":
      return `Hola, quiero saber el precio en pesos del ${subject}.`;
    case "article":
      return `Hola, leí la guía "${subject}" y tengo una consulta.`;
    case "compare":
      return "Hola, no sé si me conviene el V600 o el V1000. ¿Me ayudan a elegir?";
    case "general":
    default:
      return "Hola, quiero consultar por los robots cortacésped TerraMow.";
  }
}

export function whatsappUrl(context: WaContext, subject?: string): string {
  const text = encodeURIComponent(whatsappMessage(context, subject));
  return `https://wa.me/${site.whatsapp.number}?text=${text}`;
}
