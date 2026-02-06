import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Географія України для твого проєкту
  const cityConfigs = {
    Lviv: { latitude: 49.8397, longitude: 24.0297, name: 'Львів' },
    Kyiv: { latitude: 50.4501, longitude: 30.5234, name: 'Київ' },
    Odesa: { latitude: 46.4825, longitude: 30.7233, name: 'Одеса' },
    Kharkiv: { latitude: 49.9935, longitude: 36.2304, name: 'Харків' },
    Dnipro: { latitude: 48.4647, longitude: 35.0462, name: 'Дніпро' },
    Frankivsk: { latitude: 48.9226, longitude: 24.7111, name: 'Івано-Франківськ' },
    Ternopil: { latitude: 49.5535, longitude: 25.5948, name: 'Тернопіль' },
    Chernivtsi: { latitude: 48.2921, longitude: 25.9358, name: 'Чернівці' },
    Vinnytsia: { latitude: 49.2331, longitude: 28.4682, name: 'Вінниця' }
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