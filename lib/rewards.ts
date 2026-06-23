import type { PointTransaction, AvatarItem } from "@/types/reward";
import { saveToStorage, getFromStorage, STORAGE_KEYS } from "@/lib/storage";

export function calculatePointBalance(transactions: PointTransaction[]): number {
  return transactions.reduce((total, tx) => {
    if (tx.type === "earn") return total + tx.amount;
    return total - tx.amount;
  }, 0);
}

export function createEarnTransaction(
  userId: string,
  amount: number,
  reason: string
): PointTransaction {
  return {
    id: `point-${Date.now()}`,
    userId,
    type: "earn",
    amount,
    reason,
    createdAt: new Date().toISOString(),
  };
}

export function createSpendTransaction(
  userId: string,
  amount: number,
  reason: string
): PointTransaction {
  return {
    id: `point-${Date.now()}`,
    userId,
    type: "spend",
    amount,
    reason,
    createdAt: new Date().toISOString(),
  };
}

export function canPurchaseItem(
  item: AvatarItem,
  currentPoints: number
): boolean {
  return !item.isOwned && currentPoints >= item.price;
}

export function purchaseAvatarItem(
  items: AvatarItem[],
  itemId: string
): AvatarItem[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, isOwned: true } : item
  );
}

export function equipAvatarItem(
  items: AvatarItem[],
  itemId: string
): AvatarItem[] {
  const targetItem = items.find((item) => item.id === itemId);
  if (!targetItem || !targetItem.isOwned) return items;

  return items.map((item) => {
    if (item.category === targetItem.category) {
      return { ...item, isEquipped: item.id === itemId };
    }
    return item;
  });
}

export function hasEarnedTodayForReason(
  transactions: PointTransaction[],
  reason: string
): boolean {
  const today = new Date().toISOString().split("T")[0];
  return transactions.some(
    (tx) =>
      tx.type === "earn" &&
      tx.reason === reason &&
      tx.createdAt.startsWith(today)
  );
}

export function addPointTransaction(transaction: PointTransaction): void {
  const existing = getFromStorage<PointTransaction[]>(
    STORAGE_KEYS.POINT_TRANSACTIONS,
    []
  );
  saveToStorage(STORAGE_KEYS.POINT_TRANSACTIONS, [...existing, transaction]);
}
