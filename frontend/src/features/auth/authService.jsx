import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users/';
const IMAGE_API_URL = 'http://localhost:5000/api/images/';

export const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  if (response.data) {
    sessionStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);
  if (response.data) {
    sessionStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const upload = async (formData, token, onProgress, signal) => {
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

  const response = await axios.post(IMAGE_API_URL + 'upload', formData, config);
  return response.data;
};
