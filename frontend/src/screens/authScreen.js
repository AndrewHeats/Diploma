import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { Ionicons } from '@expo/vector-icons';
import { travelApi } from '../api/routeService';
import { AppContext } from '../store/appContext';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const { setUser } = useContext(AppContext);

  const handleAuth = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert("Помилка", "Введіть валідний email та пароль (мін. 6 симв.)");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await travelApi.loginUser({ email, password });
      } else {
        data = await travelApi.registerUser({ email, password });
      }
      setUser(data);
    } catch (e) {
      const errorMsg = isLogin 
        ? "Невірний email або пароль" 
        : "Користувач вже існує або помилка сервера";
      Alert.alert("Помилка", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#2196F3', '#00BCD4']} 
      style={styles.background}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            
            <View style={styles.logoContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="airplane" size={40} color="#2196F3" />
              </View>
              <Text style={styles.logoText}>TravelLviv AI</Text>
            </View>

            <View style={styles.authCard}>
              <Text style={styles.title}>{isLogin ? 'З поверненням!' : 'Створити акаунт'}</Text>
              
              {/* Поле Email */}
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Email" 
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none" 
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Поле Пароля */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  placeholder="Пароль" 
                  secureTextEntry={!showPassword} 
                  value={password} 
                  onChangeText={setPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#2196F3" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.btn, loading && styles.btnDisabled]} 
                onPress={handleAuth} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>
                    {isLogin ? 'Увійти' : 'Почати подорож'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.switchBtn} 
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchText}>
                {isLogin 
                  ? "Ще не з нами? Зареєструватися" 
                  : "Вже є акаунт? Увійти"}
              </Text>
            </TouchableOpacity>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 25 },
  
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#fff', justifyContent: 'center', 
    alignItems: 'center', elevation: 10, shadowOpacity: 0.2
  },
  logoText: { 
    fontSize: 32, fontWeight: 'bold', color: '#fff', 
    marginTop: 15, letterSpacing: 1 
  },

  authCard: { 
    backgroundColor: '#fff', borderRadius: 25, 
    padding: 25, elevation: 15, shadowColor: '#000',
    shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }
  },
  title: { 
    fontSize: 22, fontWeight: 'bold', color: '#333', 
    textAlign: 'center', marginBottom: 25 
  },

  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F5F7FA', borderRadius: 12,
    paddingHorizontal: 15, marginBottom: 15, height: 55,
    borderWidth: 1, borderColor: '#EDF1F7'
  },
  inputIcon: { marginRight: 12 },
  // ... у розділі styles знайти:
  input: { 
    flex: 1,           // ДОДАЙ ЦЕЙ РЯДОК - він розтягне поле на всю ширину
    fontSize: 16, 
    color: '#333', 
    height: '100%',
    paddingLeft: 5,    // невеликий відступ від іконки
  },

  btn: { 
    backgroundColor: '#2196F3', padding: 16, 
    borderRadius: 12, alignItems: 'center', 
    marginTop: 10, shadowColor: '#2196F3',
    shadowOpacity: 0.4, shadowRadius: 5, elevation: 5
  },
  btnDisabled: { backgroundColor: '#A0D1F9' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  switchBtn: { marginTop: 30, alignItems: 'center' },
  switchText: { color: '#fff', fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' }
});