import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <a href="#" className="flex items-center">
            <img src={logo} alt="Robot Cortacésped Argentina" className="h-10 lg:h-14 w-auto" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#productos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Productos
            </a>
            <a href="#tecnologia" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Tecnología
            </a>
            <a href="#nosotros" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Nosotros
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </a>
            <a
              href="https://sergiogaguero.mitiendanube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Tienda Online
            </a>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-6 flex flex-col gap-4">
            <a href="#productos" onClick={() => setIsOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Productos</a>
            <a href="#tecnologia" onClick={() => setIsOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Tecnología</a>
            <a href="#nosotros" onClick={() => setIsOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Nosotros</a>
            <a href="#faq" onClick={() => setIsOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
            <a
              href="https://sergiogaguero.mitiendanube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg text-center hover:opacity-90 transition-opacity"
            >
              Tienda Online
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
