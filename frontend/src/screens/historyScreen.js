import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function HistoryScreen({ navigation }) {
  const { user } = useContext(AppContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Завантаження історії при відкритті екрана
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await travelApi.getHistory(user.id);
      setHistory(data);
    } catch (e) {
      console.error(e);
      Alert.alert("Помилка", "не вдалося завантажити історію");
    } finally {
      setLoading(false);
    }
  };

  const deleteRoute = async (id) => {
    Alert.alert(
      "Видалення",
      "Ви впевнені, що хочете видалити цей маршрут?",
      [
        { text: "Скасувати", style: "cancel" },
        { 
          text: "Видалити", 
          style: "destructive", 
          onPress: async () => {
            try {
              await travelApi.deleteRoute(id);
              setHistory(history.filter(item => item.id !== id));
            } catch (e) {
              Alert.alert("Помилка", "Не вдалося видалити");
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => navigation.navigate('Map', { savedRoute: item.route_data })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.routeName}>{item.route_name || "Прогулянка Львовом"}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        
        <Text style={styles.summary} numberOfLines={2}>
          {item.points_summary}
        </Text>

        <View style={styles.footer}>
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={14} color="#2196F3" />
            <Text style={styles.badgeText}>{item.total_duration} хв</Text>
          </View>
          <Text style={styles.tapToOpen}>Натисніть, щоб відкрити на карті ➔</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.deleteBtn} 
        onPress={() => deleteRoute(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мої маршрути</Text>
        <TouchableOpacity onPress={fetchHistory}>
          <Ionicons name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#2196F3" size="large" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>У вас поки немає збережених маршрутів</Text>
            </View>
          }
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    marginBottom: 15, 
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  cardContent: { flex: 1, padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  routeName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: '#999' },
  summary: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E3F2FD', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  badgeText: { fontSize: 12, color: '#2196F3', marginLeft: 4, fontWeight: '600' },
  tapToOpen: { fontSize: 11, color: '#2196F3', fontWeight: '500' },
  deleteBtn: { 
    padding: 15, 
    justifyContent: 'center', 
    borderLeftWidth: 1, 
    borderLeftColor: '#F0F0F0' 
  },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, color: '#999', fontSize: 16, textAlign: 'center' }
});