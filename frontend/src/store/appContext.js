import React, { createContext, useState } from 'react';

// Створюємо контекст
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 1. ДАНІ КОРИСТУВАЧА (id, email)
  const [user, setUser] = useState(null);

  // 2. ЛОКАЦІЯ (Початкова точка — центр Львова, Ратуша)
  const [userLocation, setUserLocation] = useState({
    latitude: 49.8397,
    longitude: 24.0297,
  });

  // 3. ОСНОВНІ КАТЕГОРІЇ МАРШРУТУ (preferences)
  const [preferences, setPreferences] = useState({
    culture: true,
    food: true,
    nature: true,
    other: false,
  });

  // 4. УЛЮБЛЕНІ КУХНІ (cuisinePreferences)
  // Синхронізовано з ProfileScreen та seed_osm.py
  const [cuisinePreferences, setCuisinePreferences] = useState({
    ukrainian: false,
    italian: false,
    georgian: false,  // Додано
    asian: false,     // Додано
    greek: false,     // Додано
    jewish: false,
    regional: false,
    coffee_shop: false,
    burger: false,
  });

  // 5. ТИП ТРИВАЛОСТІ (short, medium, long)
  const [durationType, setDurationType] = useState('medium');

  return (
    <AppContext.Provider
      value={{
        // Дані користувача
        user,
        setUser,
        
        // Геопозиція
        userLocation,
        setUserLocation,
        
        // Фільтри категорій
        preferences,
        setPreferences,
        
        // Фільтри кухонь
        cuisinePreferences,
        setCuisinePreferences,
        
        // Тривалість прогулянки
        durationType,
        setDurationType,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};