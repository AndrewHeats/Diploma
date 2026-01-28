import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl, 
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function HistoryScreen({ navigation }) {
  const { user } = useContext(AppContext);
  const isFocused = useIsFocused();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Стан для модального вікна редагування
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await travelApi.getHistory(user.id);
      setHistory(data);
    } catch (e) {
      console.error("Помилка історії:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isFocused) loadHistory();
  }, [isFocused, loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  // Відкриття вікна редагування
  const openEditModal = (id, currentName) => {
    setSelectedRouteId(id);
    setEditName(currentName);
    setModalVisible(true);
  };

  // Збереження нової назви
  const handleSaveName = async () => {
    if (!editName.trim()) {
      Alert.alert("Помилка", "Назва не може бути порожньою");
      return;
    }
    try {
      await travelApi.updateRouteName(selectedRouteId, editName);
      setHistory(prev => prev.map(item => 
        item.id === selectedRouteId ? { ...item, route_name: editName } : item
      ));
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося оновити назву.");
    }
  };

  const confirmDelete = (id) => {
    Alert.alert("Видалення", "Видалити цей маршрут?", [
      { text: "Скасувати", style: "cancel" },
      { text: "Видалити", style: "destructive", onPress: () => travelApi.deleteRoute(id).then(loadHistory) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Історія подорожей</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={() => <Text style={styles.empty}>У вас ще немає поїздок</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('Мапа', { 
              screen: 'MapMain', 
              params: { savedRoute: item.route_data } 
            })}
          >
            <View style={styles.cardTop}>
              <Text style={styles.routeName}>{item.route_name}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openEditModal(item.id, item.route_name)} style={styles.iconBtn}>
                  <Ionicons name="pencil-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.summary} numberOfLines={2}>{item.points_summary}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
      />

      {/* УНІВЕРСАЛЬНА МОДАЛКА ДЛЯ РЕДАГУВАННЯ */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Змінити назву</Text>
            <TextInput 
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Введіть назву..."
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.mBtn, styles.cancelBtn]}>
                <Text style={styles.cancelText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveName} style={[styles.mBtn, styles.saveBtn]}>
                <Text style={styles.saveText}>Зберегти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeName: { fontSize: 17, fontWeight: 'bold', flex: 1 },
  actionRow: { flexDirection: 'row' },
  iconBtn: { marginLeft: 15 },
  summary: { color: '#666', marginVertical: 8, fontSize: 13 },
  date: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  
  // Стилі для модалки
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  mBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { marginRight: 10, backgroundColor: '#f0f0f0' },
  saveBtn: { backgroundColor: '#2196F3' },
  cancelText: { color: '#666', fontWeight: 'bold' },
  saveText: { color: '#fff', fontWeight: 'bold' }
});