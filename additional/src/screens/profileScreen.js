import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function ProfileScreen({ navigation }) {
  const { user, setUser, preferences, setPreferences } = useContext(AppContext);
  const [stats, setStats] = useState({ count: 0, totalTime: 0 });

  // КАТЕГОРІЇ ТОЧНО ЗА ТВОЇМ СКРИПТОМ
  const categories = [
    { id: 'culture', label: 'Культура', icon: 'library-outline' }, // Музеї, пам'ятки
    { id: 'food', label: 'Їжа та Бари', icon: 'restaurant-outline' }, // Кафе, ресторани, паби
    { id: 'nature', label: 'Природа', icon: 'leaf-outline' }, // Парки
    { id: 'other', label: 'Інше', icon: 'ellipsis-horizontal-outline' }, // Все інше
  ];

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.id) {
        try {
          const data = await travelApi.getHistory(user.id);
          const time = data.reduce((acc, item) => acc + (item.total_duration || 0), 0);
          setStats({ count: data.length, totalTime: time });
        } catch (e) {
          console.error("Помилка завантаження статистики");
        }
      }
    };
    fetchStats();
  }, [user]);

  const togglePreference = (id) => {
    setPreferences({
      ...preferences,
      [id]: !preferences[id]
    });
  };

  const handleLogout = () => {
    Alert.alert("Вихід", "Ви впевнені, що хочете вийти?", [
      { text: "Скасувати", style: "cancel" },
      { text: "Вийти", style: "destructive", onPress: () => setUser(null) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Хедер із аватаром та поштою */}
        <View style={styles.header}>
          <Ionicons name="person-circle" size={90} color="#2196F3" />
          <Text style={styles.email}>{user?.email || 'Мій Профіль'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.count}</Text>
              <Text style={styles.statLabel}>Маршрути</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.totalTime}</Text>
              <Text style={styles.statLabel}>Хв у дорозі</Text>
            </View>
          </View>
        </View>

        {/* СИНХРОНІЗОВАНІ ВПОДОБАННЯ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Мої інтереси у Львові</Text>
          <View style={styles.tagsContainer}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => togglePreference(cat.id)}
                style={[
                  styles.tag, 
                  preferences[cat.id] && styles.tagActive
                ]}
              >
                <Ionicons 
                  name={cat.icon} 
                  size={18} 
                  color={preferences[cat.id] ? '#fff' : '#2196F3'} 
                />
                <Text style={[
                  styles.tagText, 
                  preferences[cat.id] && styles.tagTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Основне меню */}
        <View style={styles.menu}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('Історія')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="time-outline" size={22} color="#555" />
              <Text style={styles.menuText}>Історія подорожей</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomWidth: 0 }]} 
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={22} color="#FF5252" />
              <Text style={[styles.menuText, { color: '#FF5252' }]}>Вийти з акаунта</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { paddingBottom: 30 },
  header: { backgroundColor: '#fff', alignItems: 'center', padding: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 3 },
  email: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  statsRow: { flexDirection: 'row', marginTop: 20, width: '100%', justifyContent: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statDivider: { width: 1, height: '80%', backgroundColor: '#eee' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#2196F3' },
  statLabel: { fontSize: 12, color: '#999' },
  
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderRadius: 25, 
    marginRight: 10, 
    marginBottom: 12, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e3f2fd'
  },
  tagActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  tagText: { marginLeft: 10, color: '#2196F3', fontWeight: '600' },
  tagTextActive: { color: '#fff' },

  menu: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, elevation: 2, paddingVertical: 5 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { marginLeft: 15, fontSize: 15, color: '#444' }
});