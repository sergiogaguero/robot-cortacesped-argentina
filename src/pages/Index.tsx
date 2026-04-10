import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";
import FeaturesSection from "@/components/FeaturesSection";
import AboutSection from "@/components/AboutSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import {
  organizationSchema,
  websiteSchema,
  productSchemaV600,
  productSchemaV1000,
  faqSchema,
  breadcrumbHome,
} from "@/lib/seo-data";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Robot Cortacésped con IA TerraMow V Series"
        description="Distribuidor oficial de robots cortacésped TerraMow V Series en Argentina. Navegación con IA, sin cables perimetrales. Comprá online tu V600 o V1000 con envío a todo el país."
        canonical="/"
        jsonLd={[
          organizationSchema,
          websiteSchema,
          productSchemaV600,
          productSchemaV1000,
          faqSchema,
          breadcrumbHome,
        ]}
      />
      <Navbar />
      <main>
        <HeroSection />
        <ProductsSection />
        <FeaturesSection />
        <AboutSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
