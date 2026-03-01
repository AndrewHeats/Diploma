import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';

// Імпорт екранів
import MapScreen from '../screens/mapScreen';
import ProfileScreen from '../screens/profileScreen';
import ItineraryScreen from '../screens/itineraryScreen';
import HistoryScreen from '../screens/historyScreen';
import AuthScreen from '../screens/authScreen';
import BlacklistScreen from '../screens/blacklistScreen';
import SettingsScreen from '../screens/settingsScreen';
import RecommendationsScreen from '../screens/recommendationsScreen';
import ChatScreen from '../screens/chatScreen'; // НОВИЙ ЕКРАН

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек Мапи
function MapStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#2196F3' }, 
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Мапа України' }} />
      <Stack.Screen name="Itinerary" component={ItineraryScreen} options={{ title: 'Деталі маршруту' }} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'AI: Рекомендації' }} />
    </Stack.Navigator>
  );
}

// Стек Профілю
function ProfileStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#2196F3' }, 
        headerTintColor: '#fff' 
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Мій Профіль' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Налаштування подорожі' }} />
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
            <Tab.Navigator 
              screenOptions={{ 
                tabBarActiveTintColor: '#2196F3', 
                headerShown: false,
                unmountOnBlur: false 
              }}
            >
              <Tab.Screen 
                name="MapTab" 
                component={MapStack} 
                options={{ 
                  title: 'Мапа',
                  tabBarIcon: ({color, size}) => <Ionicons name="map" size={size} color={color} /> 
                }} 
              />
              
              {/* НОВИЙ ТАБ: ЧАТ */}
              <Tab.Screen 
                name="Чат" 
                component={ChatScreen} 
                options={{ 
                  title: 'Форум',
                  tabBarIcon: ({color, size}) => <Ionicons name="chatbubbles" size={size} color={color} /> 
                }} 
              />

              <Tab.Screen 
                name="Історія" 
                component={HistoryScreen} 
                options={{ 
                  headerShown: true, 
                  title: 'Історія',
                  tabBarIcon: ({color, size}) => <Ionicons name="time" size={size} color={color} /> 
                }} 
              />
              
              <Tab.Screen 
                name="Профіль" 
                component={ProfileStack} 
                options={{ 
                  tabBarIcon: ({color, size}) => <Ionicons name="person" size={size} color={color} /> 
                }} 
                listeners={({ navigation }) => ({
                  tabPress: (e) => {
                    e.preventDefault();
                    navigation.navigate('Профіль', { screen: 'ProfileMain' });
                  },
                })}
              />
            </Tab.Navigator>
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};