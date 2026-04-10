const SITE_URL = "https://www.robotscortacesped.com.ar";
const STORE_URL = "https://sergiogaguero.mitiendanube.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Robot Cortacésped Argentina",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Distribuidor oficial de robots cortacésped TerraMow en Argentina. Navegación con IA, sin cables perimetrales.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Buenos Aires",
    addressCountry: "AR",
  },
  sameAs: [STORE_URL],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    url: STORE_URL,
    availableLanguage: "es",
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Robot Cortacésped Argentina",
  url: SITE_URL,
  description:
    "Robots cortacésped con inteligencia artificial TerraMow V Series. Envíos a todo el país.",
  inLanguage: "es",
  potentialAction: {
    "@type": "SearchAction",
    target: `${STORE_URL}/search/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const productSchemaV600 = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "TerraMow V600 - Robot Cortacésped con IA",
  description:
    "Robot cortacésped autónomo con navegación por inteligencia artificial. Sin cables perimetrales. Cobertura hasta 600 m². Control vía app, mapeo automático y corte de bordes avanzado.",
  brand: { "@type": "Brand", name: "TerraMow" },
  model: "V600",
  category: "Robot Cortacésped",
  url: `${STORE_URL}/productos/robot-cortacesped-terramow-v600/`,
  offers: {
    "@type": "Offer",
    url: `${STORE_URL}/productos/robot-cortacesped-terramow-v600/`,
    availability: "https://schema.org/InStock",
    priceCurrency: "ARS",
    seller: { "@type": "Organization", name: "Robot Cortacésped Argentina" },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "AR",
      },
    },
  },
  additionalProperty: [
    { "@type": "PropertyValue", name: "Cobertura", value: "Hasta 600 m²" },
    { "@type": "PropertyValue", name: "Navegación", value: "IA sin cables" },
    { "@type": "PropertyValue", name: "Control", value: "App iOS/Android" },
  ],
};

export const productSchemaV1000 = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "TerraMow V1000 - Robot Cortacésped con IA",
  description:
    "Robot cortacésped autónomo de alta cobertura con navegación por inteligencia artificial. Sin cables perimetrales. Cobertura hasta 1000 m². Control vía app, mapeo automático y corte de bordes avanzado.",
  brand: { "@type": "Brand", name: "TerraMow" },
  model: "V1000",
  category: "Robot Cortacésped",
  url: `${STORE_URL}/productos/robot-cortacesped-terramow-v1000/`,
  offers: {
    "@type": "Offer",
    url: `${STORE_URL}/productos/robot-cortacesped-terramow-v1000/`,
    availability: "https://schema.org/InStock",
    priceCurrency: "ARS",
    seller: { "@type": "Organization", name: "Robot Cortacésped Argentina" },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "AR",
      },
    },
  },
  additionalProperty: [
    { "@type": "PropertyValue", name: "Cobertura", value: "Hasta 1000 m²" },
    { "@type": "PropertyValue", name: "Navegación", value: "IA sin cables" },
    { "@type": "PropertyValue", name: "Control", value: "App iOS/Android" },
  ],
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Necesita cables perimetrales para funcionar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Los robots TerraMow V Series utilizan visión artificial con IA para navegar. No requieren cables perimetrales, antenas RTK ni balizas.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué superficie cubre cada modelo de robot cortacésped TerraMow?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "El TerraMow V600 cubre hasta 600 m² y es ideal para jardines medianos. El V1000 cubre hasta 1000 m², perfecto para terrenos más amplios.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo se controla el robot cortacésped?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A través de la app TerraMow, disponible para iOS y Android. Desde ahí podés programar horarios, ajustar la altura de corte, definir zonas de trabajo y monitorear el progreso en tiempo real.",
      },
    },
    {
      "@type": "Question",
      name: "¿El robot cortacésped es seguro con mascotas y niños?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Los robots cuentan con sensores de detección de obstáculos que los detienen o redirigen automáticamente. Además, incluyen sistema antirrobo con PIN y alarma.",
      },
    },
    {
      "@type": "Question",
      name: "¿Hacen envíos de robots cortacésped a todo el país?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí, realizamos envíos a toda la Argentina. Podés hacer tu compra directamente desde nuestra tienda online.",
      },
    },
    {
      "@type": "Question",
      name: "¿Ofrecen garantía en los robots cortacésped TerraMow?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Todos nuestros productos cuentan con garantía oficial. Además, ofrecemos soporte técnico local para cualquier consulta o necesidad de mantenimiento.",
      },
    },
  ],
};

export const breadcrumbHome = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: SITE_URL,
    },
  ],
};

export const breadcrumbTecnologia = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Tecnología",
      item: `${SITE_URL}/tecnologia`,
    },
  ],
};

export const howItWorksSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Cómo funciona un robot cortacésped con IA TerraMow",
  description:
    "Guía paso a paso del funcionamiento del robot cortacésped autónomo TerraMow V Series con navegación por inteligencia artificial.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Mapeo Inteligente",
      text: "El robot recorre el jardín utilizando cámaras y sensores para crear un mapa 3D preciso del terreno.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Planificación de Ruta",
      text: "El algoritmo de IA planifica la ruta más eficiente de corte, cubriendo cada centímetro sin repetir zonas.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Corte Autónomo",
      text: "El robot ejecuta el corte de forma autónoma, detectando obstáculos en tiempo real y regresando solo a cargar.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Monitoreo y Control",
      text: "Controlá todo desde la app: horarios, zonas, altura de corte e historial con notificaciones en tiempo real.",
    },
  ],
};
