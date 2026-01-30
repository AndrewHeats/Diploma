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
  // Додаємо cuisinePreferences з контексту
  const { 
    user, 
    setUser, 
    preferences, 
    setPreferences, 
    cuisinePreferences, 
    setCuisinePreferences 
  } = useContext(AppContext);

  const [stats, setStats] = useState({ count: 0, totalTime: 0 });

  // Основні категорії за твоїм скриптом seed_db.py
  const categories = [
    { id: 'culture', label: 'Культура', icon: 'library-outline', subtext: 'Музеї, храми, театри' },
    { id: 'food', label: 'Харчування', icon: 'restaurant-outline', subtext: 'Сніданки, обіди, вечері' },
    { id: 'nature', label: 'Природа', icon: 'leaf-outline', subtext: 'Парки та площі' },
    { id: 'other', label: 'Інше', icon: 'ellipsis-horizontal-outline', subtext: 'Цікавинки Львова' },
  ];

  // СПИСОК КУХОНЬ ДЛЯ НОВОГО АЛГОРИТМУ
  const cuisineTypes = [
    { id: 'ukrainian', label: 'Українська' },
    { id: 'italian', label: 'Італійська' },
    { id: 'jewish', label: 'Єврейська' },
    { id: 'regional', label: 'Галицька' },
    { id: 'coffee_shop', label: 'Кав’ярні' },
    { id: 'burger', label: 'Бургери' },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.id) {
        try {
          const data = await travelApi.getHistory(user.id);
          const time = data.reduce((acc, item) => acc + (item.total_duration || 0), 0);
          setStats({ count: data.length, totalTime: time });
        } catch (e) { console.error("Статистика недоступна"); }
      }
    };
    fetchStats();
  }, [user]);

  const togglePreference = (id) => {
    setPreferences({ ...preferences, [id]: !preferences[id] });
  };

  // НОВА ФУНКЦІЯ: Перемикання кухонь
  const toggleCuisine = (id) => {
    setCuisinePreferences({
      ...cuisinePreferences,
      [id]: !cuisinePreferences[id]
    });
  };

  const handleLogout = () => {
    Alert.alert("Вихід", "Бажаєте вийти з акаунта?", [
      { text: "Скасувати", style: "cancel" },
      { text: "Вийти", style: "destructive", onPress: () => setUser(null) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Хедер із статистикою */}
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

        {/* СЕКЦІЯ 1: ОСНОВНІ ІНТЕРЕСИ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тип маршруту</Text>
          <View style={styles.listContainer}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => togglePreference(cat.id)}
                style={[styles.prefCard, preferences[cat.id] && styles.prefCardActive]}
              >
                <View style={styles.prefIconBox}>
                  <Ionicons name={cat.icon} size={24} color={preferences[cat.id] ? '#fff' : '#2196F3'} />
                </View>
                <View style={styles.prefTextBox}>
                  <Text style={[styles.prefLabel, preferences[cat.id] && styles.textWhite]}>{cat.label}</Text>
                  <Text style={[styles.prefSubtext, preferences[cat.id] && styles.textLightBlue]}>{cat.subtext}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* СЕКЦІЯ 2: УЛЮБЛЕНА КУХНЯ (Нове!) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Улюблена кухня</Text>
          <View style={styles.cuisineContainer}>
            {cuisineTypes.map((c) => (
              <TouchableOpacity 
                key={c.id} 
                onPress={() => toggleCuisine(c.id)}
                style={[styles.cuisineTag, cuisinePreferences[c.id] && styles.cuisineTagActive]}
              >
                <Text style={[styles.cuisineText, cuisinePreferences[c.id] && styles.textWhite]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* МЕНЮ */}
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Історія')}>
            <View style={styles.menuLeft}>
              <Ionicons name="time-outline" size={22} color="#555" />
              <Text style={styles.menuText}>Історія подорожей</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
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
  
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  listContainer: { width: '100%' },
  prefCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  prefCardActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  prefIconBox: { width: 40, alignItems: 'center' },
  prefTextBox: { flex: 1, marginLeft: 15 },
  prefLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  prefSubtext: { fontSize: 11, color: '#777', marginTop: 2 },
  textWhite: { color: '#fff' },
  textLightBlue: { color: '#e3f2fd' },

  // Стилі для кухонь
  cuisineContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  cuisineTag: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8, elevation: 1, borderWidth: 1, borderColor: '#eee' },
  cuisineTagActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  cuisineText: { fontSize: 13, color: '#555' },

  menu: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, borderRadius: 20, elevation: 2 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { marginLeft: 15, fontSize: 15, color: '#444' }
});