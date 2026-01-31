import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { travelApi } from '../api/routeService';
import { AppContext } from '../store/appContext';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Перемикач: true - вхід, false - реєстрація
  
  const { setUser } = useContext(AppContext);

  const handleAuth = async () => {
    // Валідація
    if (!email.includes('@') || password.length < 6) {
      Alert.alert("Помилка", "Введіть валідний email та пароль (мін. 6 симв.)");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        // Логіка ВХОДУ
        data = await travelApi.loginUser({ email, password });
      } else {
        // Логіка РЕЄСТРАЦІЇ
        data = await travelApi.registerUser({ email, password });
      }
      
      setUser(data);
    } catch (e) {
      console.error(e);
      const errorMsg = isLogin 
        ? "Невірний email або пароль" 
        : "Користувач вже існує або помилка сервера";
      Alert.alert("Помилка", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>TravelAI</Text>
      
      <Text style={styles.title}>{isLogin ? 'Вхід' : 'Реєстрація'}</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Пароль" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword} 
      />

      <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{isLogin ? 'Увійти' : 'Створити акаунт'}</Text>
        )}
      </TouchableOpacity>

      {/* Кнопка перемикання режимів */}
      <TouchableOpacity 
        style={styles.switchBtn} 
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.switchText}>
          {isLogin 
            ? "Немає акаунта? Зареєструватися" 
            : "Вже є акаунт? Увійти"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  logo: { fontSize: 42, fontWeight: 'bold', color: '#2196F3', textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 20, color: '#555', textAlign: 'center', marginBottom: 30, fontWeight: '500' },
  input: { borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 10, marginBottom: 20, fontSize: 16 },
  btn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 2 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchBtn: { marginTop: 25, alignItems: 'center' },
  switchText: { color: '#2196F3', fontSize: 14, fontWeight: '600' }
});