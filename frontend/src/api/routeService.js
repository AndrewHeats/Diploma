import apiClient from './apiClient';

export const travelApi = {
  // --- АВТОРИЗАЦІЯ ---
  registerUser: (userData) => 
    apiClient.post('/users/', userData).then(r => r.data),

  loginUser: (userData) => 
    apiClient.post('/login/', userData).then(r => r.data),

  // --- МАРШРУТИ ---
  generateRoute: (params) => 
    apiClient.post('/generate-route/', params).then(r => r.data),

  getHistory: (userId) => 
    apiClient.get(`/history/${userId}`).then(r => r.data),

  deleteRoute: (routeId) => 
    apiClient.delete(`/history/${routeId}`).then(r => r.data),

  updateRouteName: (routeId, newName) => 
    apiClient.patch(`/history/${routeId}`, { route_name: newName }).then(r => r.data),

  // --- ЧОРНИЙ СПИСОК (Оновлено для роботи через apiClient) ---
  getBlacklist: (userId) => 
    apiClient.get(`/blacklist/${userId}`).then(r => r.data),

  addToBlacklist: (userId, placeId) => 
    apiClient.post('/blacklist/add', { user_id: userId, place_id: placeId }).then(r => r.data),

  removeFromBlacklist: (userId, placeId) => 
    apiClient.delete('/blacklist/remove', { data: { user_id: userId, place_id: placeId } }).then(r => r.data),

  // Лайк конкретного місця
  togglePlaceLike: (placeId, userId) => 
    apiClient.post(`/places/${placeId}/like`, null, { params: { user_id: userId } }).then(r => r.data),

  // Отримання рекомендацій на основі вподобань
  getRecommendations: (userId, cityName) => 
    apiClient.get(`/recommendations/${userId}/${cityName}`).then(r => r.data),
};