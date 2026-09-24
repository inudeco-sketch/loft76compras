export type Supplier = {
  id: string;
  name: string;
  categoria: string;
  feePerOrder: number;
  exclusive: boolean;
  note?: string;
};

export type Offer = {
  id: string;
  supplierId: string;
  category: string;
  code: string;
  name: string;
  priceUnit: string;
  price: number;
  discount: number;
  netPrice?: number;
  date: string | null;
  note: string;
  firstPrice?: number | null;
  firstDate?: string | null;
};

export type GroupOffer = {
  offerId: string;
  /** Unidades base que contiene la unidad de precio (p. ej. bolsa de 0,9 kg = 0.9) */
  qtyPerPriceUnit: number;
  /** Tamaño mínimo de compra en unidades base (caja de 5 kg = 5). null = se compra la cantidad exacta */
  pack: number | null;
};

export type Group = {
  id: string;
  name: string;
  baseUnit: string;
  category: string;
  offers: GroupOffer[];
};

export type Catalog = {
  generatedAt: string;
  source: string;
  suppliers: Supplier[];
  offers: Offer[];
  groups: Group[];
};

export type ListItem = { groupId: string; qty: number };
