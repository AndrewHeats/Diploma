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
    preferences, cuisinePreferences, userLocation, 
    setUserLocation, durationType, setDurationType, user 
  } = useContext(AppContext);
  
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    if (navRoute.params?.savedRoute) {
      setRoute(navRoute.params.savedRoute);
      setSelectedPoint(null);
    }
  }, [navRoute.params?.savedRoute]);

  const openPlaceProfile = (name) => {
    if (!name) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(name + ' Львів')}`;
    Linking.openURL(url).catch(() => Alert.alert("Помилка", "Не вдалося відкрити браузер"));
  };

  const handleAddToBlacklist = (point) => {
    Alert.alert(
      "Заблокувати?",
      `Ви впевнені, що хочете додати "${point.name}" у чорний список?`,
      [
        { text: "Скасувати", style: "cancel" },
        { 
          text: "В бан", 
          style: "destructive", 
          onPress: async () => {
            try {
              await travelApi.addToBlacklist(user.id, point.id);
              setSelectedPoint(null);
              Alert.alert("Успіх", "Заклад заблоковано.");
            } catch (e) { Alert.alert("Помилка", "Не вдалося заблокувати."); }
          } 
        }
      ]
    );
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
      if (!data || !data.geometry) throw new Error("Відсутня геометрія");
      setRoute(data);
    } catch (e) { 
      Alert.alert("Помилка", "Не вдалося скласти маршрут."); 
      console.error(e);
    }
    finally { setLoading(false); }
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
        onPress={() => setSelectedPoint(null)}
      >
        <Marker coordinate={userLocation} draggable onDragEnd={(e) => setUserLocation(e.nativeEvent.coordinate)} pinColor="black" />
        
        {route?.points?.map((p, index) => (
          <Marker 
            key={`m-${index}-${p.id}`} 
            coordinate={{ latitude: parseFloat(p.latitude), longitude: parseFloat(p.longitude) }} 
            pinColor={selectedPoint?.id === p.id ? "#FFD700" : "#E91E63"}
            onPress={(e) => { e.stopPropagation(); setSelectedPoint(p); }}
          />
        ))}

        {/* ПОКРАЩЕНА ПОЛІЛІНІЯ З КЛЮЧЕМ */}
        {route?.geometry?.coordinates?.length > 0 && (
          <Polyline 
            key={`poly-${route.geometry.coordinates.length}-${route.total_duration_min}`}
            coordinates={route.geometry.coordinates.map(c => ({ 
              latitude: parseFloat(c[1]), 
              longitude: parseFloat(c[0]) 
            }))} 
            strokeWidth={5} 
            strokeColor="#2196F3" 
          />
        )}
      </MapView>

      {/* ПОВЗУНОК ЧАСУ - ЗАВЖДИ ВГОРІ (БЕЗ УМОВ) */}
      <View style={styles.durationBar}>
        {['short', 'medium', 'long'].map(t => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setDurationType(t)} 
            style={[styles.tBtn, durationType === t && styles.active]}
          >
            <Text style={{color: durationType === t ? '#fff' : '#333', fontSize: 13, fontWeight: 'bold'}}>
              {t === 'short' ? '1 год' : t === 'medium' ? '1-3 год' : '3+ год'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* КАРТКА МІСЦЯ З ВИПРАВЛЕНОЮ ВЕРСТКОЮ */}
      {selectedPoint && (
        <View style={styles.placeCard}>
          <View style={styles.cardHeader}>
            {/* ХРЕСТИК ЛІВОРУЧ */}
            <TouchableOpacity onPress={() => setSelectedPoint(null)} style={styles.closeAction}>
              <Ionicons name="close-circle" size={35} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.titleContent}>
              <Text style={styles.placeTitle} numberOfLines={1}>{selectedPoint.name}</Text>
              <Text style={styles.placeCategory}>{selectedPoint.category}</Text>
            </View>

            {/* БАН ПРАВОРУЧ (ОКРЕМО) */}
            <TouchableOpacity onPress={() => handleAddToBlacklist(selectedPoint)} style={styles.banAction}>
              <Ionicons name="trash-bin" size={26} color="#FF5252" />
              <Text style={styles.banText}>В бан</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.placeBtnMain} onPress={() => openPlaceProfile(selectedPoint.name)}>
            <Text style={styles.placeBtnText}>Сайт, меню та фото ➔</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectedPoint && (
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.mainBtn} onPress={buildRoute}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Скласти маршрут</Text>}
          </TouchableOpacity>
          {route && (
            <TouchableOpacity style={styles.subBtn} onPress={() => navigation.navigate('Itinerary', { routeData: route })}>
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
  durationBar: { 
    position: 'absolute', top: 60, flexDirection: 'row', alignSelf: 'center', 
    backgroundColor: 'white', borderRadius: 25, padding: 5, elevation: 10, zIndex: 100,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5,
  },
  tBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  active: { backgroundColor: '#2196F3' },

  placeCard: { 
    position: 'absolute', bottom: 30, left: 15, right: 15, 
    backgroundColor: 'white', borderRadius: 25, padding: 20, 
    elevation: 20, shadowOpacity: 0.3, shadowRadius: 10, zIndex: 200 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'space-between' },
  closeAction: { padding: 5 },
  titleContent: { flex: 1, paddingHorizontal: 10 },
  placeTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  placeCategory: { fontSize: 13, color: '#2196F3', fontWeight: '600', marginTop: 2 },
  banAction: { alignItems: 'center', minWidth: 50 },
  banText: { color: '#FF5252', fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  placeBtnMain: { backgroundColor: '#2196F3', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  placeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  btnRow: { position: 'absolute', bottom: 40, flexDirection: 'row', width: '90%', alignSelf: 'center', justifyContent: 'space-between', zIndex: 50 },
  mainBtn: { backgroundColor: '#2196F3', padding: 18, borderRadius: 30, flex: 1, alignItems: 'center', marginRight: 10, elevation: 5 },
  subBtn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 30, width: 65, alignItems: 'center', elevation: 5 },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});