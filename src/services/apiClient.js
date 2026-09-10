// API Client สำหรับเชื่อมต่อกับ Express SQLite Backend
const BASE_URL = "/api";

export function getToken() {
  return localStorage.getItem("yooloei_token") || "";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("yooloei_token", token);
  } else {
    localStorage.removeItem("yooloei_token");
  }
}

export function getCurrentUserFromStorage() {
  try {
    const raw = localStorage.getItem("yooloei_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUserToStorage(user) {
  if (user) {
    localStorage.setItem("yooloei_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("yooloei_user");
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request(`${endpoint}${queryString}`, { method: "GET" });
  },

  post: (endpoint, body) => {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  put: (endpoint, body) => {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  patch: (endpoint, body) => {
    return request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: "DELETE" });
  },

  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/upload", {
      method: "POST",
      body: formData
    });
  }
};
