import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ItineraryScreen({ route, navigation }) {
  // Отримуємо дані маршруту з параметрів навігації
  const { routeData } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>План подорожі</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Загальний час: <Text style={styles.bold}>{routeData.total_duration_min} хв</Text>
        </Text>
        <Text style={styles.summaryText}>
          Точок відвідування: <Text style={styles.bold}>{routeData.points.length}</Text>
        </Text>
      </View>

      <FlatList
        data={routeData.itinerary}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item, index }) => (
          <View style={styles.stepRow}>
            <View style={styles.markerContainer}>
              <View style={styles.dot} />
              {index < routeData.itinerary.length - 1 && <View style={styles.line} />}
            </View>
            
            <View style={styles.content}>
              <Text style={styles.stepTitle}>{item.from_name} ➔ {item.to_name}</Text>
              <View style={styles.details}>
                <Ionicons name="walk-outline" size={14} color="#666" />
                <Text style={styles.detailText}>{item.duration_min} хв</Text>
                <Ionicons name="resize-outline" size={14} color="#666" style={{marginLeft: 15}} />
                <Text style={styles.detailText}>{item.distance_m} м</Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  summaryCard: { margin: 20, padding: 15, backgroundColor: '#F8F9FA', borderRadius: 12 },
  summaryText: { fontSize: 16, color: '#333', marginBottom: 5 },
  bold: { fontWeight: 'bold', color: '#2196F3' },
  stepRow: { flexDirection: 'row', marginBottom: 0 },
  markerContainer: { alignItems: 'center', width: 30 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3', zIndex: 1 },
  line: { width: 2, flex: 1, backgroundColor: '#2196F3', marginVertical: -5 },
  content: { flex: 1, marginLeft: 15, paddingBottom: 30 },
  stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  details: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  detailText: { fontSize: 13, color: '#666', marginLeft: 5 }
});