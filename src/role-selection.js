import { Clerk } from "@clerk/clerk-js";

console.log("[Aegis] Loading role selection...");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is missing from .env");
}

const clerk = new Clerk(clerkPubKey);

await clerk.load();

console.log("[Aegis] Clerk loaded on role selection");
console.log("[Aegis] User signed in:", clerk.isSignedIn);

if (!clerk.isSignedIn) {
  console.log("[Aegis] No authenticated user → login");
  window.location.href = "/loginpage.html";
}

const buttons = document.querySelectorAll("[data-role]");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const role = button.dataset.role;

    console.log("[Aegis] Selected role:", role);

    sessionStorage.setItem("aegisRegistrationRole", role);

    console.log(
      "[Aegis] Registration role saved:",
      sessionStorage.getItem("aegisRegistrationRole")
    );

    window.location.href = "/registration.html";
  });
});