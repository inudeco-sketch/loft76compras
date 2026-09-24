const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 3 });
export const fmtEur = (n: number) => eur.format(n);
export const fmtNum = (n: number) => num.format(n);
export function fmtUnitPrice(n: number, unit: string) {
  const digits = n < 1 ? 3 : 2;
  return `${n.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits })} €/${unit}`;
}
export function fmtDate(iso: string | null) {
  if (!iso) return "sin fecha";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
