import { createSale } from "../api/sale.api";

export default function useOfflineSales() {
  const KEY = "offline_sales";

  const saveOffline = (sale) => {
    const existing = JSON.parse(localStorage.getItem(KEY)) || [];
    existing.push({ ...sale, createdAt: new Date() });
    localStorage.setItem(KEY, JSON.stringify(existing));
  };

  const sync = async () => {
    const offline = JSON.parse(localStorage.getItem(KEY)) || [];
    if (offline.length === 0) return;

    for (const sale of offline) {
      await createSale(sale);
    }

    localStorage.removeItem(KEY);
  };

  return { saveOffline, sync };
}
