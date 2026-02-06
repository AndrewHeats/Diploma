import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, 
  ActivityIndicator, Linking, Alert, Platform 
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function MapScreen({ navigation, route: navRoute }) {
  const { preferences, cuisinePreferences, userLocation, setUserLocation, durationType, user, currentCity, cityConfigs } = useContext(AppContext);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Центрування мапи при завантаженні збереженого маршруту
  useEffect(() => {
    if (navRoute.params?.savedRoute) {
      const saved = navRoute.params.savedRoute;
      setRoute(saved);
      setSelectedPoint(null);
      if (saved.points?.length > 0) {
        setUserLocation({
          latitude: parseFloat(saved.points[0].latitude),
          longitude: parseFloat(saved.points[0].longitude),
        });
      }
    }
  }, [navRoute.params?.savedRoute]);

  // Функція для відкриття зовнішніх карт (Навігатор)
  const openInMaps = (lat, lon, name) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(name)}@${lat},${lon}`,
      android: `geo:0,0?q=${lat},${lon}(${encodeURIComponent(name)})`
    });
    Linking.openURL(url).catch(() => Alert.alert("Помилка", "Не вдалося відкрити карти"));
  };

  const buildRoute = async () => {
    setSelectedPoint(null);
    setLoading(true);
    try {
      const data = await travelApi.generateRoute({
        start_lat: userLocation.latitude,
        start_lon: userLocation.longitude,
        preferences: Object.keys(preferences).filter(k => preferences[k]),
        cuisine_prefs: Object.keys(cuisinePreferences).filter(k => cuisinePreferences[k]),
        duration_type: durationType,
        user_id: user?.id
      });
      setRoute(data);
    } catch (e) { Alert.alert("Помилка", "Місць не знайдено. Спробуйте змінити точку або фільтри."); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{ ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        onPress={() => setSelectedPoint(null)}
      >
        {/* Чорний маркер - початкова точка */}
        <Marker coordinate={userLocation} draggable onDragEnd={(e) => setUserLocation(e.nativeEvent.coordinate)} pinColor="black" />
        
        {/* Маркери маршруту */}
        {route?.points?.map((p, i) => (
          <Marker 
            key={`m-${p.id}-${i}`}
            coordinate={{ latitude: parseFloat(p.latitude), longitude: parseFloat(p.longitude) }} 
            pinColor={selectedPoint?.id === p.id ? "#FFD700" : "#E91E63"}
            onPress={(e) => { e.stopPropagation(); setSelectedPoint(p); }}
          />
        ))}

        {/* Геометрія доріг */}
        {route?.geometry?.coordinates?.length > 0 && (
          <Polyline 
            key={`poly-${route.geometry.coordinates.length}`}
            coordinates={route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }))} 
            strokeWidth={4} strokeColor="#2196F3" 
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.settBtn} onPress={() => navigation.navigate('Профіль', { screen: 'Settings' })}>
        <Ionicons name="options" size={26} color="#2196F3" />
      </TouchableOpacity>

      {/* КАРТКА МІСЦЯ */}
      {selectedPoint && (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <TouchableOpacity onPress={() => setSelectedPoint(null)}>
              <Ionicons name="close-circle" size={32} color="#ccc" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.pTitle} numberOfLines={1}>{selectedPoint.name}</Text>
              {/* ДОДАНО КАТЕГОРІЮ */}
              <Text style={styles.pCat}>{selectedPoint.category?.toUpperCase()}</Text>
            </View>

            <TouchableOpacity onPress={async () => {
               await travelApi.addToBlacklist(user.id, selectedPoint.id);
               setSelectedPoint(null);
               Alert.alert("Бан", "Об'єкт видалено з майбутніх маршрутів");
            }}>
              <Ionicons name="trash-bin" size={24} color="#FF5252" />
            </TouchableOpacity>
          </View>

          {/* КНОПКА ПЕРЕХОДУ НА КАРТИ */}
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => openInMaps(selectedPoint.latitude, selectedPoint.longitude, selectedPoint.name)}
          >
            <View style={styles.btnContent}>
              <Ionicons name="navigate" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.btnText}>Маршрут у Навігаторі</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {!selectedPoint && (
        <View style={styles.botRow}>
          <TouchableOpacity style={styles.mainBtn} onPress={buildRoute}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Скласти маршрут</Text>}
          </TouchableOpacity>
          {route && (
            <TouchableOpacity style={styles.listBtn} onPress={() => navigation.navigate('Itinerary', { routeData: route })}>
              <Ionicons name="list" size={26} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  map: { flex: 1 },
  settBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: '#fff', padding: 12, borderRadius: 30, elevation: 5 },
  
  card: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 25, padding: 20, elevation: 15 },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  titleContainer: { flex: 1, alignItems: 'center' },
  pTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  pCat: { fontSize: 12, color: '#2196F3', fontWeight: 'bold', marginTop: 2 }, // Стиль для категорії
  
  actionBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 15, alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  
  botRow: { position: 'absolute', bottom: 40, flexDirection: 'row', width: '90%', alignSelf: 'center' },
  mainBtn: { backgroundColor: '#2196F3', flex: 1, padding: 18, borderRadius: 30, alignItems: 'center', marginRight: 10 },
  listBtn: { backgroundColor: '#4CAF50', width: 65, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});