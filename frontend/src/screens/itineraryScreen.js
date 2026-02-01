import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { travelApi } from '../api/routeService';

export default function ItineraryScreen({ route, navigation }) {
  const { routeData } = route.params;
  // Стан для назви (якщо в routeData немає id, беремо назву за замовчуванням)
  const [routeName, setRouteName] = useState(routeData.route_name || `Маршрут: ${routeData.total_duration_min} хв`);

  const handleRename = () => {
    // Якщо у нас немає ID збереженого маршруту (наприклад, він не зберігся), ми не можемо його перейменувати в БД
    if (!routeData.id) {
        Alert.alert("Увага", "Це тимчасовий маршрут. Ви зможете змінити назву в Історії.");
        return;
    }

    Alert.prompt(
      "Змінити назву",
      "Введіть нову назву для цього маршруту:",
      [
        { text: "Скасувати", style: "cancel" },
        { 
          text: "Зберегти", 
          onPress: async (newName) => {
            try {
              if (!newName) return;
              await travelApi.updateRouteName(routeData.id, newName);
              setRouteName(newName);
            } catch (e) {
              Alert.alert("Помилка", "Не вдалося оновити назву.");
            }
          } 
        }
      ],
      "plain-text",
      routeName
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ХЕДЕР З МОЖЛИВІСТЮ ПЕРЕЙМЕНУВАННЯ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>{routeName}</Text>
            <TouchableOpacity onPress={handleRename} style={styles.editBtn}>
              <Ionicons name="pencil" size={18} color="#2196F3" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Загальний час: <Text style={styles.blueText}>{routeData.total_duration_min} хв</Text>
          </Text>
        </View>
      </View>

      <FlatList
        data={routeData.itinerary}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item, index }) => (
          <View style={styles.stepContainer}>
            <View style={styles.timeline}>
              <View style={styles.dot} />
              {index < routeData.itinerary.length - 1 && <View style={styles.line} />}
            </View>
            
            <View style={styles.card}>
              <Text style={styles.locationName}>{item.to_name}</Text>
              <View style={styles.timeInfo}>
                <View style={styles.infoBadge}>
                  <Ionicons name="walk" size={14} color="#2196F3" />
                  <Text style={styles.infoText}>{item.duration_min} хв</Text>
                </View>
                <View style={[styles.infoBadge, { backgroundColor: '#E8F5E9', marginLeft: 8 }]}>
                  <Ionicons name="time-outline" size={14} color="#4CAF50" />
                  <Text style={[styles.infoText, { color: '#2E7D32' }]}>+{item.stay_min} хв там</Text>
                </View>
              </View>
              <Text style={styles.fromText}>Від: {item.from_name}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  editBtn: { marginLeft: 10, padding: 5 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', maxWidth: '85%' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  blueText: { color: '#2196F3', fontWeight: 'bold' },
  stepContainer: { flexDirection: 'row', minHeight: 100 },
  timeline: { alignItems: 'center', width: 20, marginRight: 15 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3', marginTop: 8 },
  line: { width: 2, flex: 1, backgroundColor: '#2196F3', marginTop: -2, marginBottom: -2 },
  card: { 
    flex: 1, backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  locationName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  timeInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  infoText: { fontSize: 12, color: '#2196F3', marginLeft: 4, fontWeight: '600' },
  fromText: { fontSize: 12, color: '#999' }
});