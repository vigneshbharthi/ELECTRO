/**
 * Centralized app branding config — single source of truth
 * Replaced at build time via Vite. Render injects VITE_APP_NAME per deployment.
 */
export const APP_NAME = (import.meta.env.VITE_APP_NAME?.trim() || 'JBS Electro').slice(0, 40);
export const APP_NAME_SLUG = APP_NAME.replace(/\s+/g, '_');
export const APP_TITLE = `${APP_NAME} - Electrician & Points Ledger Portal`;
