import axios from 'axios';

// Якщо запускаєш на реальному Android-телефоні, 
// замість localhost обов'язково пиши IP свого комп'ютера (напр. 192.168.1.5)
const API_BASE_URL = 'http://192.168.0.101:8000'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export default apiClient;