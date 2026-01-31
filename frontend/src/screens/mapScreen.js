import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, 
  ActivityIndicator, Linking, Alert, Platform 
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function MapScreen({ navigation, route: navRoute }) {
  const { 
    preferences, cuisinePreferences, userLocation, 
    setUserLocation, durationType, setDurationType, user 
  } = useContext(AppContext);
  
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navRoute.params?.savedRoute) {
      setRoute(navRoute.params.savedRoute);
    }
  }, [navRoute.params?.savedRoute]);

  const openInGoogleMaps = (name) => {
    if (!name) return;
    const query = encodeURIComponent(`${name}, Львів`);
    const url = Platform.OS === 'ios' ? `http://maps.apple.com/?q=${query}` : `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => Alert.alert("Помилка", "Не вдалося відкрити карти"));
  };

  const buildRoute = async () => {
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
      if (!data) throw new Error("Порожні дані від сервера");
      setRoute(data);
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося скласти маршрут. Спробуйте іншу локацію.");
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
        <Marker 
          draggable 
          coordinate={{
            latitude: parseFloat(userLocation.latitude),
            longitude: parseFloat(userLocation.longitude)
          }} 
          onDragEnd={(e) => setUserLocation(e.nativeEvent.coordinate)} 
          pinColor="black" 
        />
        
        {/* БЕЗПЕЧНИЙ РЕНДЕР МАРКЕРІВ */}
        {route?.points && route.points.map((p, index) => {
          const lat = parseFloat(p.latitude);
          const lon = parseFloat(p.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <Marker 
              key={`m-${p.id || index}-${route.total_duration_min}`} 
              coordinate={{ latitude: lat, longitude: lon }} 
              pinColor="#E91E63"
              tracksViewChanges={false}
            >
              <Callout onPress={() => openInGoogleMaps(p.name)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{String(p.name || "Місце")}</Text>
                  <Text style={styles.calloutSub}>{p.category || "Пам'ятка"}</Text>
                  <Text style={styles.calloutLink}>Відкрити карти ➔</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {/* БЕЗПЕЧНИЙ РЕНДЕР ПОЛІЛІНІЇ */}
        {route?.geometry?.coordinates?.length > 0 && (
          <Polyline 
            key={`poly-${route.geometry.coordinates.length}`}
            coordinates={route.geometry.coordinates.map(c => ({ 
              latitude: parseFloat(c[1]), 
              longitude: parseFloat(c[0]) 
            }))} 
            strokeWidth={4} 
            strokeColor="#2196F3" 
          />
        )}
      </MapView>

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

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.mainBtn} onPress={buildRoute}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Скласти маршрут</Text>}
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
    position: 'absolute', top: 60, flexDirection: 'row', alignSelf: 'center', 
    backgroundColor: 'white', borderRadius: 25, padding: 5, elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  tBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  active: { backgroundColor: '#2196F3' },
  btnRow: { position: 'absolute', bottom: 40, flexDirection: 'row', width: '90%', alignSelf: 'center', justifyContent: 'space-between' },
  mainBtn: { backgroundColor: '#2196F3', padding: 18, borderRadius: 30, flex: 1, alignItems: 'center', marginRight: 10 },
  subBtn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 30, width: 65, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  callout: { padding: 10, minWidth: 150, alignItems: 'center' },
  calloutTitle: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
  calloutSub: { fontSize: 12, color: '#8E8E93', marginVertical: 4 },
  calloutLink: { color: '#007AFF', fontWeight: '600', fontSize: 12 }
});