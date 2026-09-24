"use client";
import { useEffect, useState } from "react";

export default function QtyControl({ value, unit, onChange }: { value: number; unit: string; onChange: (n: number) => void }) {
  const step = unit === "kg" || unit === "L" ? 0.5 : 1;
  const [text, setText] = useState(String(value).replace(".", ","));
  useEffect(() => setText(String(value).replace(".", ",")), [value]);
  const commit = (t: string) => {
    const n = parseFloat(t.replace(",", "."));
    if (!isNaN(n)) onChange(n);
    else setText(String(value).replace(".", ","));
  };
  return (
    <div className="qty">
      <button type="button" aria-label="Quitar" onClick={() => onChange(Math.max(0, +(value - step).toFixed(3)))}>−</button>
      <input
        inputMode="decimal"
        aria-label={`Cantidad en ${unit}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }}
      />
      <button type="button" aria-label="Añadir" onClick={() => onChange(+(value + step).toFixed(3))}>+</button>
      <span className="unit">{unit}</span>
    </div>
  );
}
