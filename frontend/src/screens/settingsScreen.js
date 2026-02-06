import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';

export default function SettingsScreen({ navigation }) {
  const { currentCity, changeCity, cityConfigs, durationType, setDurationType } = useContext(AppContext);

  const durations = [
    { id: 'short', label: 'Коротка', time: 'до 1 год', icon: 'walk' },
    { id: 'medium', label: 'Середня', time: '1-3 год', icon: 'footsteps' },
    { id: 'long', label: 'Довга', time: '3+ год', icon: 'map' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.mainTitle}>Налаштування подорожі</Text>

        {/* ВИБІР МІСТА */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Виберіть місто</Text>
          <View style={styles.grid}>
            {Object.keys(cityConfigs).map(key => (
              <TouchableOpacity 
                key={key} 
                onPress={() => changeCity(key)}
                style={[styles.cityCard, currentCity === key && styles.activeCard]}
              >
                <Ionicons name="location" size={20} color={currentCity === key ? '#fff' : '#2196F3'} />
                <Text style={[styles.cityLabel, currentCity === key && styles.textWhite]}>
                  {cityConfigs[key].name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ТРИВАЛІСТЬ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тривалість прогулянки</Text>
          {durations.map(d => (
            <TouchableOpacity 
              key={d.id} 
              onPress={() => setDurationType(d.id)}
              style={[styles.durationRow, durationType === d.id && styles.activeDuration]}
            >
              <View style={styles.rowLeft}>
                <Ionicons name={d.icon} size={24} color={durationType === d.id ? '#fff' : '#555'} />
                <View style={styles.textGroup}>
                  <Text style={[styles.durationLabel, durationType === d.id && styles.textWhite]}>{d.label}</Text>
                  <Text style={[styles.durationTime, durationType === d.id && styles.textWhite]}>{d.time}</Text>
                </View>
              </View>
              {durationType === d.id && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.navigate('MapTab')}>
          <Text style={styles.saveBtnText}>Перейти до мапи</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: 20 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 25 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#555', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cityCard: { 
    width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 15, 
    marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 
  },
  activeCard: { backgroundColor: '#2196F3' },
  cityLabel: { marginLeft: 10, fontWeight: '600', color: '#333' },
  durationRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 10, elevation: 2
  },
  activeDuration: { backgroundColor: '#4CAF50' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  textGroup: { marginLeft: 15 },
  durationLabel: { fontSize: 16, fontWeight: 'bold' },
  durationTime: { fontSize: 12, color: '#888' },
  textWhite: { color: '#fff' },
  saveBtn: { 
    backgroundColor: '#2196F3', padding: 18, borderRadius: 15, 
    alignItems: 'center', marginTop: 10, elevation: 4 
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});