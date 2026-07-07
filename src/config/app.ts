/**
 * Application configuration
 * Toggle features here for production builds
 * Override via VITE_* environment variables
 */

/** Simple brand constant for quick imports */
export const BRAND = import.meta.env.VITE_BRAND_NAME || "FinZee AI";

export const appConfig = {
  /** Brand name used across the app */
  brandName: import.meta.env.VITE_BRAND_NAME || "FinZee AI",
  
  /** Persona-only mode - restricts app to demo personas only (default: true) */
  personaOnly: import.meta.env.VITE_PERSONA_ONLY !== 'false',
  
  /** Set to false to hide demo mode toggle and banner in production (default: false) */
  showDemoBadges: import.meta.env.VITE_SHOW_DEMO_BADGES === 'true',
  
  /** Prototype mode - enables demo personas and quick-start features (default: true) */
  prototypeMode: import.meta.env.VITE_PROTOTYPE_MODE !== 'false',
  
  /** Site URL for absolute links (e.g., OAuth redirects, email links) */
  siteUrl: import.meta.env.VITE_SITE_URL || window.location.origin,
  
  /** Viewer code for demo/investor access */
  viewerCode: "Finzee-2026",
} as const;
