"use server";

import { redirect } from "next/navigation";
import { clearManagerSession, isManagerLoginConfigured, setManagerSession, validateManagerPassword } from "@/lib/admin-auth";

export async function managerLogin(formData: FormData) {
  if (!isManagerLoginConfigured()) redirect("/admin?error=not-configured");
  const password = formData.get("password");
  if (typeof password !== "string" || !validateManagerPassword(password)) redirect("/admin?error=login");
  await setManagerSession();
  redirect("/admin");
}

export async function managerLogout() {
  await clearManagerSession();
  redirect("/admin");
}
