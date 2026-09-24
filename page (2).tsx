"use client";
import { useMemo, useState } from "react";
import { catalog, offersById, suppliersById, unitPrice } from "@/lib/catalog";
import { fmtDate, fmtUnitPrice } from "@/lib/format";

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function CatalogoPage() {
  const [q, setQ] = useState("");
  const [onlyMulti, setOnlyMulti] = useState(true);
  const groups = useMemo(() => {
    const t = norm(q.trim());
    return catalog.groups
      .filter((g) => (!onlyMulti || g.offers.length > 1) && (!t || norm(g.name + " " + g.category).includes(t)))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [q, onlyMulti]);

  return (
    <main>
      <h1>Precios por proveedor</h1>
      <p className="sub">{catalog.groups.length} productos · {catalog.groups.filter((g) => g.offers.length > 1).length} se compran a más de un proveedor.</p>
      <div className="search">
        <input type="search" placeholder="Buscar en precios…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en precios" />
      </div>
      <div className="filters">
        <label><input type="checkbox" checked={onlyMulti} onChange={(e) => setOnlyMulti(e.target.checked)} /> Solo productos con varios proveedores</label>
        <span>{groups.length} resultados</span>
      </div>
      {groups.map((g) => {
        const rows = g.offers
          .map((x) => {
            const o = offersById.get(x.offerId)!;
            return { o, p: unitPrice(o, x.qtyPerPriceUnit), sup: suppliersById.get(o.supplierId)?.name ?? o.supplierId };
          })
          .sort((a, b) => a.p - b.p);
        const best = rows[0]?.p ?? 0;
        return (
          <section key={g.id} className="group">
            <div className="group-head">
              <span className="name">{g.name}</span>
              <span className="cat">{g.category}</span>
            </div>
            <ul className="offers">
              {rows.map((r, i) => (
                <li key={r.o.id} className={i === 0 && rows.length > 1 ? "best" : ""}>
                  <span>{r.sup}: {r.o.name}</span>
                  <span>
                    {fmtUnitPrice(r.p, g.baseUnit)}
                    {i > 0 && best > 0 ? <span className="diff"> +{Math.round((r.p / best - 1) * 100)} %</span> : null}
                  </span>
                  <span className="note">Precio del {fmtDate(r.o.date)}{r.o.note ? ` · ${r.o.note}` : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
