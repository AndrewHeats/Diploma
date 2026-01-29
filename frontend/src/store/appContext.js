import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState({
    latitude: 49.8397,
    longitude: 24.0297, // Центр Львова
  });
  const [preferences, setPreferences] = useState({
    culture: true,
    food: false,
    shopping: false,
    nature: true,
  });
  const [durationType, setDurationType] = useState('medium');

  return (
    <AppContext.Provider value={{ 
      user, setUser, 
      userLocation, setUserLocation, 
      preferences, setPreferences, 
      durationType, setDurationType 
    }}>
      {children}
    </AppContext.Provider>
  );
};