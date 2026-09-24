"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { groupsById, offersById, searchGroups, suppliersById, unitPrice } from "@/lib/catalog";
import { fmtUnitPrice } from "@/lib/format";
import { useList } from "@/lib/store";
import QtyControl from "@/components/QtyControl";
import type { Group } from "@/lib/types";

function bestOf(g: Group) {
  let best: { price: number; supplier: string } | null = null;
  for (const x of g.offers) {
    const o = offersById.get(x.offerId);
    if (!o) continue;
    const p = unitPrice(o, x.qtyPerPriceUnit);
    if (!best || p < best.price) best = { price: p, supplier: suppliersById.get(o.supplierId)?.name ?? "" };
  }
  return best;
}

function defaultQty(g: Group) {
  const packs = g.offers.map((x) => x.pack).filter((p): p is number => !!p);
  return packs.length ? Math.min(...packs) : 1;
}

export default function ListaPage() {
  const { items, setQty, clear, ready } = useList();
  const [q, setQ] = useState("");
  const results = useMemo(() => searchGroups(q), [q]);
  const inList = new Set(items.map((i) => i.groupId));

  return (
    <main>
      <h1>Lista de compra</h1>
      <p className="sub">Añade lo que falta en cocina. La app calcula a qué proveedor pedir cada cosa.</p>

      <div className="search">
        <input
          type="search"
          placeholder="Buscar producto: croqueta, nachos, guantes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar producto"
          autoComplete="off"
        />
      </div>

      {q.trim() && (
        results.length ? (
          <ul className="results">
            {results.map((g) => {
              const best = bestOf(g);
              const added = inList.has(g.id);
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    className="result"
                    onClick={() => { if (!added) setQty(g.id, defaultQty(g)); setQ(""); }}
                  >
                    <span className="name">{g.name}</span>
                    <span className={"add" + (added ? " added" : "")}>{added ? "En lista" : "Añadir"}</span>
                    <span className="meta">
                      {best ? `${fmtUnitPrice(best.price, g.baseUnit)} en ${best.supplier}` : ""}
                      {g.offers.length > 1 ? ` · ${g.offers.length} proveedores` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">No hay ningún producto con “{q}”. Prueba con otra palabra o avisa a Ivan para darlo de alta.</p>
        )
      )}

      {ready && items.length === 0 && !q.trim() && (
        <p className="empty">La lista está vacía. Busca un producto arriba y pulsa “Añadir”.</p>
      )}

      {items.length > 0 && (
        <>
          <ul className="list" aria-label="Productos en la lista">
            {items.map((it) => {
              const g = groupsById.get(it.groupId);
              if (!g) return null;
              const best = bestOf(g);
              return (
                <li key={it.groupId} className="item">
                  <span className="name">{g.name}</span>
                  <QtyControl value={it.qty} unit={g.baseUnit} onChange={(n) => setQty(g.id, n)} />
                  <span className="meta">
                    {best ? `Desde ${fmtUnitPrice(best.price, g.baseUnit)}` : ""}
                    {g.offers.length > 1 ? ` · se compara entre ${g.offers.length}` : " · un solo proveedor"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p><button type="button" className="link" onClick={() => { if (confirm("¿Vaciar la lista?")) clear(); }}>Vaciar lista</button></p>
        </>
      )}

      <div className="bar">
        <div className="bar-inner">
          <span className="count">{items.length} {items.length === 1 ? "producto" : "productos"}</span>
          <Link href="/pedido" className="btn" aria-disabled={items.length === 0}>Ver dónde comprar</Link>
        </div>
      </div>
    </main>
  );
}
