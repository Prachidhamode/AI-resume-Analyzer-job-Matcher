const API_BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // If we are uploading files, let browser handle boundary and headers
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Session expired or unauthorized
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.hash.includes('login') && !window.location.hash.includes('signup')) {
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `API error (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      ...options,
    });
  },
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};
