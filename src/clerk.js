import { Clerk } from "@clerk/clerk-js";
import { convex } from "./convex.js";
import { api } from "../convex/_generated/api.js";

console.log("[Aegis] Loading Clerk...");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is missing from .env");
}

const clerk = new Clerk(clerkPubKey);

console.log("[Aegis] Clerk instance created");

const clerkDomain = atob(clerkPubKey.split("_")[2]).slice(0, -1);

await new Promise((resolve, reject) => {
  const script = document.createElement("script");

  script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
  script.async = true;
  script.crossOrigin = "anonymous";

  script.onload = () => {
    console.log("[Aegis] Clerk UI bundle loaded");
    resolve();
  };

  script.onerror = () => {
    reject(new Error("Failed to load Clerk UI bundle"));
  };

  document.head.appendChild(script);
});

await clerk.load({
  ui: {
    ClerkUI: window.__internal_ClerkUICtor,
  },
});

console.log("[Aegis] Clerk loaded");
console.log("[Aegis] Clerk signed in:", clerk.isSignedIn);

window.clerk = clerk;

convex.setAuth(async () => {
  const token = await clerk.session?.getToken({
    template: "convex",
  });

  console.log("[Aegis] Convex token available:", !!token);

  return token ?? null;
});

if (clerk.isSignedIn) {
  try {
    const currentUser = await convex.query(api.users.getCurrentUser, {});

    console.log("[Aegis] Convex getCurrentUser result:", currentUser);

    if (currentUser === null) {
      console.log("[Aegis] No Aegis profile found → role selection");
      window.location.href = "/role-selection.html";
    } else {
      console.log("[Aegis] Aegis profile found → dashboard");
      window.location.href = "/dashboard.html";
    }
  } catch (error) {
    console.error("[Aegis] Convex getCurrentUser failed:", error);
  }
}

console.log("[Aegis] Clerk → Convex auth configured");

const app = document.getElementById("clerk-auth");

if (app) {
  if (clerk.isSignedIn) {
    app.innerHTML = `
      <div id="user-button"></div>
    `;

    clerk.mountUserButton(document.getElementById("user-button"));
  } else {
    clerk.mountSignIn(app);
  }
}