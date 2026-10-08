// Maps URL paths to the source files that render them, so feedback prompts can point Claude Code at the right place.
const GLOBAL = ["app/layout.tsx", "app/globals.css", "components/Nav.tsx", "tailwind.config.ts"];
const ROUTES: [RegExp, string, string[]][] = [
  [/^\/$/, "Landing page", ["app/page.tsx", "components/SearchBar.tsx", "components/ui.tsx (ProviderCard, Stars, Avatar)"]],
  [/^\/search/, "Search results", ["app/search/page.tsx", "components/SearchBar.tsx", "components/ui.tsx (ProviderCard)", "lib/data.ts (rankProviders)"]],
  [/^\/providers\/[^/]+/, "Provider profile", ["app/providers/[id]/page.tsx", "components/ContactButton.tsx", "components/ui.tsx"]],
  [/^\/review\//, "Review / feedback form", ["app/review/[id]/page.tsx", "components/ReviewForm.tsx"]],
  [/^\/login/, "Sign in", ["app/login/page.tsx", "components/LoginForm.tsx", "components/InstagramButton.tsx"]],
  [/^\/signup/, "Customer sign up", ["app/signup/page.tsx", "components/SignupForm.tsx", "components/InstagramButton.tsx"]],
  [/^\/provider\/signup/, "Provider sign up", ["app/provider/signup/page.tsx", "components/ProviderSignupForm.tsx"]],
  [/^\/provider\/dashboard/, "Provider dashboard", ["app/provider/dashboard/page.tsx", "components/AddonCard.tsx"]],
  [/^\/network/, "My network & groups", ["app/network/page.tsx", "components/NetworkManager.tsx"]],
  [/^\/admin\/feedback/, "Feedback tracker", ["app/admin/feedback/page.tsx", "components/FeedbackBoard.tsx", "lib/feedbackPrompt.ts"]],
];
export function describeRoute(path: string) {
  const p = (path || "/").split("?")[0];
  for (const [re, name, files] of ROUTES) if (re.test(p)) return { name, files: [...files, ...GLOBAL.slice(0, 2)] };
  return { name: "Unknown page", files: GLOBAL };
}
