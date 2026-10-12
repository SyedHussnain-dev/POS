import axios from 'axios';

let rawBaseURL = import.meta.env.VITE_API_URL || '/api';

if (rawBaseURL.startsWith('http')) {
  rawBaseURL = rawBaseURL.replace(/\/+$/, '');
  if (!rawBaseURL.endsWith('/api')) {
    rawBaseURL = `${rawBaseURL}/api`;
  }
}

const api = axios.create({
  baseURL: rawBaseURL,
});

export default api;

