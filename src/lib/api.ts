// Thin client for the Hop On Mobility Experiences API.
// Docs: https://experiences.hoponmobility.com/api/openapi.json

export const API_BASE = "https://experiences.hoponmobility.com/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}

export const api = {
  get: <T,>(p: string) => req<T>(p),
  post: <T,>(p: string, body: unknown) =>
    req<T>(p, { method: "POST", body: JSON.stringify(body) }),
  put: <T,>(p: string, body: unknown) =>
    req<T>(p, { method: "PUT", body: JSON.stringify(body) }),
  del: <T,>(p: string) => req<T>(p, { method: "DELETE" }),
};

// ---- Types (loose; API returns extra fields) ----
export interface Experience {
  id?: number;
  owner: string;
  name?: string | null;
  description?: string | null;
  price?: number | string;
  duration?: string | null;
  origin?: string | null;
  gallery?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
}

export interface POI {
  id?: number;
  name: string;
  owner?: string;
  description?: string | null;
  location?: { type?: string; coordinates?: [number, number] } | Record<string, unknown>;
  tags?: string[];
  highlight?: boolean | null;
  radius?: number | null;
}

export interface Itinerary {
  id?: number;
  owner: string;
  name: string;
  category?: string | null;
  category_icon?: string | null;
  directed?: boolean;
  user?: string | null;
  duration?: string | null;
}

export interface Tag {
  id?: number;
  name: string;
  family?: string | null;
  parent?: number | null;
  visible?: boolean;
  old_id?: string | null;
  user_preference?: boolean;
}

export interface Pkg {
  id: string;
  owner?: string | null;
  sku?: string | null;
  image?: string | null;
  price?: number | string;
  currency?: string;
  in_app_visible?: boolean;
  provider?: string | null;
  provider_id?: string | null;
  strings?: unknown;
}

export interface Booking {
  id?: number | null;
  title: string;
  start: string;
  end: string;
}

// ---- Endpoints ----
export const Experiences = {
  list: (owner: string) => api.get<Experience[]>(`/experiences/?owner=${encodeURIComponent(owner)}`),
  get: (id: number | string) => api.get<Experience>(`/experiences/${id}`),
  create: (body: Experience) => api.post<Experience>(`/experiences/`, body),
  update: (id: number | string, body: Experience) => api.put<Experience>(`/experiences/${id}`, body),
  remove: (id: number | string) => api.del<unknown>(`/experiences/${id}`),
};

export const Pois = {
  list: (owner: string) => api.get<POI[]>(`/pois/?owner=${encodeURIComponent(owner)}`),
  get: (id: number | string) => api.get<POI>(`/pois/${id}`),
  create: (body: POI) => api.post<POI>(`/pois/`, body),
  update: (id: number | string, body: POI) => api.put<POI>(`/pois/${id}`, body),
  remove: (id: number | string) => api.del<unknown>(`/pois/${id}`),
};

export const Itineraries = {
  list: (owner: string) => api.get<Itinerary[]>(`/itineraries/?owner=${encodeURIComponent(owner)}`),
  get: (id: number | string) => api.get<Itinerary>(`/itineraries/${id}`),
  create: (body: Itinerary) => api.post<Itinerary>(`/itineraries/`, body),
  update: (id: number | string, body: Itinerary) => api.put<Itinerary>(`/itineraries/${id}`, body),
  remove: (id: number | string) => api.del<unknown>(`/itineraries/${id}`),
};

export const Tags = {
  list: () => api.get<Tag[]>(`/tags/`),
  get: (id: number | string) => api.get<Tag>(`/tags/${id}`),
  create: (body: Tag) => api.post<Tag>(`/tags/`, body),
  update: (id: number | string, body: Tag) => api.put<Tag>(`/tags/${id}`, body),
  remove: (id: number | string) => api.del<unknown>(`/tags/${id}`),
};

export const Packages = {
  list: (owner: string) => api.get<Pkg[]>(`/packages/?owner=${encodeURIComponent(owner)}`),
  get: (id: string) => api.get<Pkg>(`/packages/${id}`),
  remove: (id: string) => api.del<unknown>(`/packages/${id}`),
};

export const Bookings = {
  forClient: (client: string) =>
    api.get<Booking[]>(`/tableau/?client=${encodeURIComponent(client)}`),
  forExperience: (ex: number | string) => api.get<Booking[]>(`/tableau/experience/${ex}`),
};
