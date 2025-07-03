import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'http://192.168.1.202:5000';
const socket = io(API_URL);

export default function ChatWithTherapist() {
  const { therapistId } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [therapist, setTherapist] = useState(null);
  const flatListRef = useRef(null);
  const router = useRouter();
  const roomId = user && therapistId ? [user._id, therapistId].sort().join('_') : '';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!roomId) return;
    socket.emit('joinRoom', { roomId });
    fetch(`${API_URL}/chat/${roomId}`)
      .then(res => res.json())
      .then(data => setMessages(data));
    socket.on('chatMessage', (msg) => {
      if (msg.roomId === roomId) setMessages(prev => [...prev, msg]);
    });
    return () => {
      socket.off('chatMessage');
      socket.emit('leaveRoom', { roomId });
    };
  }, [roomId]);

  useEffect(() => {
    if (therapistId) {
      fetch(`${API_URL}/user/${therapistId}`)
        .then(res => res.json())
        .then(data => setTherapist(data));
    }
  }, [therapistId]);

  // Fade in new messages
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  }, [messages]);

  // Scroll on new message
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = {
      roomId,
      sender: user._id,
      receiver: therapistId,
      message: input,
      timestamp: new Date().toISOString(),
    };
    socket.emit('chatMessage', msg);
    setInput('');
    fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
  };

  const renderMessage = ({ item }) => (
    <Animated.View 
      style={[
        styles.messageRow, 
        item.sender === user._id ? styles.myRow : styles.theirRow,
        { opacity: fadeAnim }
      ]}
    >
      <View style={[styles.bubble, item.sender === user._id ? styles.myBubble : styles.theirBubble]}>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.timeText}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#ece5dd", "#f2fff6"]} style={styles.gradient}>
        {/* Header */}
        <LinearGradient colors={["#1B4332", "#4BBE8A"]} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {therapist && (
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{therapist.username}</Text>
              <Text style={styles.headerSubtitle}>Therapist</Text>
            </View>
          )}
          <TouchableOpacity style={styles.avatarWrap}>
            <Ionicons name="person-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        
        <KeyboardAvoidingView 
          style={styles.keyboardContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Input Bar */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor="#888"
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity 
                onPress={sendMessage}
                style={[
                  styles.sendButton,
                  !input.trim() && { opacity: 0.5 }
                ]}
                disabled={!input.trim()}
              >
                <Ionicons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ece5dd" },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  backBtn: { 
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 8,
  },
  headerCenter: { 
    flex: 1, 
    alignItems: "center" 
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#e0ffe7",
    marginTop: 2,
    fontWeight: "500",
  },
  avatarWrap: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 2,
  },
  keyboardContainer: {
    flex: 1,
  },
  messageRow: { 
    flexDirection: 'row', 
    marginBottom: 12 
  },
  myRow: { 
    justifyContent: 'flex-end' 
  },
  theirRow: { 
    justifyContent: 'flex-start' 
  },
  bubble: {
    maxWidth: '75%',
    marginVertical: 4,
    padding: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 0,
  },
  theirBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 0,
  },
  messageText: { 
    fontSize: 16, 
    color: '#303030' 
  },
  timeText: { 
    fontSize: 10, 
    color: '#555', 
    textAlign: 'right', 
    marginTop: 4 
  },
  inputWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
  },
  textInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#303030', 
    paddingVertical: 4 
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#075E54',
    padding: 10,
    borderRadius: 25,
  },
}); 