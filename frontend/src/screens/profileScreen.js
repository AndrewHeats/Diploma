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
  const { 
    user, 
    setUser, 
    preferences, 
    setPreferences, 
    cuisinePreferences, 
    setCuisinePreferences 
  } = useContext(AppContext);

  const [stats, setStats] = useState({ count: 0, totalTime: 0 });

  // Категорії (зробив опис універсальним для всієї України)
  const categories = [
    { id: 'culture', label: 'Культура', icon: 'library-outline', subtext: 'Музеї, храми, театри' },
    { id: 'food', label: 'Харчування', icon: 'restaurant-outline', subtext: 'Сніданки, обіди, вечері' },
    { id: 'nature', label: 'Природа', icon: 'leaf-outline', subtext: 'Парки та площі' },
    { id: 'other', label: 'Інше', icon: 'ellipsis-horizontal-outline', subtext: 'Цікаві локації міста' },
  ];

  const cuisineTypes = [
    { id: 'ukrainian', label: 'Українська' },
    { id: 'italian', label: 'Італійська' },
    { id: 'asian', label: 'Азійська' },
    { id: 'georgian', label: 'Грузинська' },
    { id: 'greek', label: 'Грецька' },
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

  const toggleCuisine = (id) => {
    setCuisinePreferences({ ...cuisinePreferences, [id]: !cuisinePreferences[id] });
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
        
        {/* 1. Хедер із статистикою */}
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

        {/* 2. ГОЛОВНЕ МЕНЮ (НАЛАШТУВАННЯ МІСТА) */}
        <View style={styles.menu}>
          <TouchableOpacity 
            style={styles.menuItemMain} 
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.menuTextBold}>Налаштування подорожі</Text>
                <Text style={styles.menuSubtext}>Змінити місто та час прогулянки</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {/* 3. СЕКЦІЯ: ТИП МАРШРУТУ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Які місця шукати?</Text>
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
                {preferences[cat.id] && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. СЕКЦІЯ: УЛЮБЛЕНА КУХНЯ */}
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

        {/* 5. ДОДАТКОВЕ МЕНЮ */}
        <View style={styles.menuFooter}>
          <TouchableOpacity style={styles.footerItem} onPress={() => navigation.navigate('Blacklist')}>
            <Ionicons name="ban-outline" size={20} color="#555" />
            <Text style={styles.footerText}>Чорний список</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.footerItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF5252" />
            <Text style={[styles.footerText, { color: '#FF5252' }]}>Вийти</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { paddingBottom: 40 },
  header: { 
    backgroundColor: '#fff', alignItems: 'center', padding: 25, 
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  email: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, color: '#333' },
  statsRow: { flexDirection: 'row', marginTop: 15, width: '100%', justifyContent: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: 25 },
  statDivider: { width: 1, height: '80%', backgroundColor: '#eee' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#2196F3' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  
  menu: { paddingHorizontal: 20, marginTop: 25 },
  menuItemMain: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 3
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTextBold: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  menuSubtext: { fontSize: 12, color: '#777', marginTop: 2 },

  section: { paddingHorizontal: 20, paddingTop: 25 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  prefCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    padding: 15, borderRadius: 18, marginBottom: 12, elevation: 2, 
    borderWidth: 1, borderColor: '#f0f0f0' 
  },
  prefCardActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  prefIconBox: { width: 40, alignItems: 'center' },
  prefTextBox: { flex: 1, marginLeft: 10 },
  prefLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  prefSubtext: { fontSize: 11, color: '#777', marginTop: 2 },
  textWhite: { color: '#fff' },
  textLightBlue: { color: '#e3f2fd' },

  cuisineContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  cuisineTag: { 
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, 
    borderRadius: 25, marginRight: 10, marginBottom: 10, elevation: 1, 
    borderWidth: 1, borderColor: '#eee' 
  },
  cuisineTagActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  cuisineText: { fontSize: 13, color: '#555', fontWeight: '500' },

  menuFooter: { 
    flexDirection: 'row', justifyContent: 'space-around', 
    marginTop: 30, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  footerText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#555' }
});