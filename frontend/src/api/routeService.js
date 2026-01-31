import apiClient from './apiClient';

export const travelApi = {
  // Реєстрація користувача (йде на /users/)
  registerUser: (userData) => 
    apiClient.post('/users/', userData).then(r => r.data),

  // НОВЕ: Вхід користувача (йде на /login/)
  loginUser: (userData) => 
    apiClient.post('/login/', userData).then(r => r.data),

  // Генерація маршруту
  generateRoute: (params) => 
    apiClient.post('/generate-route/', params).then(r => r.data),

  // Отримання історії
  getHistory: (userId) => 
    apiClient.get(`/history/${userId}`).then(r => r.data),

  // Видалення маршруту
  deleteRoute: (routeId) => 
    apiClient.delete(`/history/${routeId}`).then(r => r.data),

  // Оновлення назви
  updateRouteName: (routeId, newName) => 
    apiClient.patch(`/history/${routeId}`, { route_name: newName }).then(r => r.data)
};