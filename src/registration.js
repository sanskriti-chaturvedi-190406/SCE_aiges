import { Clerk } from "@clerk/clerk-js";
import { convex } from "./convex.js";
import { api } from "../convex/_generated/api.js";

console.log("[Aegis] Loading Clerk for registration...");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is missing from .env");
}

const clerk = new Clerk(clerkPubKey);

await clerk.load();

console.log("[Aegis] Clerk loaded on registration page");
console.log("[Aegis] Registration user signed in:", clerk.isSignedIn);

convex.setAuth(async () => {
  const token = await clerk.session?.getToken({
    template: "convex",
  });

  console.log("[Aegis] Registration Convex token available:", !!token);

  return token ?? null;
});

console.log("[Aegis] Registration Clerk → Convex auth configured");

console.log("[Aegis] Registration page loaded");

const signOutButton = document.getElementById("sign-out-button");

signOutButton.addEventListener("click", async () => {
  console.log("[Aegis] Signing out...");

  await clerk.signOut();

  console.log("[Aegis] Signed out successfully");

  window.location.href = "/loginpage.html";
});;

const form = document.getElementById("registration-form");
const status = document.getElementById("status");

if (!form) {
  throw new Error("Registration form not found");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  console.log("[Aegis] Registration form submitted");

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const role = sessionStorage.getItem("aegisRegistrationRole");

  console.log("[Aegis] Registration data:", {
    name,
    phone,
    role,
  });

  if (!name || !phone || !role) {
    status.textContent = "Please fill in all fields.";
    return;
  }

  try {
    status.textContent = "Creating your profile...";

    const userId = await convex.mutation(api.users.createUser, {
      name,
      phone,
      role,
    });

    console.log("[Aegis] Aegis user created:", userId);

    status.textContent = "Registration successful!";

    sessionStorage.removeItem("aegisRegistrationRole");
    
    window.location.href = "/dashboard.html";
  } catch (error) {
    console.error("[Aegis] Registration failed:", error);
    status.textContent = "Registration failed. Please try again.";
  }
});