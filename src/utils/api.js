import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function checkResponseStatus(response) {
  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }
  if (response.status === 503) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data.maintenance) {
        useAuthStore.getState().setMaintenance(true, data.message);
      }
    } catch (e) {
      // Ignore JSON parse errors on 503
    }
  }
}

async function request(endpoint, options = {}) {
  const token = useAuthStore.getState().token;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  await checkResponseStatus(response);

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// For multipart/form-data uploads (FormData) — do NOT set Content-Type manually
async function uploadFile(endpoint, formData) {
  const token = useAuthStore.getState().token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  await checkResponseStatus(response);

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// For multipart/form-data uploads (FormData) — PUT variant
async function uploadFilePut(endpoint, formData) {
  const token = useAuthStore.getState().token;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers,
    body: formData,
  });

  await checkResponseStatus(response);

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: "GET", ...options }),
  post: (endpoint, body, options) =>
    request(endpoint, { method: "POST", body, ...options }),
  put: (endpoint, body, options) =>
    request(endpoint, { method: "PUT", body, ...options }),
  delete: (endpoint, options) =>
    request(endpoint, { method: "DELETE", ...options }),
  path: (endpoint, body, options) =>
    request(endpoint, { method: "PATCH", body, ...options }),
  postFile: (endpoint, formData) => uploadFile(endpoint, formData),
  putFile: (endpoint, formData) => uploadFilePut(endpoint, formData),
  downloadFile: (endpoint) => {
    const token = useAuthStore.getState().token;
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    }).then(res => {
      if (!res.ok) throw new Error("Download failed");
      return res.blob();
    });
  },
  getDownloadUrl: (endpoint) => {
    const token = useAuthStore.getState().token;
    return `${API_BASE_URL}${endpoint}?token=${token}`;
  }
};
export const getBackendUrl = () => {
  let resolvedUrl = '';
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    try {
      const parsed = new URL(API_BASE_URL);
      const port = parsed.port || '5000';
      resolvedUrl = `${window.location.protocol}//${window.location.hostname}:${port}`;
    } catch (e) {
      resolvedUrl = API_BASE_URL.replace('/api', '');
    }
  } else {
    // Relative API_BASE_URL, default to current host on port 5000
    resolvedUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  console.log('getBackendUrl dynamically resolved to:', resolvedUrl, 'from API_BASE_URL:', API_BASE_URL);
  return resolvedUrl;
};

export const resolveAttachmentUrl = (url) => {
  console.log('resolveAttachmentUrl input:', url);
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsedUrl = new URL(url);
      const res = `${getBackendUrl()}${parsedUrl.pathname}`;
      console.log('resolveAttachmentUrl output (absolute input):', res);
      return res;
    } catch (e) {
      console.log('resolveAttachmentUrl output (absolute parse error):', url);
      return url;
    }
  }
  const res = `${getBackendUrl()}${url}`;
  console.log('resolveAttachmentUrl output (relative input):', res);
  return res;
};

