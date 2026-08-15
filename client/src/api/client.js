const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const ADMIN_TOKEN_KEY = "trisak-admin-token";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Session tokens live only in the server's memory (see README) — a server
// restart invalidates every token. When that happens, clear the stale
// token and bounce to the login screen instead of leaving the admin UI
// stuck showing a raw "Unauthorized" error.
function handleUnauthorized() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  const { pathname } = window.location;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    window.location.href = "/admin/login";
  }
}

async function authRequest(path, options = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Session expired — signing you out.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function qs(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : "";
}

export const api = {
  // ---- public catalog ----
  getBrands: () => request("/brands"),
  getBrand: (brandSlug) => request(`/brands/${brandSlug}`),
  getCategoriesForBrand: (brandSlug) => request(`/brands/${brandSlug}/categories`),

  getCategories: () => request("/categories"),
  getCategory: (categorySlug) => request(`/categories/${categorySlug}`),

  getSeriesList: (params = {}) => request(`/series${qs(params)}`),
  getSeries: (brandSlug, categorySlug, seriesSlug) =>
    request(`/series/${brandSlug}/${categorySlug}/${seriesSlug}`),

  getProducts: (params = {}) => request(`/products${qs(params)}`),
  getFeaturedProducts: () => request("/products/featured"),
  getProductBySlug: (slug) => request(`/products/detail/${slug}`),

  getSolutions: () => request("/solutions"),
  getIndustries: () => request("/industries"),

  submitContact: (payload) =>
    request("/contact", { method: "POST", body: JSON.stringify(payload) }),

  // ---- admin ----
  adminLogin: async (password) => {
    const data = await request("/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    return data;
  },
  adminLogout: async () => {
    try {
      await authRequest("/admin/logout", { method: "POST" });
    } catch {
      // ignore — we're clearing the token either way
    } finally {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  },
  isAdminAuthenticated: () => Boolean(localStorage.getItem(ADMIN_TOKEN_KEY)),

  adminGetBrands: () => authRequest("/admin/brands"),
  adminCreateBrand: (payload) =>
    authRequest("/admin/brands", { method: "POST", body: JSON.stringify(payload) }),

  adminGetCategories: () => authRequest("/admin/categories"),
  adminCreateCategory: (payload) =>
    authRequest("/admin/categories", { method: "POST", body: JSON.stringify(payload) }),

  adminGetSeriesList: () => authRequest("/admin/series"),
  adminCreateSeries: (payload) =>
    authRequest("/admin/series", { method: "POST", body: JSON.stringify(payload) }),

  adminGetProducts: () => authRequest("/admin/products"),
  adminGetProduct: (id) => authRequest(`/admin/products/${id}`),
  adminCreateProduct: (payload) =>
    authRequest("/admin/products", { method: "POST", body: JSON.stringify(payload) }),
  adminUpdateProduct: (id, payload) =>
    authRequest(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminDeleteProduct: (id) => authRequest(`/admin/products/${id}`, { method: "DELETE" }),

  // multipart upload — bypasses request()/authRequest() so fetch can set
  // its own multipart/form-data boundary instead of the JSON content type
  adminUploadImage: async (file) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_URL}/admin/upload`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: formData,
    });
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error("Session expired — signing you out.");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Upload failed: ${res.status}`);
    }
    return res.json();
  },
};
