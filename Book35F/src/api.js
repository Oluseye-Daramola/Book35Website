const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(path, { token, body, ...options } = {}) {
  const shouldStringify =
    body !== undefined && !(body instanceof FormData) && typeof body !== "string";

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    ...(body !== undefined ? { body: shouldStringify ? JSON.stringify(body) : body } : {}),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    // some responses (e.g. 204 No Content) have no body to parse
  }

  if (!response.ok) {
    const message =
      result?.errors?.[0] || result?.message || result?.error || "Request failed";
    const error = new Error(message);
    error.status = response.status; // lets callers detect 401 (expired/invalid token)
    throw error;
  }

  return result;
}

export async function registerProvider({ name, businessName, email, password, phone, bio }) {
  const result = await apiRequest("/auth/register", {
    method: "POST",
    body: { name, businessName, email, password, phone, bio },
  });
  return result.data; // { provider, token }
}

export async function loginProvider({ email, password }) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return result.data; // { provider, token }
}

export async function getProviderProfile(token) {
  const result = await apiRequest("/providers/me", { token });
  return result.data.provider;
}

export async function updateProviderProfile({
  token,
  name,
  businessName,
  location,
  services,
  slogan,
  phone,
  bio,
  avatar,
}) {
  const result = await apiRequest("/providers/me", {
    method: "PUT",
    token,
    body: { name, businessName, location, services, slogan, phone, bio, avatar },
  });
  return result.data.provider;
}

export async function getProviderAvailability(token) {
  const result = await apiRequest("/availability", { token });
  return result.data.availability;
}

// startTime/endTime are ISO timestamps for one specific date;
// slotDuration is the appointment length in minutes (10, 15, 20, 30, 45 or 60)
export async function createProviderAvailability({ token, startTime, endTime, slotDuration }) {
  const result = await apiRequest("/availability", {
    method: "POST",
    token,
    body: { startTime, endTime, slotDuration },
  });
  return result.data.availability;
}

// Any of startTime, endTime, slotDuration may be sent; omitted ones are kept.
// Returns { availability, slots } so the edit modal can refresh its slot list.
export async function updateProviderAvailability({ token, id, startTime, endTime, slotDuration }) {
  const result = await apiRequest(`/availability/${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    body: { startTime, endTime, slotDuration },
  });
  return result.data;
}

// Every slot in one window, each with status "open" | "booked" | "cancelled".
// Returns { availability, slots }.
export async function getProviderAvailabilitySlots({ token, id }) {
  const result = await apiRequest(`/availability/${encodeURIComponent(id)}/slots`, { token });
  return result.data;
}

// Cancel (cancelled: true) or restore (cancelled: false) one slot by its start
// time; the window's start and end times stay the same. Returns { availability, slots }.
export async function setProviderAvailabilitySlotCancelled({ token, id, startTime, cancelled }) {
  const result = await apiRequest(`/availability/${encodeURIComponent(id)}/slots`, {
    method: "PATCH",
    token,
    body: { startTime, cancelled },
  });
  return result.data;
}

export async function deleteProviderAvailability({ token, id }) {
  return apiRequest(`/availability/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

// ---- Public booking page (no token) ----

// { id, name, businessName, bio, slug, location, services, slogan, avatar }
export async function getPublicProvider(slug) {
  const result = await apiRequest(`/public/providers/${encodeURIComponent(slug)}`);
  return result.data.provider;
}

// Open slots for the next 14 days: [{ startTime, endTime, duration }] (ISO times)
export async function getPublicSlots(slug) {
  const result = await apiRequest(`/public/providers/${encodeURIComponent(slug)}/slots`);
  return result.data.slots;
}

// provider is the provider's id; startTime is a slot's startTime.
// The new appointment starts out "pending" until the provider confirms it.
export async function createPublicAppointment({
  provider,
  startTime,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  notes,
}) {
  const result = await apiRequest("/public/appointments", {
    method: "POST",
    body: { provider, startTime, customerName, customerEmail, customerPhone, serviceName, notes },
  });
  return result.data.appointment;
}

// ---- Provider dashboard appointments ----

// Every appointment for the signed-in provider, sorted by startTime
export async function getProviderAppointments(token) {
  const result = await apiRequest("/appointments", { token });
  return result.data.appointments;
}

// action is "confirm", "cancel" or "complete"; returns the updated appointment
export async function updateProviderAppointmentStatus({ token, id, action }) {
  const result = await apiRequest(`/appointments/${encodeURIComponent(id)}/${action}`, {
    method: "PATCH",
    token,
  });
  return result.data.appointment;
}