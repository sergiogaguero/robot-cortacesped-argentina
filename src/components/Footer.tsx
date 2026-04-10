import { Mail, MapPin, ExternalLink } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <img src={logo} alt="Robot Cortacésped Argentina" className="h-12 w-auto mb-4" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Distribuidor oficial de robots cortacésped TerraMow en Argentina. Tecnología de punta para el cuidado inteligente de tu jardín.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Enlaces</h4>
            <ul className="space-y-3">
              <li>
                <a href="#productos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Productos
                </a>
              </li>
              <li>
                <a href="#tecnologia" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Tecnología
                </a>
              </li>
              <li>
                <a
                  href="https://sergiogaguero.mitiendanube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Tienda Online <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.terramow.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  TerraMow Oficial <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={16} className="text-primary shrink-0" />
                Buenos Aires, Argentina
              </li>
              <li>
                <a
                  href="https://sergiogaguero.mitiendanube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink size={16} className="text-primary shrink-0" />
                  sergiogaguero.mitiendanube.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Robot Cortacésped Argentina. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Distribuidor autorizado de{" "}
            <a href="https://www.terramow.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              TerraMow
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
