// Thin client for the Hop On Mobility Experiences API.
// Docs: https://experiences.hoponmobility.com/api/openapi.json

export const API_BASE = "https://experiences.hoponmobility.com/api";

function qs(params?: Record<string, unknown>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)));
    else sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

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
  post: <T,>(p: string, body?: unknown) =>
    req<T>(p, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
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
  gallery?: Record<string, unknown> | null;
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
  pois?: Array<number | { id?: number; name?: string }>;
  experiences?: Array<number | { id?: number; name?: string }>;
  tags?: Array<number | { id?: number; name?: string }>;
  gallery?: Record<string, unknown> | null;
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

export interface GeoJSON {
  type: string;
  features?: unknown[];
  [k: string]: unknown;
}

export interface UserVisibility {
  id?: number;
  user?: string;
  item?: number | string;
  visible?: boolean;
  [k: string]: unknown;
}

export interface IconAsset {
  id?: number;
  name?: string;
  url?: string;
  [k: string]: unknown;
}

// ---- Endpoints ----
export const Experiences = {
  list: (owner: string) => api.get<Experience[]>(`/experiences/${qs({ owner })}`),
  geojson: (owner?: string) => api.get<GeoJSON>(`/experiences/experiences.geojson${qs({ owner })}`),
  get: (id: number | string) => api.get<Experience>(`/experiences/${id}`),
  getGeojson: (id: number | string) => api.get<GeoJSON>(`/experiences/${id}.geojson`),
  create: (body: Experience) => api.post<Experience>(`/experiences/`, body),
  update: (id: number | string, body: Experience) => api.put<Experience>(`/experiences/${id}`, body),
  remove: (id: number | string) => api.del<unknown>(`/experiences/${id}`),
  availabilities: (id: number | string, params?: Record<string, unknown>) =>
    api.get<unknown>(`/experiences/${id}/availabilities${qs(params)}`),
  book: (id: number | string, body: unknown) => api.post<unknown>(`/experiences/${id}/book`, body),
  termsAndConditions: () => api.get<unknown>(`/experiences/terms_and_conditions`),
  userExperiences: {
    list: (params?: Record<string, unknown>) =>
      api.get<unknown[]>(`/experiences/userexperiences/${qs(params)}`),
    create: (body: unknown) => api.post<unknown>(`/experiences/userexperiences/`, body),
    get: (id: number | string) => api.get<unknown>(`/experiences/userexperiences/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/experiences/userexperiences/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/experiences/userexperiences/${id}`),
  },
};

export const Pois = {
  list: (owner: string) => api.get<POI[]>(`/pois/${qs({ owner })}`),
  geojson: (owner?: string) => api.get<GeoJSON>(`/pois/pois.geojson${qs({ owner })}`),
  nearbyGeojson: (params: { lat: number; lon: number; radius?: number; owner?: string }) =>
    api.get<GeoJSON>(`/pois/nearby.geojson${qs(params)}`),
  nearbyList: (params: { lat: number; lon: number; radius?: number; owner?: string }) =>
    api.get<POI[]>(`/pois/nearby.list${qs(params)}`),
  route: (id: number | string) => api.get<GeoJSON>(`/pois/${id}.route`),
  rawTile: (z: number, x: number, y: number) =>
    `${API_BASE}/pois/raw/${z}/${x}/${y}.pbf`,
  app: (id: number | string) => api.get<unknown>(`/pois/app/${id}`),
  get: (id: number | string) => api.get<POI>(`/pois/${id}`),
  create: (body: POI) => api.post<POI>(`/pois/`, body),
  update: (id: number | string, body: POI) => api.put<POI>(`/pois/${id}`, body),
  remove: (id: number | string) => api.del<unknown>(`/pois/${id}`),
  userVisible: {
    list: (params?: Record<string, unknown>) =>
      api.get<UserVisibility[]>(`/pois/uservisible/${qs(params)}`),
    create: (body: UserVisibility) => api.post<UserVisibility>(`/pois/uservisible/`, body),
    get: (id: number | string) => api.get<UserVisibility>(`/pois/uservisible/${id}`),
    update: (id: number | string, body: UserVisibility) =>
      api.put<UserVisibility>(`/pois/uservisible/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/pois/uservisible/${id}`),
  },
};

export const Itineraries = {
  list: (owner: string) => api.get<Itinerary[]>(`/itineraries/${qs({ owner })}`),
  listAlt: (params?: Record<string, unknown>) =>
    api.get<Itinerary[]>(`/itineraries/itineraries${qs(params)}`),
  geojson: (owner?: string) => api.get<GeoJSON>(`/itineraries/itineraries.geojson${qs({ owner })}`),
  getGeojson: (id: number | string) => api.get<GeoJSON>(`/itineraries/${id}.geojson`),
  route: (id: number | string) => api.get<GeoJSON>(`/itineraries/${id}.route`),
  get: (id: number | string) => api.get<Itinerary>(`/itineraries/${id}`),
  create: (body: Itinerary) => api.post<Itinerary>(`/itineraries/`, body),
  update: (id: number | string, body: Itinerary) => api.put<Itinerary>(`/itineraries/${id}`, body),
  remove: (id: number | string) => api.del<unknown>(`/itineraries/${id}`),
  userVisibility: {
    list: (params?: Record<string, unknown>) =>
      api.get<UserVisibility[]>(`/itineraries/uservisibility/${qs(params)}`),
    create: (body: UserVisibility) => api.post<UserVisibility>(`/itineraries/uservisibility/`, body),
    get: (id: number | string) => api.get<UserVisibility>(`/itineraries/uservisibility/${id}`),
    update: (id: number | string, body: UserVisibility) =>
      api.put<UserVisibility>(`/itineraries/uservisibility/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/itineraries/uservisibility/${id}`),
  },
};

export const Tags = {
  list: () => api.get<Tag[]>(`/tags/`),
  get: (id: number | string) => api.get<Tag>(`/tags/${id}`),
  create: (body: Tag) => api.post<Tag>(`/tags/`, body),
  update: (id: number | string, body: Tag) => api.put<Tag>(`/tags/${id}`, body),
  remove: (id: number | string) => api.del<unknown>(`/tags/${id}`),
  images: {
    list: () => api.get<unknown[]>(`/tags/images/`),
    create: (body: unknown) => api.post<unknown>(`/tags/images/`, body),
    get: (id: number | string) => api.get<unknown>(`/tags/images/${id}`),
    update: (id: number | string, body: unknown) => api.put<unknown>(`/tags/images/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/tags/images/${id}`),
  },
  preferences: {
    list: () => api.get<unknown[]>(`/tags/preferences/`),
    create: (body: unknown) => api.post<unknown>(`/tags/preferences/`, body),
    get: (id: number | string) => api.get<unknown>(`/tags/preferences/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/tags/preferences/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/tags/preferences/${id}`),
  },
};

export const Packages = {
  list: (owner: string) => api.get<Pkg[]>(`/packages/${qs({ owner })}`),
  get: (id: string) => api.get<Pkg>(`/packages/${id}`),
  create: (body: Pkg) => api.post<Pkg>(`/packages/`, body),
  update: (id: string, body: Pkg) => api.put<Pkg>(`/packages/${id}`, body),
  remove: (id: string) => api.del<unknown>(`/packages/${id}`),
  availabilities: (id: string, params?: Record<string, unknown>) =>
    api.get<unknown>(`/packages/${id}/availabilities${qs(params)}`),
  buy: (id: string, body: unknown) => api.post<unknown>(`/packages/${id}/buy`, body),
  cancelBooking: (bookingId: string | number) =>
    api.post<unknown>(`/packages/bookings/${bookingId}/cancel`),
  userVisibility: {
    list: (params?: Record<string, unknown>) =>
      api.get<UserVisibility[]>(`/packages/uservisibility/${qs(params)}`),
    create: (body: UserVisibility) => api.post<UserVisibility>(`/packages/uservisibility/`, body),
    get: (id: number | string) => api.get<UserVisibility>(`/packages/uservisibility/${id}`),
    update: (id: number | string, body: UserVisibility) =>
      api.put<UserVisibility>(`/packages/uservisibility/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/packages/uservisibility/${id}`),
  },
  bookings: {
    list: (params?: Record<string, unknown>) =>
      api.get<Booking[]>(`/packages/bookings/${qs(params)}`),
    create: (body: unknown) => api.post<unknown>(`/packages/bookings/`, body),
    get: (id: number | string) => api.get<Booking>(`/packages/bookings/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/packages/bookings/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/packages/bookings/${id}`),
  },
};

export const Utils = {
  markers: () => api.get<unknown>(`/utils/markers`),
  intropics: () => api.get<unknown>(`/utils/intropics`),
  preferences: () => api.get<unknown>(`/utils/preferences`),
  user: {
    getPreferences: () => api.get<unknown>(`/utils/user/preferences`),
    setPreferences: (body: unknown) => api.post<unknown>(`/utils/user/preferences`, body),
    deletePreferences: () => api.del<unknown>(`/utils/user/preferences`),
  },
  icons: {
    list: () => api.get<IconAsset[]>(`/utils/icons/`),
    create: (body: IconAsset) => api.post<IconAsset>(`/utils/icons/`, body),
    get: (id: number | string) => api.get<IconAsset>(`/utils/icons/${id}`),
    update: (id: number | string, body: IconAsset) => api.put<IconAsset>(`/utils/icons/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/utils/icons/${id}`),
  },
  markersCrud: {
    list: () => api.get<IconAsset[]>(`/utils/markers/`),
    create: (body: IconAsset) => api.post<IconAsset>(`/utils/markers/`, body),
    get: (id: number | string) => api.get<IconAsset>(`/utils/markers/${id}`),
    update: (id: number | string, body: IconAsset) =>
      api.put<IconAsset>(`/utils/markers/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/utils/markers/${id}`),
  },
  intropicsCrud: {
    list: () => api.get<IconAsset[]>(`/utils/intropics/`),
    create: (body: IconAsset) => api.post<IconAsset>(`/utils/intropics/`, body),
    get: (id: number | string) => api.get<IconAsset>(`/utils/intropics/${id}`),
    update: (id: number | string, body: IconAsset) =>
      api.put<IconAsset>(`/utils/intropics/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/utils/intropics/${id}`),
  },
};

export const Incoming = {
  regiondoWebhookUrl: (client: string) => `${API_BASE}/incoming/regiondo/wh/${client}`,
  bokunWebhookUrl: (client: string) => `${API_BASE}/incoming/bokun/wh/${client}`,
  mappings: {
    list: () => api.get<unknown[]>(`/incoming/mappings/`),
    create: (body: unknown) => api.post<unknown>(`/incoming/mappings/`, body),
    get: (id: number | string) => api.get<unknown>(`/incoming/mappings/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/incoming/mappings/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/incoming/mappings/${id}`),
  },
  resources: {
    list: () => api.get<unknown[]>(`/incoming/resources/`),
    create: (body: unknown) => api.post<unknown>(`/incoming/resources/`, body),
    get: (id: number | string) => api.get<unknown>(`/incoming/resources/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/incoming/resources/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/incoming/resources/${id}`),
  },
};

export const Consultant = {
  personas: () => api.get<unknown[]>(`/consultant/personas`),
  sessions: () => api.get<unknown[]>(`/consultant/sessions`),
  newSession: () => api.get<unknown>(`/consultant/sessions/new`),
  getSession: (id: string | number) => api.get<unknown>(`/consultant/sessions/${id}`),
  sessionArtifacts: (id: string | number) =>
    api.get<unknown[]>(`/consultant/sessions/${id}/artifacts`),
  sendMessage: (id: string | number, body: unknown) =>
    api.post<unknown>(`/consultant/sessions/${id}/message`, body),
  manage: {
    personas: {
      list: () => api.get<unknown[]>(`/consultant/manage/personas/`),
      create: (body: unknown) => api.post<unknown>(`/consultant/manage/personas/`, body),
      get: (id: number | string) => api.get<unknown>(`/consultant/manage/personas/${id}`),
      update: (id: number | string, body: unknown) =>
        api.put<unknown>(`/consultant/manage/personas/${id}`, body),
      remove: (id: number | string) => api.del<unknown>(`/consultant/manage/personas/${id}`),
    },
    sessions: {
      list: () => api.get<unknown[]>(`/consultant/manage/sessions/`),
      create: (body: unknown) => api.post<unknown>(`/consultant/manage/sessions/`, body),
      get: (id: number | string) => api.get<unknown>(`/consultant/manage/sessions/${id}`),
      update: (id: number | string, body: unknown) =>
        api.put<unknown>(`/consultant/manage/sessions/${id}`, body),
      remove: (id: number | string) => api.del<unknown>(`/consultant/manage/sessions/${id}`),
    },
    messages: {
      list: () => api.get<unknown[]>(`/consultant/manage/messages/`),
      create: (body: unknown) => api.post<unknown>(`/consultant/manage/messages/`, body),
      get: (id: number | string) => api.get<unknown>(`/consultant/manage/messages/${id}`),
      update: (id: number | string, body: unknown) =>
        api.put<unknown>(`/consultant/manage/messages/${id}`, body),
      remove: (id: number | string) => api.del<unknown>(`/consultant/manage/messages/${id}`),
    },
    artifacts: {
      list: () => api.get<unknown[]>(`/consultant/manage/artifacts/`),
      create: (body: unknown) => api.post<unknown>(`/consultant/manage/artifacts/`, body),
      get: (id: number | string) => api.get<unknown>(`/consultant/manage/artifacts/${id}`),
      update: (id: number | string, body: unknown) =>
        api.put<unknown>(`/consultant/manage/artifacts/${id}`, body),
      remove: (id: number | string) => api.del<unknown>(`/consultant/manage/artifacts/${id}`),
    },
  },
};

export const Bookings = {
  forClient: (client: string) => api.get<Booking[]>(`/tableau/${qs({ client })}`),
  forExperience: (ex: number | string) => api.get<Booking[]>(`/tableau/experience/${ex}`),
  forUser: (user: string) => api.get<Booking[]>(`/tableau/user/${user}`),
  book: (body: unknown) => api.post<unknown>(`/tableau/book`, body),
  confirmRefuse: (body: unknown) => api.post<unknown>(`/tableau/confirm_refuse`, body),
  changeStatus: (body: unknown) => api.post<unknown>(`/tableau/change_booking_status`, body),
  crud: {
    list: (params?: Record<string, unknown>) =>
      api.get<Booking[]>(`/tableau/bookings/${qs(params)}`),
    create: (body: unknown) => api.post<unknown>(`/tableau/bookings/`, body),
    get: (id: number | string) => api.get<Booking>(`/tableau/bookings/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/tableau/bookings/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/tableau/bookings/${id}`),
  },
};

export const UserItinerary = {
  itineraries: {
    list: (params?: Record<string, unknown>) =>
      api.get<unknown[]>(`/useritinerary/itineraries/${qs(params)}`),
    create: (body: unknown) => api.post<unknown>(`/useritinerary/itineraries/`, body),
    get: (id: number | string) => api.get<unknown>(`/useritinerary/itineraries/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/useritinerary/itineraries/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/useritinerary/itineraries/${id}`),
  },
  evaluations: {
    list: (params?: Record<string, unknown>) =>
      api.get<unknown[]>(`/useritinerary/evaluations/${qs(params)}`),
    create: (body: unknown) => api.post<unknown>(`/useritinerary/evaluations/`, body),
    get: (id: number | string) => api.get<unknown>(`/useritinerary/evaluations/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/useritinerary/evaluations/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/useritinerary/evaluations/${id}`),
  },
  pois: {
    list: (params?: Record<string, unknown>) =>
      api.get<unknown[]>(`/useritinerary/pois/${qs(params)}`),
    create: (body: unknown) => api.post<unknown>(`/useritinerary/pois/`, body),
    get: (id: number | string) => api.get<unknown>(`/useritinerary/pois/${id}`),
    update: (id: number | string, body: unknown) =>
      api.put<unknown>(`/useritinerary/pois/${id}`, body),
    remove: (id: number | string) => api.del<unknown>(`/useritinerary/pois/${id}`),
  },
};
