import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { travelApi } from '../api/routeService';
import { AppContext } from '../store/appContext';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AppContext);

  const handleAuth = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert("Помилка", "Введіть валідний email та пароль (мін. 6 симв.)");
      return;
    }
    setLoading(true);
    try {
      const data = await travelApi.registerUser({ email, password });
      setUser(data);
    } catch (e) {
      Alert.alert("Помилка", "Користувач вже існує або сервер недоступний");
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>TravelAI</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Пароль" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.btn} onPress={handleAuth}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Увійти / Реєстрація</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#2196F3', textAlign: 'center', marginBottom: 40 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 10, marginBottom: 20 },
  btn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});