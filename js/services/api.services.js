// js/services/api.service.js
const API_URL = window.API_URL || "http://localhost:3000";

window.request = async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error API');
  }

  return data;
}
