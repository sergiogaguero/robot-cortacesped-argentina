export const site = {
  url: "https://www.robotscortacesped.com.ar",
  name: "Robot Cortacésped Argentina",
  tagline: "Robots cortacésped con inteligencia artificial en Argentina",
  hookii: "https://hookii.com/",
  locale: "es_AR",
  lang: "es-AR",
  whatsapp: {
    number: "5492494028837",
    display: "+54 9 2494 02-8837",
  },
  email: "ventas@robotscortacesped.com.ar",
  instagram: "https://www.instagram.com/robotscortacesped_argentina/",
  terramow: "https://www.terramow.com/",
  location: { locality: "Buenos Aires", country: "AR" },
  exchangeRate: { fallback: 1200, ttlMinutes: 60, timeoutMs: 4000 },
  googleSiteVerification: "1yzojphGNe10deN-CMqx2NHtcYYhzQPkoySsWLobITI",
} as const;

/** ID de Google Analytics 4 (G-XXXXXXX). Vacío = GA desactivado. */
export const gaId: string = import.meta.env.PUBLIC_GA_ID ?? "";
