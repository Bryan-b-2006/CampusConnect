
import type { AuthUser } from "./types";

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

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  const data = await response.json();
  localStorage.setItem("token", data.token);
  return data.user;
}

export async function register(userData: any): Promise<AuthUser> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }

  const data = await response.json();
  localStorage.setItem("token", data.token);
  return data.user;
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem("token");
  
  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } finally {
      localStorage.removeItem("token");
    }
  }
}
