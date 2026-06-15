/**
 * Thin client for the CA Pharmacy API.
 *
 * The base URL comes from Vite's `VITE_API_BASE_URL` (see frontend/.env), with a
 * sensible localhost default so `npm run dev` works with `docker compose up`.
 * Every helper unwraps the `{ data: ... }` success envelope and throws an
 * `ApiError` carrying the server's `{ status, message, fields }` on failure.
 */

const API_BASE = (
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "http://localhost:8080"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, message, fields = null) {
    super(message || `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

// ---------------------------------------------------------------------------
// Session / bearer-token storage
// ---------------------------------------------------------------------------

const SESSION_KEY = "ca_pharmacy_session";

/**
 * The signed-in session lives in localStorage ("Keep me signed in") or
 * sessionStorage (this tab only). `auth` reads from whichever holds it and
 * exposes the bearer token the API client attaches to every request.
 */
export const auth = {
  get session() {
    const raw =
      window.localStorage.getItem(SESSION_KEY) ||
      window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  get token() {
    return this.session?.token || null;
  },

  get user() {
    return this.session?.user || null;
  },

  isTokenExpired() {
    const token = this.token;
    if (!token) return true;

    try {
      const parts = token.split(".");

      if (parts.length !== 3) {
        console.log("Token não é JWT, ignorando verificação");
        return false;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp - 60 < now;
    } catch {
      return true;
    }
  },

  save(session, remember = true) {
    this.clear();
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(session));
  },

  clear() {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  },

  /** Redirect to the sign-in page (relative to the current /pages/ file). */
  redirectToLogin() {
    window.location.replace("login.html");
  },
};

// ---------------------------------------------------------------------------
// Connectivity status + retry support
// ---------------------------------------------------------------------------

/**
 * Backoff schedule (ms) for automatic retries of network failures on
 * idempotent (GET) requests. The request is attempted once, then retried
 * after each of these delays before finally giving up.
 */
const RETRY_DELAYS_MS = [500, 1500, 3000];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tracks whether the API was reachable on the most recent request and lets
 * the UI react to changes (e.g. show/hide a global "API indisponível"
 * banner) and re-issue the request that last failed with a network error.
 *
 * Usage:
 *   const unsubscribe = apiStatus.subscribe((online) => { ... });
 *   apiStatus.retry(); // re-runs the last network-failed request
 */
class ApiStatus extends EventTarget {
  constructor() {
    super();
    this.online = true;
    this._lastRequest = null;
  }

  _setOnline(online) {
    if (this.online === online) {
      return;
    }
    this.online = online;
    this.dispatchEvent(new CustomEvent("change", { detail: { online } }));
  }

  /**
   * Subscribe to connectivity changes. The callback is invoked immediately
   * with the current status, then again on every change. Returns a function
   * that unsubscribes.
   */
  subscribe(callback) {
    const handler = (event) => callback(event.detail.online);
    this.addEventListener("change", handler);
    callback(this.online);
    return () => this.removeEventListener("change", handler);
  }

  /** Whether there is a failed request that can be retried. */
  get canRetry() {
    return this._lastRequest !== null;
  }

  /**
   * Re-issue the request that most recently failed with a network error
   * (ApiError status 0). Resolves/rejects exactly like the original call.
   * If the retry itself reaches the server — even with an error response —
   * connectivity is considered restored and the offline banner is hidden.
   */
  async retry() {
    if (!this._lastRequest) {
      return pingApi();
    }
    const { path, options } = this._lastRequest;
    try {
      const result = await request(path, options);
      this.dispatchEvent(
        new CustomEvent("retry-success", { detail: { path } }),
      );
      return result;
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        throw err;
      }
      // Reached the server this time: surface the (non-network) error to
      // the caller, but the API itself is back online.
      this.dispatchEvent(
        new CustomEvent("retry-success", { detail: { path } }),
      );
      throw err;
    }
  }
}

export const apiStatus = new ApiStatus();

/**
 * Lightweight check used to detect when the API has come back online. Safe
 * to call from a "Tentar novamente" button. If connectivity is restored and
 * a request had previously failed, that request is automatically retried.
 */
export async function pingApi() {
  try {
    await fetch(`${API_BASE}/api/auth/me`, { method: "GET" });
    const wasOffline = !apiStatus.online;
    apiStatus._setOnline(true);
    if (wasOffline && apiStatus._lastRequest) {
      try {
        await apiStatus.retry();
      } catch {
        // The original caller already surfaced this error; nothing else to do.
      }
    }
    return true;
  } catch {
    apiStatus._setOnline(false);
    return false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    pingApi();
  });
  window.addEventListener("offline", () => {
    apiStatus._setOnline(false);
  });
}

async function request(path, { method = "GET", body, query } = {}) {
  let url = `${API_BASE}${path}`;

  if (path !== "/api/auth/login" && auth.isTokenExpired()) {
    auth.clear();
    auth.redirectToLogin();
    return;
  }

  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const headers = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const token = auth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };

  let response;
  let attempt = 0;
  for (;;) {
    try {
      response = await fetch(url, fetchOptions);
      break;
    } catch (networkError) {
      // Only auto-retry idempotent GET requests; mutations are left for the
      // user to retry explicitly (e.g. via the offline banner) so we never
      // silently resubmit a write.
      if (method === "GET" && attempt < RETRY_DELAYS_MS.length) {
        await delay(RETRY_DELAYS_MS[attempt]);
        attempt += 1;
        continue;
      }

      apiStatus._lastRequest = { path, options: { method, body, query } };
      apiStatus._setOnline(false);
      throw new ApiError(
        0,
        `Cannot reach the API at ${API_BASE}. Is it running?`,
      );
    }
  }

  // A response (even an error one) means the API is reachable.
  apiStatus._lastRequest = null;
  apiStatus._setOnline(true);

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload && payload.error ? payload.error : {};
    // An expired/invalid session on any page but the login flow: clear and
    // bounce to sign-in so the user isn't stuck on a broken screen.
    if (response.status === 401 && path !== "/api/auth/login") {
      auth.clear();
      auth.redirectToLogin();
    }
    throw new ApiError(response.status, error.message, error.fields || null);
  }

  return payload ? payload.data : null;
}

export const api = {
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),

  dashboard: () => request("/api/dashboard"),

  search: async (query) => {
    if (!query || query.trim().length < 2)
      return { medications: [], patients: [], prescriptions: [] };

    const q = query.trim();

    const [meds, pts, rxs] = await Promise.allSettled([
      request("/api/medications", { query: { search: q } }),
      request("/api/patients", { query: { search: q } }),
      request("/api/prescriptions", { query: { search: q } }),
    ]);

    const safe = (result) => {
      if (result.status !== "fulfilled") return [];
      const val = result.value ?? [];
      return Array.isArray(val) ? val : (val.data ?? []);
    };

    const rank = (label, q) => {
      const l = (label || "").toLowerCase();
      const s = q.toLowerCase();
      if (l.startsWith(s)) return 0;
      if (l.includes(s)) return 1;
      return 2;
    };

    return {
      medications: safe(meds)
        .map((m) => ({
          label: m.name,
          sublabel: m.category ?? m.stock_status ?? null,
          href: `medications.html?highlight=${m.id}`,
          _rank: rank(m.name, q),
        }))
        .sort((a, b) => a._rank - b._rank),

      patients: safe(pts)
        .map((p) => ({
          label: p.name,
          sublabel: `${p.code} · ${p.plan ?? "No plan"}`,
          href: `patients.html?highlight=${p.id}`,
          _rank: rank(p.name, q),
        }))
        .sort((a, b) => a._rank - b._rank),

      prescriptions: safe(rxs)
        .map((r) => ({
          label: r.patient?.name ?? `Rx #${r.id}`,
          sublabel: r.medication?.name ?? null,
          href: `prescriptions.html?highlight=${r.id}`,
          _rank: rank(r.patient?.name ?? "", q),
        }))
        .sort((a, b) => a._rank - b._rank),
    };
  },

  medications: (query) => request("/api/medications", { query }),
  medication: (id) => request(`/api/medications/${id}`),
  createMedication: (body) =>
    request("/api/medications", { method: "POST", body }),
  adjustStock: (id, delta, reason) =>
    request(`/api/medications/${id}/stock`, {
      method: "POST",
      body: { delta, reason },
    }),
  categories: () => request("/api/medications/categories"),
  stockMovements: () => request("/api/stock-movements"),

  patients: (query) => request("/api/patients", { query }),
  patient: (id) => request(`/api/patients/${id}`),
  createPatient: (body) => request("/api/patients", { method: "POST", body }),

  suppliers: () => request("/api/suppliers"),

  prescriptions: (query) => request("/api/prescriptions", { query }),
  createPrescription: (body) =>
    request("/api/prescriptions", { method: "POST", body }),
  transitionPrescription: (id, state) =>
    request(`/api/prescriptions/${id}/state`, {
      method: "PATCH",
      body: { state },
    }),

  purchaseOrders: (query) => request("/api/purchase-orders", { query }),
  purchaseOrder: (id) => request(`/api/purchase-orders/${id}`),
  createPurchaseOrder: (body) =>
    request("/api/purchase-orders", { method: "POST", body }),
  transitionPurchaseOrder: (id, state) =>
    request(`/api/purchase-orders/${id}/state`, {
      method: "PATCH",
      body: { state },
    }),

  sales: (query) => request("/api/sales", { query }),
  createSale: (body) => request("/api/sales", { method: "POST", body }),
};

// ---------------------------------------------------------------------------
// Shared presentation helpers
// ---------------------------------------------------------------------------

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Map a derived stock status to a status-badge tone class. */
export const STATUS_TONE = {
  in: "status-success",
  low: "status-warning",
  out: "status-danger",
  expiring: "status-warning",
  expired: "status-danger",
  recalled: "status-danger",
  controlled: "status-controlled",
  // prescription / order / sale states
  new: "status-neutral",
  verifying: "status-info",
  ready: "status-success",
  dispensed: "status-success",
  voided: "status-danger",
  draft: "status-neutral",
  submitted: "status-info",
  transit: "status-warning",
  received: "status-success",
  cancelled: "status-danger",
  completed: "status-success",
};

export function toneClass(key) {
  return STATUS_TONE[key] || "status-neutral";
}

/** "2026-08-12" -> "12 Aug 2026". Returns "—" for empty values. */
export function formatDate(iso) {
  if (!iso) {
    return "—";
  }
  const date = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return String(iso);
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Initials for an avatar, e.g. "Amara Okafor" -> "AO". */
export function initials(name) {
  return String(name || "")
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Global "API indisponível" banner
// ---------------------------------------------------------------------------

let offlineBannerEl = null;

/**
 * Inject (once per page) a fixed bottom banner that appears whenever the API
 * is unreachable, with a "Tentar novamente" button. Call this once from each
 * page's bootstrap script, e.g.:
 *
 *   import { mountOfflineBanner } from "./api.js";
 *   mountOfflineBanner();
 *
 * Returns the banner element, creating it on first call.
 */
export function mountOfflineBanner() {
  if (typeof document === "undefined") {
    return null;
  }
  if (offlineBannerEl) {
    return offlineBannerEl;
  }

  const style = document.createElement("style");
  style.textContent = `
    #api-offline-banner {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding: 0.6rem 1rem;
      background: #b91c1c;
      color: #fff;
      font: 14px/1.4 system-ui, -apple-system, sans-serif;
      text-align: center;
      transform: translateY(100%);
      transition: transform 0.2s ease-out;
    }
    #api-offline-banner.is-visible {
      transform: translateY(0);
    }
    #api-offline-banner button {
      border: 1px solid rgba(255, 255, 255, 0.6);
      background: transparent;
      color: inherit;
      border-radius: 4px;
      padding: 0.25rem 0.75rem;
      cursor: pointer;
      font: inherit;
    }
    #api-offline-banner button:disabled {
      opacity: 0.6;
      cursor: progress;
    }
    #api-offline-banner button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
    }
  `;
  document.head.appendChild(style);

  offlineBannerEl = document.createElement("div");
  offlineBannerEl.id = "api-offline-banner";
  offlineBannerEl.setAttribute("role", "alert");
  offlineBannerEl.setAttribute("aria-live", "assertive");
  offlineBannerEl.innerHTML = `
    <span>Desconectado. Verifique sua conexão de internet.</span>
    <button type="button">Tentar novamente</button>
  `;

  const button = offlineBannerEl.querySelector("button");
  const resetButton = () => {
    button.disabled = false;
    button.textContent = "Tentar novamente";
  };

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Tentando...";
    const ok = await (apiStatus.canRetry
      ? apiStatus.retry().then(
          () => true,
          () => apiStatus.online,
        )
      : pingApi());
    if (!ok) {
      resetButton();
    }
  });

  document.body.appendChild(offlineBannerEl);

  apiStatus.subscribe((online) => {
    offlineBannerEl.classList.toggle("is-visible", !online);
    if (online) {
      resetButton();
    }
  });

  return offlineBannerEl;
}
