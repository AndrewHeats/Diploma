import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';

// Екрани
import MapScreen from '../screens/mapScreen';
import ProfileScreen from '../screens/profileScreen';
import ItineraryScreen from '../screens/itineraryScreen';
import HistoryScreen from '../screens/historyScreen';
import AuthScreen from '../screens/authScreen';
import BlacklistScreen from '../screens/blacklistScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек Мапи (Мапа + Деталі)
function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: '#2196F3' }, 
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' } 
    }}>
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Мапа Львова' }} />
      <Stack.Screen name="Itinerary" component={ItineraryScreen} options={{ title: 'Ваш Маршрут' }} />
    </Stack.Navigator>
  );
}

// Стек Профілю (Налаштування + Бан-лист)
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: '#2196F3' }, 
      headerTintColor: '#fff' 
    }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Мій Профіль' }} />
      <Stack.Screen name="Blacklist" component={BlacklistScreen} options={{ title: 'Чорний список' }} />
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
            <Tab.Navigator screenOptions={{ 
              tabBarActiveTintColor: '#2196F3', 
              headerShown: false,
              tabBarStyle: { height: 60, paddingBottom: 10 }
            }}>
              <Tab.Screen 
                name="MapTab" 
                component={MapStack} 
                options={{ 
                  title: 'Мапа',
                  tabBarIcon: ({color, size}) => <Ionicons name="map" size={size} color={color} /> 
                }} 
              />
              <Tab.Screen 
                name="Історія" 
                component={HistoryScreen} 
                options={{ 
                  headerShown: true, 
                  title: 'Минулі прогулянки',
                  tabBarIcon: ({color, size}) => <Ionicons name="time" size={size} color={color} /> 
                }} 
              />
              <Tab.Screen 
                name="Профіль" 
                component={ProfileStack} 
                options={{ 
                  tabBarIcon: ({color, size}) => <Ionicons name="person" size={size} color={color} /> 
                }} 
              />
            </Tab.Navigator>
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};