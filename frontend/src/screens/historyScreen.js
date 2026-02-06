import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function HistoryScreen({ navigation }) {
  const { user } = useContext(AppContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!user?.id) return;
    if (!refreshing) setLoading(true);
    
    try {
      const data = await travelApi.getHistory(user.id);
      // Сортуємо: найновіші зверху
      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHistory(sortedData);
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося завантажити історію подорожей");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleDelete = async (id) => {
    Alert.alert("Видалення", "Видалити цей маршрут з історії?", [
      { text: "Скасувати", style: "cancel" },
      { 
        text: "Видалити", 
        style: "destructive", 
        onPress: async () => {
          try {
            await travelApi.deleteRoute(id);
            setHistory(history.filter(item => item.id !== id));
          } catch (e) {
            Alert.alert("Помилка", "Не вдалося видалити маршрут");
          }
        } 
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardMain}
        onPress={() => {
          // Перехід на мапу із завантаженням маршруту
          navigation.navigate('MapTab', { 
            screen: 'Map', 
            params: { savedRoute: item.route_data } 
          });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cityBadge}>
            <Ionicons name="location" size={14} color="#fff" />
            <Text style={styles.cityText}>
              {item.route_name?.split(':')[0] || "Маршрут"}
            </Text>
          </View>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString('uk-UA')}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.route_name || "Прогулянка містом"}
        </Text>
        
        <Text style={styles.summary} numberOfLines={2}>
          {item.points_summary || "Немає деталей маршруту"}
        </Text>

        <View style={styles.footer}>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color="#2196F3" />
            <Text style={styles.timeText}>{item.total_duration} хв у дорозі</Text>
          </View>
          <Ionicons name="chevron-forward-circle" size={24} color="#2196F3" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.deleteArea} 
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Історія подорожей</Text>
        <Text style={styles.screenSub}>Твої збережені пригоди</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#2196F3" size="large" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196F3" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={80} color="#DDD" />
              <Text style={styles.emptyText}>Поки що немає збережених маршрутів</Text>
              <TouchableOpacity 
                style={styles.emptyBtn} 
                onPress={() => navigation.navigate('MapTab')}
              >
                <Text style={styles.emptyBtnText}>Створити перший!</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  screenHeader: { padding: 25, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  screenTitle: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  screenSub: { fontSize: 14, color: '#999', marginTop: 4 },
  
  list: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 15, flexDirection: 'row', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardMain: { flex: 1, padding: 18 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2196F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cityText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  date: { fontSize: 11, color: '#BBB', fontWeight: '600' },
  
  title: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  summary: { fontSize: 13, color: '#777', lineHeight: 18, marginBottom: 15 },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  timeText: { fontSize: 12, color: '#2196F3', marginLeft: 6, fontWeight: 'bold' },
  
  deleteArea: { padding: 20, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F0F0F0' },
  
  loader: { marginTop: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, color: '#BBB', fontSize: 16, textAlign: 'center' },
  emptyBtn: { marginTop: 20, backgroundColor: '#2196F3', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
  emptyBtnText: { color: '#fff', fontWeight: 'bold' }
});