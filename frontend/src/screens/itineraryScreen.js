import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Linking, 
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ItineraryScreen({ route, navigation }) {
  const { routeData } = route.params;

  // Функція для відкриття профілю закладу в Google Maps
  const openInGoogleMaps = (name) => {
    const query = encodeURIComponent(`${name} Львів`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/${query}`);
      }
    }).catch(() => {
      Alert.alert("Помилка", "Не вдалося відкрити карти.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ХЕДЕР З ЗАГАЛЬНИМ ЧАСОМ МАРШРУТУ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Деталі прогулянки</Text>
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
            {/* Лінія та крапка зліва */}
            <View style={styles.timeline}>
              <View style={styles.dot} />
              {index < routeData.itinerary.length - 1 && <View style={styles.line} />}
            </View>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => openInGoogleMaps(item.to_name)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.locationName}>{item.from_name} ➔ {item.to_name}</Text>
                <Ionicons name="map-outline" size={18} color="#2196F3" />
              </View>

              {/* ЧАС МІЖ ТОЧКАМИ (ДЕТАЛІ) */}
              <View style={styles.timeInfo}>
                <View style={styles.infoBadge}>
                  <Ionicons name="walk" size={16} color="#2196F3" />
                  <Text style={styles.infoText}>{item.duration_min} хв йти</Text>
                </View>
                <View style={[styles.infoBadge, { marginLeft: 10 }]}>
                  <Ionicons name="navigate-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{item.distance_m} м</Text>
                </View>
              </View>
              
              <Text style={styles.tapHint}>Натисніть для фото та відгуків у Картах</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  blueText: { color: '#2196F3', fontWeight: 'bold' },
  
  stepContainer: { flexDirection: 'row', minHeight: 120 },
  timeline: { alignItems: 'center', width: 20, marginRight: 15 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2196F3', zIndex: 1, marginTop: 5 },
  line: { width: 2, flex: 1, backgroundColor: '#2196F3', marginTop: -5, marginBottom: -5 },
  
  card: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  locationName: { fontSize: 15, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  
  timeInfo: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  infoBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E3F2FD', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  infoText: { fontSize: 13, color: '#333', marginLeft: 5, fontWeight: '500' },
  
  tapHint: { fontSize: 11, color: '#2196F3', marginTop: 10, fontStyle: 'italic' }
});