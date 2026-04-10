import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
  image?: string;
  jsonLd?: object | object[];
}

const SITE_URL = "https://www.robotscortacesped.com.ar";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const SEOHead = ({
  title,
  description,
  canonical = "",
  type = "website",
  image = DEFAULT_IMAGE,
  jsonLd,
}: SEOHeadProps) => {
  const fullUrl = `${SITE_URL}${canonical}`;
  const fullTitle = `${title} | Robot Cortacésped Argentina`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Robot Cortacésped Argentina" />
      <meta property="og:locale" content="es_AR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <meta name="geo.region" content="AR" />
      <meta name="geo.placename" content="Buenos Aires" />
      <meta name="language" content="es" />

      {/* JSON-LD */}
      {jsonLd && (
        Array.isArray(jsonLd)
          ? jsonLd.map((ld, i) => (
              <script key={i} type="application/ld+json">
                {JSON.stringify(ld)}
              </script>
            ))
          : <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
