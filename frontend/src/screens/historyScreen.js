import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl 
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
    setLoading(true);
    try {
      const data = await travelApi.getHistory(user.id);
      setHistory(data);
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося завантажити історію");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRename = (id, oldName) => {
    Alert.prompt(
      "Змінити назву",
      "Введіть нову назву маршруту:",
      [
        { text: "Скасувати", style: "cancel" },
        { 
          text: "Зберегти", 
          onPress: async (newName) => {
            if (!newName || newName === oldName) return;
            try {
              await travelApi.updateRouteName(id, newName);
              setHistory(history.map(item => item.id === id ? { ...item, route_name: newName } : item));
            } catch (e) { Alert.alert("Помилка", "Не вдалося оновити назву"); }
          } 
        }
      ],
      "plain-text",
      oldName
    );
  };

  const handleDelete = async (id) => {
    Alert.alert("Видалення", "Видалити цей маршрут назавжди?", [
      { text: "Ні", style: "cancel" },
      { 
        text: "Так", style: "destructive", 
        onPress: async () => {
          try {
            await travelApi.deleteRoute(id);
            setHistory(history.filter(item => item.id !== id));
          } catch (e) { Alert.alert("Помилка", "Не вдалося видалити"); }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => {
          // ВАЖЛИВО: Правильна вкладена навігація
          navigation.navigate('MapTab', { 
            screen: 'Map', 
            params: { savedRoute: item.route_data } 
          });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleBox}>
            <Text style={styles.routeName} numberOfLines={1}>{item.route_name}</Text>
            <TouchableOpacity onPress={() => handleRename(item.id, item.route_name)} style={styles.editBtn}>
              <Ionicons name="pencil" size={14} color="#2196F3" />
            </TouchableOpacity>
          </View>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        
        <Text style={styles.summary} numberOfLines={2}>{item.points_summary}</Text>

        <View style={styles.footer}>
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={14} color="#2196F3" />
            <Text style={styles.badgeText}>{item.total_duration} хв</Text>
          </View>
          <Text style={styles.tapText}>Відкрити мапу ➔</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {loading && history.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#2196F3" size="large" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchHistory} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trail-sign-outline" size={80} color="#DDD" />
              <Text style={styles.emptyText}>Тут будуть ваші прогулянки</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  card: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, flexDirection: 'row', elevation: 3, shadowOpacity: 0.1, shadowRadius: 5 },
  cardContent: { flex: 1, padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  titleBox: { flexDirection: 'row', alignItems: 'center', flex: 0.8 },
  editBtn: { marginLeft: 10, padding: 5 },
  routeName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 11, color: '#AAA' },
  summary: { fontSize: 13, color: '#666', marginBottom: 15 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, color: '#2196F3', marginLeft: 4, fontWeight: 'bold' },
  tapText: { fontSize: 11, color: '#2196F3', fontWeight: '600' },
  deleteBtn: { padding: 20, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F5F5F5' },
  empty: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 15, color: '#BBB', fontSize: 16 }
});