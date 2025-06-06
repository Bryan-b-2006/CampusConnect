
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AuthUser } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem("token");
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    localStorage.removeItem("token");
    return null;
  }
}
