"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Agency, SubAccount } from "@/models/agency";
import { User } from "@/models/user";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/overview" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=Invalid%20email%20or%20password");
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const agencyName = String(formData.get("agencyName") || "").trim();
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");
  if (!name || !agencyName || !email || password.length < 8) {
    redirect("/register?error=Fill%20all%20fields%20(password%208%2B)");
  }

  await connectDB();
  const exists = await User.findOne({ email });
  if (exists) redirect("/register?error=Email%20already%20registered");

  const agency = await Agency.create({
    name: agencyName,
    branding: { senderName: agencyName, primaryColor: "#0f766e", accentColor: "#14b8a6" },
  });
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    agencyId: agency._id,
    name,
    email,
    passwordHash: hash,
    role: "agency_admin",
  });
  agency.ownerUserId = user._id;
  await agency.save();

  await SubAccount.create({
    agencyId: agency._id,
    name: `${agencyName} HQ`,
    timezone: "America/New_York",
    status: "active",
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/overview" });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login");
    throw error;
  }
}
