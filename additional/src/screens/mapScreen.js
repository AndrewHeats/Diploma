import React, { useState, useContext, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function MapScreen({ navigation, route: navRoute }) {
  const { preferences, userLocation, setUserLocation, durationType, setDurationType, user } = useContext(AppContext);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navRoute.params?.savedRoute) {
      setRoute(navRoute.params.savedRoute);
    }
  }, [navRoute.params?.savedRoute]);

  const buildRoute = async () => {
    const selected = Object.keys(preferences).filter(k => preferences[k]);
    setLoading(true);
    
    // ПЕРЕВІРКА В КОНСОЛІ ТЕЛЕФОНУ
    console.log("Відправляємо запит. Юзер ID:", user?.id);

    try {
      const data = await travelApi.generateRoute({
        start_lat: userLocation.latitude,
        start_lon: userLocation.longitude,
        preferences: selected,
        duration_type: durationType,
        user_id: user?.id  // ЦЕЙ ID МАЄ БУТИ ПРАВИЛЬНИМ
      });

      setRoute(data);
      navigation.navigate('Itinerary', { routeData: data });
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося скласти маршрут.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{ ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        <Marker draggable coordinate={userLocation} onDragEnd={(e) => setUserLocation(e.nativeEvent.coordinate)} pinColor="black" title="Старт" />
        
        {route?.points?.map(p => (
          <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} pinColor="#E91E63" title={p.name} />
        ))}

        {route?.geometry?.coordinates && (
          <Polyline 
            key={Date.now().toString()} 
            coordinates={route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }))} 
            strokeWidth={5} 
            strokeColor="#2196F3" 
          />
        )}
      </MapView>

      <View style={styles.durationBar}>
        {['short', 'medium', 'long'].map(t => (
          <TouchableOpacity key={t} onPress={() => setDurationType(t)} style={[styles.tBtn, durationType === t && styles.active]}>
            <Text style={{color: durationType === t ? '#fff' : '#333'}}>{t === 'short' ? '1 год' : t === 'medium' ? '1-3 год' : '3+ год'}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  durationBar: { position: 'absolute', top: 50, flexDirection: 'row', alignSelf: 'center', backgroundColor: 'white', borderRadius: 25, padding: 5, elevation: 5 },
  tBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
  active: { backgroundColor: '#2196F3' },
  btnRow: { position: 'absolute', bottom: 30, flexDirection: 'row', width: '90%', alignSelf: 'center', justifyContent: 'space-between' },
  mainBtn: { backgroundColor: '#2196F3', padding: 18, borderRadius: 30, flex: 1, alignItems: 'center', marginRight: 10 },
  subBtn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 30, width: 65, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});