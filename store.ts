"use client";
import { useCallback, useEffect, useState } from "react";
import type { ListItem } from "./types";

const KEY = "loft76-lista-v1";
const EX_KEY = "loft76-excluidos-v1";

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
    window.dispatchEvent(new Event("loft76-store"));
  } catch {}
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => setValue(read(key, fallback));
    load();
    setReady(true);
    window.addEventListener("loft76-store", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("loft76-store", load);
      window.removeEventListener("storage", load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const save = useCallback((v: T) => { setValue(v); write(key, v); }, [key]);
  return [value, save, ready] as const;
}

export function useList() {
  const [items, save, ready] = useStored<ListItem[]>(KEY, []);
  const setQty = (groupId: string, qty: number) => {
    const q = Math.max(0, Math.round(qty * 1000) / 1000);
    const exists = items.some((i) => i.groupId === groupId);
    const next = q === 0
      ? items.filter((i) => i.groupId !== groupId)
      : exists ? items.map((i) => (i.groupId === groupId ? { ...i, qty: q } : i)) : [...items, { groupId, qty: q }];
    save(next);
  };
  const clear = () => save([]);
  return { items, setQty, clear, ready };
}

export function useExcluded() {
  const [excluded, save] = useStored<string[]>(EX_KEY, []);
  const toggle = (id: string) => save(excluded.includes(id) ? excluded.filter((x) => x !== id) : [...excluded, id]);
  return { excluded, toggle };
}
