import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const register = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/api/users/register`, userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const login = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/api/users/login`, userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const upload = async (formData, token = null, onProgress, signal) => {
  if (!token) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      token = parsedUser?.token || null;
    }
  }

  if (!token) throw new Error('No authentication token available');

  const config = {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    },
    signal: signal,
  };

  const response = await axios.post(`${API_BASE_URL}/api/images/upload`, formData, config);
  return response.data;
};
