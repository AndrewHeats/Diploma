import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function ItineraryScreen({ route, navigation }) {
  // Захист від відсутності параметрів
  const routeData = route.params?.routeData || { itinerary: [], points: [], total_duration_min: 0 };
  const { user } = useContext(AppContext);
  const [likedIds, setLikedIds] = useState([]);

  // Функція для перемикання лайка місця (навчання ШІ)
  const handleLikePlace = async (placeId) => {
    try {
      await travelApi.togglePlaceLike(placeId, user.id);
      setLikedIds(prev => 
        prev.includes(placeId) ? prev.filter(id => id !== placeId) : [...prev, placeId]
      );
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося зберегти вподобання");
    }
  };

  const openNav = (lat, lon, name) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(name)}@${lat},${lon}`,
      android: `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`
    });
    Linking.openURL(url).catch(() => Alert.alert("Помилка", "Мапи не знайдено"));
  };

  // Визначаємо місто для переходу до рекомендацій
  const openRecommendations = () => {
    // Надійно отримуємо опис першої точки
    const firstPointDesc = (routeData.points && routeData.points.length > 0) 
      ? routeData.points[0].description 
      : "";
      
    // Шукаємо місто і очищаємо рядок (JS використовує .trim(), а не .strip())
    const cityPart = firstPointDesc.split('|').find(p => p.includes('Місто:'));
    const currentCity = cityPart ? cityPart.replace('Місто:', '').trim() : "Lviv";

    navigation.navigate('Recommendations', { cityName: currentCity });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headCard}>
        <Text style={styles.headTitle}>{routeData.route_name || "Твій маршрут"}</Text>
        <Text style={styles.headSub}>
          Всього: {routeData.total_duration_min} хв | {routeData.itinerary?.length || 0} зупинок
        </Text>
      </View>

      <FlatList
        data={routeData.itinerary}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item, index }) => {
          const point = routeData.points?.find(pt => pt.name === item.to_name);
          return (
            <View style={styles.step}>
              <View style={styles.lineBox}>
                <View style={styles.dot} />
                {index < routeData.itinerary.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.card}>
                <View style={{flex: 1}}>
                  <Text style={styles.pName}>{item.to_name}</Text>
                  <View style={styles.row}>
                    <Text style={styles.info}>🚶 {item.duration_min} хв</Text>
                    <Text style={[styles.info, {marginLeft: 15}]}>☕ {item.stay_min} хв там</Text>
                  </View>
                </View>
                
                {/* Кнопка лайка місця */}
                <TouchableOpacity onPress={() => point && handleLikePlace(point.id)} style={{marginRight: 15}}>
                  <Ionicons 
                    name={likedIds.includes(point?.id) ? "heart" : "heart-outline"} 
                    size={28} 
                    color={likedIds.includes(point?.id) ? "#FF5252" : "#ccc"} 
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => point && openNav(point.latitude, point.longitude, point.name)}>
                  <Ionicons name="navigate-circle" size={44} color="#2196F3" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.aiBtn} onPress={openRecommendations}>
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles.btnText}>AI Рекомендації</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Назад</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headCard: { backgroundColor: '#fff', padding: 20, margin: 20, borderRadius: 20, elevation: 5 },
  headTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headSub: { color: '#2196F3', marginTop: 5, fontWeight: '600' },
  step: { flexDirection: 'row', minHeight: 100 },
  lineBox: { alignItems: 'center', width: 30 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2196F3', marginTop: 5 },
  line: { width: 3, flex: 1, backgroundColor: '#2196F3' },
  card: { flex: 1, backgroundColor: '#fff', marginLeft: 10, marginBottom: 15, borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  pName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  row: { flexDirection: 'row', marginTop: 5 },
  info: { fontSize: 12, color: '#666' },
  footerActions: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 30, paddingHorizontal: 20 },
  aiBtn: { backgroundColor: '#9C27B0', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 4 },
  close: { backgroundColor: '#333', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 30 },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  closeText: { color: '#fff', fontWeight: 'bold' }
});