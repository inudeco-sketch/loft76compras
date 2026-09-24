"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Lista" },
  { href: "/pedido", label: "Pedido" },
  { href: "/catalogo", label: "Precios" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="top">
      <Link href="/" className="brand">LOFT76 Compras</Link>
      <nav className="tabs" aria-label="Secciones">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="tab" aria-current={path === t.href ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
