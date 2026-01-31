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

  const openInGoogleMaps = (name) => {
    if (!name) return;
    const query = encodeURIComponent(`${name}, Львів`);
    
    // Пряме посилання для Google Maps (більш стабільне)
    const googleUrl = `https://www.google.com/maps/search/?api=1&query={query}`;
    const appleUrl = `http://maps.apple.com/?q=${query}`;

    const url = Platform.OS === 'ios' ? appleUrl : googleUrl;

    Linking.openURL(url).catch(() => {
      Alert.alert("Помилка", "Не вдалося відкрити карти.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <View style={styles.timeline}>
              <View style={styles.dot} />
              {index < routeData.itinerary.length - 1 && <View style={styles.line} />}
            </View>
            
            <TouchableOpacity 
              style={styles.card}
              onPress={() => openInGoogleMaps(item.to_name)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.locationName}>{item.to_name}</Text>
                <Ionicons name="map-outline" size={18} color="#2196F3" />
              </View>

              <View style={styles.timeInfo}>
                <View style={styles.infoBadge}>
                  <Ionicons name="walk" size={14} color="#2196F3" />
                  <Text style={styles.infoText}>{item.duration_min} хв йти</Text>
                </View>

                {/* БЛОК ЧАСУ ПЕРЕБУВАННЯ */}
                <View style={[styles.infoBadge, { backgroundColor: '#E8F5E9', marginLeft: 8 }]}>
                  <Ionicons name="time-outline" size={14} color="#4CAF50" />
                  <Text style={[styles.infoText, { color: '#2E7D32' }]}>
                    + {item.stay_min || 0} хв там
                  </Text>
                </View>

                <View style={[styles.infoBadge, { backgroundColor: '#F5F5F5', marginLeft: 8 }]}>
                  <Text style={[styles.infoText, { color: '#666' }]}>{item.distance_m} м</Text>
                </View>
              </View>
              
              <Text style={styles.fromText}>Від: {item.from_name}</Text>
              <Text style={styles.tapHint}>Натисніть для відгуків та фото ➔</Text>
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
    elevation: 2
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  blueText: { color: '#2196F3', fontWeight: 'bold' },
  stepContainer: { flexDirection: 'row', minHeight: 110 },
  timeline: { alignItems: 'center', width: 20, marginRight: 15 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3', zIndex: 1, marginTop: 8 },
  line: { width: 2, flex: 1, backgroundColor: '#2196F3', marginTop: -2, marginBottom: -2 },
  card: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  locationName: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  timeInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E3F2FD', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  infoText: { fontSize: 12, color: '#2196F3', marginLeft: 4, fontWeight: '600' },
  fromText: { fontSize: 12, color: '#999' },
  tapHint: { fontSize: 11, color: '#2196F3', marginTop: 10, fontStyle: 'italic', textAlign: 'right' }
});