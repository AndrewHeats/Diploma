import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';

// Імпорти з малих літер як у файловій системі
import MapScreen from '../screens/mapScreen';
import ProfileScreen from '../screens/profileScreen';
import ItineraryScreen from '../screens/itineraryScreen';
import HistoryScreen from '../screens/historyScreen';
import AuthScreen from '../screens/authScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#2196F3' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="MapMain" component={MapScreen} options={{ title: 'Мапа Львова' }} />
      <Stack.Screen name="Itinerary" component={ItineraryScreen} options={{ title: 'Маршрут' }} />
    </Stack.Navigator>
  );
}

export const AppNavigator = () => {
  const { user } = useContext(AppContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Stack.Screen name="Main">
          {() => (
            <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#2196F3', headerShown: false }}>
              <Tab.Screen name="Мапа" component={MapStack} options={{ 
                tabBarIcon: ({color, size}) => <Ionicons name="map" size={size} color={color} /> 
              }} />
              <Tab.Screen name="Історія" component={HistoryScreen} options={{ 
                headerShown: true, title: 'Минулі поїздки',
                tabBarIcon: ({color, size}) => <Ionicons name="time" size={size} color={color} /> 
              }} />
              <Tab.Screen name="Профіль" component={ProfileScreen} options={{ 
                headerShown: true, title: 'Мій Профіль',
                tabBarIcon: ({color, size}) => <Ionicons name="person" size={size} color={color} /> 
              }} />
            </Tab.Navigator>
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};