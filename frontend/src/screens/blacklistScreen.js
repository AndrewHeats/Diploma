import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function BlacklistScreen({ navigation }) {
  const { user } = useContext(AppContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    try {
      const data = await travelApi.getBlacklist(user.id);
      setList(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRemove = async (placeId) => {
    try {
      await travelApi.removeFromBlacklist(user.id, placeId);
      setList(list.filter(item => item.id !== placeId));
    } catch (e) { Alert.alert("Помилка", "Не вдалося видалити"); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Мій Чорний Список</Text>
      </View>

      {loading ? <ActivityIndicator size="large" color="#2196F3" style={{marginTop: 50}} /> : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{flex: 1}}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.cat}>{item.category}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.unlockBtn}>
                <Ionicons name="lock-open-outline" size={20} color="#2196F3" />
                <Text style={styles.unlockText}>Розблокувати</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>У вас немає заблокованих закладів</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cat: { fontSize: 12, color: '#888', marginTop: 2 },
  unlockBtn: { alignItems: 'center', paddingLeft: 10 },
  unlockText: { fontSize: 10, color: '#2196F3', fontWeight: 'bold', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 10 }
});