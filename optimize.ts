import { groupsById, offersById, suppliersById, unitPrice, daysOld } from "./catalog";
import type { ListItem, Offer } from "./types";

export const STALE_DAYS = 60;

export type Option = {
  offer: Offer;
  supplierId: string;
  unitPrice: number; // € por unidad base
  buyQty: number; // unidades base que realmente se compran (redondeo a caja)
  packs: number | null;
  pack: number | null;
  cost: number;
};

export type Line = {
  groupId: string;
  name: string;
  baseUnit: string;
  qty: number;
  chosen: Option;
  alternatives: Option[]; // ordenadas de más barata a más cara, sin la elegida
  stale: boolean;
  ageDays: number | null;
  movedForFee?: boolean;
};

export type SupplierOrder = {
  supplierId: string;
  supplierName: string;
  lines: Line[];
  subtotal: number;
  fee: number;
  total: number;
};

export type Plan = {
  orders: SupplierOrder[];
  total: number;
  savingsVsNext: number; // frente a la segunda opción de cada producto
  comparableLines: number;
  staleLines: number;
  missing: string[];
};

function optionFor(offer: Offer, qtyPerPriceUnit: number, pack: number | null, qty: number): Option {
  const up = unitPrice(offer, qtyPerPriceUnit);
  let buyQty = qty;
  let packs: number | null = null;
  if (pack && pack > 0) {
    packs = Math.max(1, Math.ceil(qty / pack - 1e-9));
    buyQty = +(packs * pack).toFixed(3);
  }
  return { offer, supplierId: offer.supplierId, unitPrice: up, buyQty, packs, pack, cost: buyQty * up };
}

export function buildPlan(items: ListItem[], excluded: string[] = []): Plan {
  const lines: Line[] = [];
  const missing: string[] = [];
  for (const it of items) {
    const g = groupsById.get(it.groupId);
    if (!g || it.qty <= 0) { if (!g) missing.push(it.groupId); continue; }
    const opts = g.offers
      .map((x) => {
        const o = offersById.get(x.offerId);
        if (!o || excluded.includes(o.supplierId)) return null;
        return optionFor(o, x.qtyPerPriceUnit, x.pack, it.qty);
      })
      .filter((x): x is Option => !!x)
      .sort((a, b) => a.cost - b.cost);
    if (!opts.length) { missing.push(g.name); continue; }
    const [chosen, ...alternatives] = opts;
    const ageDays = daysOld(chosen.offer.date);
    lines.push({ groupId: g.id, name: g.name, baseUnit: g.baseUnit, qty: it.qty, chosen, alternatives, ageDays, stale: ageDays !== null && ageDays > STALE_DAYS });
  }

  // Si un proveedor cobra gastos por pedido y sus productos cuestan menos en otro proveedor ya usado
  // (sumando la diferencia), se mueven para ahorrarse el cargo.
  const used = () => new Set(lines.map((l) => l.chosen.supplierId));
  for (const s of Array.from(used())) {
    const fee = suppliersById.get(s)?.feePerOrder ?? 0;
    if (!fee) continue;
    const mine = lines.filter((l) => l.chosen.supplierId === s);
    const others = used(); others.delete(s);
    let extra = 0; const moves: [Line, Option][] = [];
    for (const l of mine) {
      const alt = l.alternatives.find((a) => others.has(a.supplierId));
      if (!alt) { extra = Infinity; break; }
      extra += alt.cost - l.chosen.cost; moves.push([l, alt]);
    }
    if (extra < fee) {
      for (const [l, alt] of moves) {
        l.alternatives = [l.chosen, ...l.alternatives.filter((a) => a !== alt)].sort((a, b) => a.cost - b.cost);
        l.chosen = alt; l.movedForFee = true;
      }
    }
  }

  const bySup = new Map<string, Line[]>();
  for (const l of lines) bySup.set(l.chosen.supplierId, [...(bySup.get(l.chosen.supplierId) ?? []), l]);
  const orders: SupplierOrder[] = Array.from(bySup.entries()).map(([sid, ls]) => {
    const sup = suppliersById.get(sid);
    const subtotal = ls.reduce((a, l) => a + l.chosen.cost, 0);
    const fee = sup?.feePerOrder ?? 0;
    return { supplierId: sid, supplierName: sup?.name ?? sid, lines: ls, subtotal, fee, total: subtotal + fee };
  }).sort((a, b) => b.total - a.total);

  const comparable = lines.filter((l) => l.alternatives.length > 0);
  const savingsVsNext = comparable.reduce((a, l) => a + Math.max(0, l.alternatives[0].cost - l.chosen.cost), 0);
  return {
    orders,
    total: orders.reduce((a, o) => a + o.total, 0),
    savingsVsNext,
    comparableLines: comparable.length,
    staleLines: lines.filter((l) => l.stale).length,
    missing,
  };
}
