import { environment } from "../../../environments/environment";

// Absolute origin of the Rails API. In production `environment.apiOrigin` is
// "" and we fall back to the app's own origin (same-host deployment); the
// WebSocket helper in notification.service.ts derives ws(s):// from this, so
// it must always be a full origin, never a relative path.
export const API_ORIGIN = environment.apiOrigin || window.location.origin;
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;
