import { AsyncLocalStorage } from "async_hooks";

/**
 * Per-request context for admin requests: the signed-in user, set by
 * requireAdmin. Lets logActivity() record who made a change without every
 * controller having to pass `req` through.
 */
export const requestContext = new AsyncLocalStorage();

export const currentAdmin = () => requestContext.getStore()?.user || null;
