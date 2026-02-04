import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, 
  ActivityIndicator, Linking, Alert, Platform, Dimensions 
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function MapScreen({ navigation, route: navRoute }) {
  const { 
    preferences, cuisinePreferences, userLocation, setUserLocation, 
    durationType, setDurationType, user, currentCity, changeCity, cityConfigs 
  } = useContext(AppContext);
  
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Слідкуємо за переданим маршрутом з Історії
  useEffect(() => {
    if (navRoute.params?.savedRoute) {
      setRoute(navRoute.params.savedRoute);
      setSelectedPoint(null);
    }
  }, [navRoute.params?.savedRoute]);

  const openPlaceProfile = (name) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + cityConfigs[currentCity].name)}`;
    Linking.openURL(url).catch(() => Alert.alert("Помилка", "Не вдалося відкрити браузер"));
  };

  const handleAddToBlacklist = (point) => {
    Alert.alert("Блокування", `Додати "${point.name}" у чорний список?`, [
      { text: "Скасувати", style: "cancel" },
      { text: "В бан", style: "destructive", onPress: async () => {
          try {
            await travelApi.addToBlacklist(user.id, point.id);
            setSelectedPoint(null);
            Alert.alert("Успіх", "Заклад більше не з'явиться у маршрутах.");
          } catch (e) { Alert.alert("Помилка", "Не вдалося заблокувати."); }
      }}
    ]);
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
    } catch (e) { Alert.alert("Помилка", "Не вдалося скласти маршрут."); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        onPress={() => setSelectedPoint(null)}
      >
        <Marker coordinate={userLocation} draggable onDragEnd={(e) => setUserLocation(e.nativeEvent.coordinate)} pinColor="black" />
        
        {route?.points?.map((p, i) => (
          <Marker 
            key={`m-${p.id}-${i}`}
            coordinate={{ latitude: parseFloat(p.latitude), longitude: parseFloat(p.longitude) }} 
            pinColor={selectedPoint?.id === p.id ? "#FFD700" : "#E91E63"}
            onPress={(e) => { e.stopPropagation(); setSelectedPoint(p); }}
          />
        ))}

        {route?.geometry?.coordinates?.length > 0 && (
          <Polyline 
            key={`poly-${route.geometry.coordinates.length}`}
            coordinates={route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }))} 
            strokeWidth={4} strokeColor="#2196F3" 
          />
        )}
      </MapView>

      {/* ВЕРХНЯ ПАНЕЛЬ (МІСТО ТА ЧАС) */}
      <View style={styles.topContainer}>
        <View style={styles.citySwitcher}>
          {Object.keys(cityConfigs).map(key => (
            <TouchableOpacity key={key} onPress={() => changeCity(key)} style={[styles.cityBtn, currentCity === key && styles.activeGreen]}>
              <Text style={[styles.cityText, currentCity === key && styles.textWhite]}>{cityConfigs[key].name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.durationBar}>
          {['short', 'medium', 'long'].map(t => (
            <TouchableOpacity key={t} onPress={() => setDurationType(t)} style={[styles.tBtn, durationType === t && styles.activeBlue]}>
              <Text style={{color: durationType === t ? '#fff' : '#333', fontSize: 12, fontWeight: 'bold'}}>
                {t === 'short' ? '1 год' : t === 'medium' ? '1-3 год' : '3+ год'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* КАРТКА МІСЦЯ */}
      {selectedPoint && (
        <View style={styles.placeCard}>
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={() => setSelectedPoint(null)} style={styles.iconPadding}>
              <Ionicons name="close-circle" size={32} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.placeTitle} numberOfLines={1}>{selectedPoint.name}</Text>
              <Text style={styles.placeCat}>{selectedPoint.category}</Text>
            </View>

            <TouchableOpacity onPress={() => handleAddToBlacklist(selectedPoint)} style={styles.iconPadding}>
              <Ionicons name="trash-bin" size={26} color="#FF5252" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.mainPlaceBtn} onPress={() => openPlaceProfile(selectedPoint.name)}>
            <Text style={styles.btnTextWhite}>Сайт та меню ➔</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* НИЖНЯ ПАНЕЛЬ КНОПОК */}
      {!selectedPoint && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.buildBtn} onPress={buildRoute}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextWhite}>Скласти маршрут</Text>}
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
  topContainer: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', zIndex: 100 },
  citySwitcher: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 4, elevation: 5, marginBottom: 10 },
  cityBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15 },
  cityText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  durationBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 25, padding: 4, elevation: 5 },
  tBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  activeBlue: { backgroundColor: '#2196F3' },
  activeGreen: { backgroundColor: '#4CAF50' },
  textWhite: { color: '#fff' },

  placeCard: { position: 'absolute', bottom: 30, left: 15, right: 15, backgroundColor: '#fff', borderRadius: 25, padding: 20, elevation: 15, zIndex: 200 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  iconPadding: { padding: 5 },
  titleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  placeTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  placeCat: { color: '#2196F3', fontSize: 13, fontWeight: '600' },
  mainPlaceBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 15, alignItems: 'center' },

  bottomActions: { position: 'absolute', bottom: 40, flexDirection: 'row', width: '90%', alignSelf: 'center' },
  buildBtn: { backgroundColor: '#2196F3', flex: 1, padding: 18, borderRadius: 30, alignItems: 'center', marginRight: 10, elevation: 5 },
  listBtn: { backgroundColor: '#4CAF50', width: 65, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});