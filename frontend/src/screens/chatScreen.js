import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../store/appContext';
import { travelApi } from '../api/routeService';

export default function ChatScreen({ navigation }) {
  const { user, currentCity } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef(null);

  // Оновлення чату при зміні міста або кожні 5 сек
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); 
    return () => clearInterval(interval);
  }, [currentCity]);

  const fetchMessages = async () => {
    if (!user?.id) return;
    try {
      const data = await travelApi.getChatMessages(currentCity);
      setMessages(data);
      if (loading) setLoading(false);
    } catch (e) {
      console.log("Chat fetch error:", e);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await travelApi.sendMessage(user.id, currentCity, text);
      setText('');
      await fetchMessages();
      // Прокрутка до низу
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isMe = item.user_email === user?.email; 
    const username = item.user_email.split('@')[0];

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{username[0].toUpperCase()}</Text>
          </View>
        )}
        
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!isMe && <Text style={styles.username}>{username}</Text>}
          <Text style={[styles.msgText, isMe ? styles.textMe : styles.textOther]}>{item.content}</Text>
          <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Форум: {currentCity}</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.dot} />
          <Text style={styles.onlineText}>Live</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{marginTop: 50}} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Написати у чат ${currentCity}...`}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity onPress={handleSend} disabled={sending} style={styles.sendBtn}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', elevation: 3 
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 5 },
  onlineText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText: { fontWeight: 'bold', color: '#555' },

  bubble: { maxWidth: '75%', padding: 12, borderRadius: 18 },
  bubbleMe: { backgroundColor: '#2196F3', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1 },

  username: { fontSize: 11, color: '#F57C00', fontWeight: 'bold', marginBottom: 4 },
  msgText: { fontSize: 15 },
  textMe: { color: '#fff' },
  textOther: { color: '#333' },

  time: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  timeOther: { color: '#999' },

  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, fontSize: 16 },
  sendBtn: { backgroundColor: '#2196F3', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 2 }
});