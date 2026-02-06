import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ItineraryScreen({ route, navigation }) {
  const { routeData } = route.params;

  const openNav = (lat, lon, name) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(name)}@${lat},${lon}`,
      android: `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`
    });
    Linking.openURL(url).catch(() => Alert.alert("Помилка", "Мапи не знайдено"));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headCard}>
        <Text style={styles.headTitle}>{routeData.route_name || "Твій маршрут"}</Text>
        <Text style={styles.headSub}>Всього: {routeData.total_duration_min} хв | {routeData.itinerary.length} зупинок</Text>
      </View>

      <FlatList
        data={routeData.itinerary}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item, index }) => (
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
              <TouchableOpacity onPress={() => {
                const p = routeData.points.find(pt => pt.name === item.to_name);
                if (p) openNav(p.latitude, p.longitude, p.name);
              }}>
                <Ionicons name="navigate-circle" size={40} color="#2196F3" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}><Text style={styles.closeText}>Назад до мапи</Text></TouchableOpacity>
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
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3', marginTop: 5 },
  line: { width: 2, flex: 1, backgroundColor: '#2196F3' },
  card: { flex: 1, backgroundColor: '#fff', marginLeft: 10, marginBottom: 15, borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  pName: { fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', marginTop: 5 },
  info: { fontSize: 12, color: '#666' },
  close: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  closeText: { color: '#fff', fontWeight: 'bold' }
});