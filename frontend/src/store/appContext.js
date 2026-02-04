import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Дані для міст
  const cityConfigs = {
    Lviv: { latitude: 49.8397, longitude: 24.0297, name: 'Львів' },
    Kyiv: { latitude: 50.4501, longitude: 30.5234, name: 'Київ' }
  };

  const [currentCity, setCurrentCity] = useState('Lviv');
  const [userLocation, setUserLocation] = useState(cityConfigs.Lviv);
  const [durationType, setDurationType] = useState('medium');

  const [preferences, setPreferences] = useState({
    culture: true,
    food: true,
    nature: true,
    other: false,
  });

  const [cuisinePreferences, setCuisinePreferences] = useState({
    asian: false,
    georgian: false,
    greek: false,
    ukrainian: false,
    italian: false,
    jewish: false,
    regional: false,
    coffee_shop: false,
    burger: false,
  });

  // Функція зміни міста
  const changeCity = (cityKey) => {
    setCurrentCity(cityKey);
    setUserLocation({
      latitude: cityConfigs[cityKey].latitude,
      longitude: cityConfigs[cityKey].longitude,
    });
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      currentCity, changeCity,
      userLocation, setUserLocation,
      preferences, setPreferences,
      cuisinePreferences, setCuisinePreferences,
      durationType, setDurationType,
      cityConfigs
    }}>
      {children}
    </AppContext.Provider>
  );
};