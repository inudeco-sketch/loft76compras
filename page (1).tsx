"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { catalog, suppliersById } from "@/lib/catalog";
import { buildPlan, STALE_DAYS, type SupplierOrder } from "@/lib/optimize";
import { fmtDate, fmtEur, fmtNum, fmtUnitPrice } from "@/lib/format";
import { useExcluded, useList } from "@/lib/store";

function orderText(o: SupplierOrder) {
  const lines = o.lines.map((l) => {
    const packs = l.chosen.packs && l.chosen.pack && l.chosen.pack !== 1 ? ` (${l.chosen.packs} × ${fmtNum(l.chosen.pack)} ${l.baseUnit})` : "";
    return `- ${l.chosen.offer.name}${l.chosen.offer.code ? ` [${l.chosen.offer.code}]` : ""}: ${fmtNum(l.chosen.buyQty)} ${l.baseUnit}${packs}`;
  });
  return `Pedido LOFT76 (F&F C.B.) – C/ María Lejarraga, 1 Bajo, Guadalajara\n\n${lines.join("\n")}\n\nGracias.`;
}

export default function PedidoPage() {
  const { items } = useList();
  const { excluded, toggle } = useExcluded();
  const plan = useMemo(() => buildPlan(items, excluded), [items, excluded]);
  const [copied, setCopied] = useState<string | null>(null);
  const usedSuppliers = catalog.suppliers.filter((s) => !s.exclusive);

  if (items.length === 0) {
    return (
      <main>
        <h1>Pedido</h1>
        <p className="empty">No hay nada en la lista. <Link href="/">Añade productos</Link> y aquí verás a qué proveedor pedir cada uno.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Dónde comprar</h1>
      <p className="sub">Cada producto va al proveedor con el precio neto más bajo, redondeando a cajas completas.</p>

      <section className="summary" aria-label="Resumen">
        <div className="stat"><b>{fmtEur(plan.total)}</b><span>total estimado sin IVA</span></div>
        <div className="stat"><b>{plan.orders.length}</b><span>{plan.orders.length === 1 ? "proveedor" : "proveedores"}</span></div>
        <div className="stat good"><b>{fmtEur(plan.savingsVsNext)}</b><span>ahorro frente a la segunda opción ({plan.comparableLines} productos comparables)</span></div>
        {plan.staleLines > 0 && <div className="stat warn"><b>{plan.staleLines}</b><span>precios con más de {STALE_DAYS} días: confirmar</span></div>}
      </section>

      <div className="tickets">
        {plan.orders.map((o) => {
          const sup = suppliersById.get(o.supplierId);
          const text = orderText(o);
          return (
            <article key={o.supplierId} className="ticket" aria-label={`Pedido a ${o.supplierName}`}>
              <div className="ticket-head">
                <h2>{o.supplierName}</h2>
                <span className="cat">{sup?.categoria}</span>
              </div>
              <ul className="lines">
                {o.lines.map((l) => {
                  const alt = l.alternatives[0];
                  const altSup = alt ? suppliersById.get(alt.supplierId)?.name : null;
                  return (
                    <li key={l.groupId} className="line">
                      <span className="name">{l.chosen.offer.name}</span>
                      <span className="cost">{fmtEur(l.chosen.cost)}</span>
                      <span className="detail">
                        {fmtNum(l.chosen.buyQty)} {l.baseUnit}
                        {l.chosen.packs && l.chosen.pack && l.chosen.pack !== 1 ? ` · ${l.chosen.packs} × ${fmtNum(l.chosen.pack)} ${l.baseUnit}` : ""}
                        {l.chosen.buyQty > l.qty ? ` (pedías ${fmtNum(l.qty)})` : ""}
                        {` · ${fmtUnitPrice(l.chosen.unitPrice, l.baseUnit)} · precio del ${fmtDate(l.chosen.offer.date)}`}
                      </span>
                      <span />
                      {alt && (
                        <span className="alt">
                          Siguiente opción: {altSup} a {fmtUnitPrice(alt.unitPrice, l.baseUnit)} (+{fmtEur(alt.cost - l.chosen.cost)})
                          {l.movedForFee ? " · agrupado para no pagar portes de otro proveedor" : ""}
                        </span>
                      )}
                      {l.stale && <span className="flag">Precio de hace {l.ageDays} días: confirma con el proveedor antes de pedir.</span>}
                      {l.chosen.offer.note && /verificar|prueba|confirmar|reclamar|pendiente/i.test(l.chosen.offer.note) && (
                        <span className="flag">{l.chosen.offer.note}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="ticket-foot">
                <span className="ticket-total">{fmtEur(o.total)}{o.fee ? <small style={{ fontSize: 14, fontFamily: "var(--texto)", fontWeight: 400 }}> (incl. {fmtEur(o.fee)} de gestión)</small> : null}</span>
                <div className="ticket-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(o.supplierId); setTimeout(() => setCopied(null), 1800); } catch {} }}
                  >
                    {copied === o.supplierId ? "Pedido copiado" : "Copiar pedido"}
                  </button>
                  <a className="btn btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
                    Enviar por WhatsApp
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {plan.missing.length > 0 && (
        <p className="note-box">Sin proveedor disponible para: {plan.missing.join(", ")}. Revisa los proveedores excluidos.</p>
      )}

      <h2 style={{ marginTop: 32 }}>Proveedores excluidos</h2>
      <p className="sub" style={{ marginTop: 6 }}>Toca un proveedor para no tenerlo en cuenta (por ejemplo, si hoy no reparte).</p>
      <div className="excl">
        {usedSuppliers.map((s) => (
          <button key={s.id} type="button" className="chip" aria-pressed={excluded.includes(s.id)} onClick={() => toggle(s.id)}>
            {s.name}
          </button>
        ))}
      </div>

      <p className="note-box">
        Precios sin IVA sacados de facturas de 2026, de la tarifa de Foster de septiembre y de la propuesta de Prodesco del 24/09.
        La calidad no se compara: si un producto dice “verificar” o “prueba”, confírmalo con Ivan antes de cambiar de proveedor.
        Coca-Cola no aparece porque no tiene alternativa.
      </p>
    </main>
  );
}
