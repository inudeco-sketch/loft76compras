import raw from "@/data/catalog.json";
import type { Catalog, Group, Offer, Supplier } from "./types";

export const catalog = raw as Catalog;

export const suppliersById = new Map<string, Supplier>(catalog.suppliers.map((s) => [s.id, s]));
export const offersById = new Map<string, Offer>(catalog.offers.map((o) => [o.id, o]));
export const groupsById = new Map<string, Group>(catalog.groups.map((g) => [g.id, g]));

/** Precio neto por unidad de precio (aplica descuento o neto conocido) */
export function netPerPriceUnit(o: Offer): number {
  if (typeof o.netPrice === "number") return o.netPrice;
  return o.price * (1 - (o.discount || 0));
}

/** Precio neto por unidad base del grupo */
export function unitPrice(o: Offer, qtyPerPriceUnit: number): number {
  return netPerPriceUnit(o) / (qtyPerPriceUnit || 1);
}

export function daysOld(date: string | null, today = new Date()): number | null {
  if (!date) return null;
  const d = new Date(date + "T12:00:00");
  return Math.round((today.getTime() - d.getTime()) / 86400000);
}

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function searchGroups(q: string, limit = 25): Group[] {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { g: Group; score: number }[] = [];
  for (const g of catalog.groups) {
    const hay = norm(
      g.name + " " + g.category + " " + g.offers.map((x) => {
        const o = offersById.get(x.offerId);
        return o ? o.name + " " + (suppliersById.get(o.supplierId)?.name ?? "") : "";
      }).join(" ")
    );
    if (terms.every((t) => hay.includes(t))) {
      const score = (norm(g.name).startsWith(terms[0]) ? 2 : 0) + (g.offers.length > 1 ? 1 : 0);
      scored.push({ g, score });
    }
  }
  return scored.sort((a, b) => b.score - a.score || a.g.name.localeCompare(b.g.name)).slice(0, limit).map((x) => x.g);
}
