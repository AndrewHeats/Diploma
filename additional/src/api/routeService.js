import apiClient from './apiClient';

export const travelApi = {
  // Реєстрація користувача
  registerUser: (userData) => 
    apiClient.post('/users/', userData).then(r => r.data),

  // Генерація маршруту
  generateRoute: (params) => 
    apiClient.post('/generate-route/', params).then(r => r.data),

  // Отримання історії за ID користувача
  getHistory: (userId) => 
    apiClient.get(`/history/${userId}`).then(r => r.data),

  // Видалення маршруту
  deleteRoute: (routeId) => 
    apiClient.delete(`/history/${routeId}`).then(r => r.data),

  // Оновлення назви маршруту
  updateRouteName: (routeId, newName) => 
    apiClient.patch(`/history/${routeId}`, { route_name: newName }).then(r => r.data)
};