/**
 * Brand configuration
 * Override via VITE_BRAND_NAME environment variable
 */
export const BRAND = import.meta.env.VITE_BRAND_NAME || "FinZee AI";

/** Inline brand name component */
export function BotName() {
  return <span className="font-medium">{BRAND}</span>;
}
