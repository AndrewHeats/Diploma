import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function RecommendationsScreen({ route, navigation }) {
  const { user } = useContext(AppContext);
  
  // Безпечно отримуємо cityName, якщо параметри раптом не передалися
  const { cityName = "Місто" } = route.params || {}; 
  
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // ЗАХИСТ: Якщо користувач вийшов (user == null), зупиняємо виконання, щоб уникнути помилки
      if (!user?.id) return;

      try {
        const data = await travelApi.getRecommendations(user.id, cityName);
        setList(data);
      } catch (e) {
        console.error("Помилка завантаження рекомендацій:", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [cityName, user?.id]); // Додали user?.id у залежності

  const renderItem = ({ item }) => {
    // Безпечний парсинг міста з опису за допомогою .trim() замість .strip()
    const cityPart = item.description?.split('|').find(p => p.includes('Місто:'));
    const displayCity = cityPart ? cityPart.replace('Місто:', '').trim() : cityName;

    return (
      <View style={styles.card}>
        <View style={{flex: 1}}>
          <View style={styles.cityBadge}>
            <Text style={styles.cityText}>{displayCity}</Text>
          </View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.cat}>{item.category?.toUpperCase()}</Text>
        </View>
        
        {/* Кнопка швидкого перегляду на мапі */}
        <TouchableOpacity 
          style={styles.goBtn} 
          onPress={() => navigation.navigate('Map', { 
            savedRoute: { points: [item], geometry: null } 
          })}
        >
          <Ionicons name="map" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <Ionicons name="arrow-back" size={24} color="#4A148C" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>AI: Поради для вас</Text>
          <Text style={styles.subTitle}>Локації у місті {cityName}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#9C27B0" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bulb-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                Лайкніть кілька місць у своїх маршрутах, щоб ШІ міг підібрати персональні поради для цього міста!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF7FF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 3 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#4A148C' },
  subTitle: { fontSize: 12, color: '#9C27B0', fontWeight: '600' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 25, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  cityBadge: { backgroundColor: '#E1BEE7', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  cityText: { fontSize: 10, fontWeight: 'bold', color: '#7B1FA2', textTransform: 'uppercase' },
  name: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  cat: { fontSize: 12, color: '#9C27B0', marginTop: 4, fontWeight: '500' },
  goBtn: { backgroundColor: '#9C27B0', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 15, lineHeight: 20 }
});