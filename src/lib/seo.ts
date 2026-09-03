import { site } from "@/config/site";

/** URL canónica absoluta: sin barra final (salvo la home) ni index.html. */
export function canonicalUrl(pathname: string): string {
  let path = pathname.replace(/index\.html$/, "");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (!path.startsWith("/")) path = `/${path}`;
  return `${site.url}${path}`;
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
