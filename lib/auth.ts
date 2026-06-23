import { getFromStorage, removeFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { AuthSession, LocalAccount } from "@/types/user";

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function signUpLocal(name: string, email: string, password: string) {
  const accounts = getFromStorage<LocalAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
  const normalizedEmail = email.trim().toLowerCase();

  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error("이미 가입된 이메일입니다.");
  }

  const account: LocalAccount = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  saveToStorage(STORAGE_KEYS.ACCOUNTS, [...accounts, account]);
  const session: AuthSession = { userId: account.id, email: account.email };
  saveToStorage(STORAGE_KEYS.AUTH_SESSION, session);
  return account;
}

export async function signInLocal(email: string, password: string) {
  const accounts = getFromStorage<LocalAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const account = accounts.find(
    (item) => item.email === normalizedEmail && item.passwordHash === passwordHash
  );

  if (!account) throw new Error("이메일 또는 비밀번호를 확인해주세요.");

  const session: AuthSession = { userId: account.id, email: account.email };
  saveToStorage(STORAGE_KEYS.AUTH_SESSION, session);
  return account;
}

export function getSession() {
  return getFromStorage<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
}

export function signOutLocal() {
  removeFromStorage(STORAGE_KEYS.AUTH_SESSION);
}
