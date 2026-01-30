import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Дані користувача (id, email)
  const [user, setUser] = useState(null);

  // Основна локація (Львів за замовчуванням)
  const [userLocation, setUserLocation] = useState({
    latitude: 49.8397,
    longitude: 24.0297,
  });

  // Тип тривалості маршруту (short, medium, long)
  const [durationType, setDurationType] = useState('medium');

  // --- ВПОДОБАННЯ КАТЕГОРІЙ ---
  const [preferences, setPreferences] = useState({
    culture: true,
    food: true,
    nature: false,
    other: false,
  });

  // --- НОВЕ: ВПОДОБАННЯ КУХОНЬ ---
  // Ініціалізуємо порожнім об'єктом, щоб уникнути помилки "undefined"
  const [cuisinePreferences, setCuisinePreferences] = useState({
    ukrainian: false,
    italian: false,
    jewish: false,
    regional: false,
    coffee_shop: false,
    burger: false,
  });

  return (
    <AppContext.Provider value={{ 
      user, setUser,
      userLocation, setUserLocation,
      durationType, setDurationType,
      preferences, setPreferences,
      cuisinePreferences, setCuisinePreferences // Передаємо нові функції в контекст
    }}>
      {children}
    </AppContext.Provider>
  );
};