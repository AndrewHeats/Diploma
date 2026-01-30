import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Linking, 
  Alert 
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function MapScreen({ navigation, route: navRoute }) {
  const { 
    preferences, 
    cuisinePreferences, 
    userLocation, 
    setUserLocation, 
    durationType, 
    setDurationType, 
    user 
  } = useContext(AppContext);
  
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  // Відслідковуємо, чи прийшов збережений маршрут з історії
  useEffect(() => {
    if (navRoute.params?.savedRoute) {
      setRoute(navRoute.params.savedRoute);
    }
  }, [navRoute.params?.savedRoute]);

  // ВИПРАВЛЕНО: Функція для відкриття Google Maps без "пшиків"
  const openInGoogleMaps = (name) => {
    const query = encodeURIComponent(`${name}, Львів`);
    // Використовуємо універсальний URL для пошуку місця
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Помилка", "Не вдалося відкрити додаток карт");
      }
    }).catch(err => console.error("Помилка при відкритті карт:", err));
  };

  const buildRoute = async () => {
    // Збираємо активні категорії та кухні
    const selectedPrefs = Object.keys(preferences).filter(k => preferences[k]);
    const selectedCuisines = Object.keys(cuisinePreferences).filter(k => cuisinePreferences[k]);

    setLoading(true);
    try {
      const data = await travelApi.generateRoute({
        start_lat: userLocation.latitude,
        start_lon: userLocation.longitude,
        preferences: selectedPrefs,
        cuisine_prefs: selectedCuisines,
        duration_type: durationType,
        user_id: user?.id
      });
      setRoute(data);
    } catch (e) {
      console.error("Помилка при генерації маршруту:", e.response?.data || e.message);
      Alert.alert("Помилка", "Не вдалося скласти маршрут. Спробуйте змінити налаштування.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Маркер користувача (можна перетягувати) */}
        <Marker 
          draggable 
          coordinate={userLocation} 
          onDragEnd={(e) => setUserLocation(e.nativeEvent.coordinate)} 
          pinColor="black" 
          title="Ваше місцезнаходження"
        />
        
        {/* Точки маршруту */}
        {route?.points?.map(p => (
          <Marker 
            key={p.id} 
            coordinate={{ latitude: p.latitude, longitude: p.longitude }} 
            pinColor="#E91E63"
          >
            <Callout onPress={() => openInGoogleMaps(p.name)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{p.name}</Text>
                <Text style={styles.calloutSub}>Категорія: {p.category}</Text>
                <View style={styles.infoRow}>
                   <Text style={styles.calloutLink}>Інфо та фото ➔</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Лінія маршруту по дорогах */}
        {route?.geometry?.coordinates && (
          <Polyline 
            key={`route-line-${route.geometry.coordinates.length}`}
            coordinates={route.geometry.coordinates.map(c => ({ 
              latitude: c[1], 
              longitude: c[0] 
            }))} 
            strokeWidth={5} 
            strokeColor="#2196F3" 
          />
        )}
      </MapView>

      {/* Перемикач тривалості */}
      <View style={styles.durationBar}>
        {['short', 'medium', 'long'].map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setDurationType(t)} 
            style={[styles.tBtn, durationType === t && styles.active]}
          >
            <Text style={{color: durationType === t ? '#fff' : '#333'}}>
              {t === 'short' ? '1 год' : t === 'medium' ? '1-3 год' : '3+ год'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Кнопки керування */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.mainBtn} onPress={buildRoute}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Скласти маршрут</Text>
          )}
        </TouchableOpacity>
        
        {route && (
          <TouchableOpacity 
            style={styles.subBtn} 
            onPress={() => navigation.navigate('Itinerary', { routeData: route })}
          >
            <Ionicons name="list" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  durationBar: { 
    position: 'absolute', 
    top: 50, 
    flexDirection: 'row', 
    alignSelf: 'center', 
    backgroundColor: 'white', 
    borderRadius: 25, 
    padding: 5, 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  active: { backgroundColor: '#2196F3' },
  btnRow: { 
    position: 'absolute', 
    bottom: 30, 
    flexDirection: 'row', 
    width: '90%', 
    alignSelf: 'center', 
    justifyContent: 'space-between' 
  },
  mainBtn: { 
    backgroundColor: '#2196F3', 
    padding: 18, 
    borderRadius: 30, 
    flex: 1, 
    alignSelf: 'center',
    alignItems: 'center', 
    marginRight: 10, 
    elevation: 5 
  },
  subBtn: { 
    backgroundColor: '#4CAF50', 
    padding: 18, 
    borderRadius: 30, 
    width: 65, 
    alignItems: 'center', 
    elevation: 5 
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  callout: { padding: 8, minWidth: 150 },
  calloutTitle: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  calloutSub: { fontSize: 12, color: '#666', marginBottom: 5 },
  infoRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 5, marginTop: 5 },
  calloutLink: { color: '#2196F3', fontWeight: 'bold', fontSize: 12, textAlign: 'center' }
});