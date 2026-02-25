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
import RecommendationsScreen from '../screens/recommendationsScreen'; // Новий екран ШІ-рекомендацій

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек Мапи: включає основну мапу, деталі маршруту та рекомендації
function MapStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#2196F3' }, 
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: 'Мапа України' }} 
      />
      <Stack.Screen 
        name="Itinerary" 
        component={ItineraryScreen} 
        options={{ title: 'Деталі маршруту' }} 
      />
      {/* Спеціальна сторінка "Ви також можете відвідати" на основі liked_places */}
      <Stack.Screen 
        name="Recommendations" 
        component={RecommendationsScreen} 
        options={{ title: 'AI: Рекомендації' }} 
      />
    </Stack.Navigator>
  );
}

// Стек Профілю: налаштування та керування чорним списком
function ProfileStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#2196F3' }, 
        headerTintColor: '#fff' 
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: 'Мій Профіль' }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Налаштування подорожі' }} 
      />
      <Stack.Screen 
        name="Blacklist" 
        component={BlacklistScreen} 
        options={{ title: 'Чорний список' }} 
      />
    </Stack.Navigator>
  );
}

export const AppNavigator = () => {
  const { user } = useContext(AppContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Екран авторизації, якщо користувач не увійшов
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        // Головна навігація після входу
        <Stack.Screen name="Main">
          {() => (
            <Tab.Navigator 
              screenOptions={{ 
                tabBarActiveTintColor: '#2196F3', 
                headerShown: false,
                unmountOnBlur: false // Залишаємо false, щоб не втрачати стан маршруту на мапі
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
                    // 1. Блокуємо стандартну поведінку (відновлення старого екрана в стеку)
                    e.preventDefault();
                    
                    // 2. Примусовий скид до головної сторінки профілю при натисканні на таб
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