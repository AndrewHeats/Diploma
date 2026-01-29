import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PlaceInfoCard = ({ place }) => (
  <View style={styles.card}>
    <Text style={styles.title}>{place.name}</Text>
    <Text style={styles.category}>{place.category?.toUpperCase()}</Text>
    <Text style={styles.rating}>⭐ {place.rating?.toFixed(1)}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 12, borderRadius: 10, width: 200, elevation: 5 },
  title: { fontWeight: 'bold', fontSize: 14 },
  category: { color: '#2196F3', fontSize: 10, fontWeight: 'bold', marginVertical: 2 },
  rating: { fontSize: 12, color: '#444' }
});