import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Animated, Easing, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import AppointmentMessage from '../../components/AppointmentMessage';
import AppointmentApprovalModal from '../../components/AppointmentApprovalModal';
import AppointmentRequestButton from '../../components/AppointmentRequestButton';

const API_URL = 'https://therapy-0gme.onrender.com';
const socket = io(API_URL);

export default function ChatWithTherapist() {
  const { therapistId } = useLocalSearchParams();
  const { user, token } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [input, setInput] = useState('');
  const [therapist, setTherapist] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const roomId = user && therapistId ? [user._id, therapistId].sort().join('_') : '';
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    socket.emit('joinRoom', { roomId });
    fetchMessages();
    fetchAppointments();
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
      fetchTherapist();
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
  }, [messages, appointments]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/${roomId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_URL}/appointment/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Appointments API error:', response.status, response.statusText);
        setAppointments([]);
        return;
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Appointments API returned non-array data:', data);
        setAppointments([]);
        return;
      }
      
      // Filter appointments for this specific therapist
      const filteredAppointments = data.filter(app => 
        (app.therapist._id === therapistId || app.client._id === therapistId)
      );
      setAppointments(filteredAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    }
  };

  const fetchTherapist = async () => {
    try {
      const response = await fetch(`${API_URL}/user/${therapistId}`);
      const data = await response.json();
      setTherapist(data);
    } catch (error) {
      console.error('Error fetching therapist:', error);
    }
  };

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

  const requestAppointment = () => {
    router.push(`/request-appointment?therapistId=${therapistId}`);
  };

  const handleApproveAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleDeclineAppointment = (appointment) => {
    Alert.alert(
      'Decline Appointment',
      'Are you sure you want to decline this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/appointment/${appointment._id}/decline`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ notes: '' }),
              });

              if (!response.ok) {
                throw new Error('Failed to decline appointment');
              }

              Alert.alert('Success', 'Appointment declined successfully');
              fetchAppointments();
            } catch (error) {
              console.error('Error declining appointment:', error);
              Alert.alert('Error', 'Failed to decline appointment');
            }
          },
        },
      ]
    );
  };

  const handleAppointmentUpdated = (updatedAppointment) => {
    setAppointments(prev => 
      prev.map(app => 
        app._id === updatedAppointment._id ? updatedAppointment : app
      )
    );
  };

  const handleMenuRequestAppointment = () => {
    setShowMenu(false);
    requestAppointment();
  };

  const renderMessage = ({ item }) => {
    if (item.type === 'appointment') {
      const appointment = appointments.find(app => app._id === item.appointmentId);
      if (!appointment) return null;
      
      const isOwnMessage = appointment.client._id === user._id;
      const isTherapist = user?.role === 'therapist';
      
      return (
        <AppointmentMessage
          appointment={appointment}
          isTherapist={isTherapist}
          onApprove={handleApproveAppointment}
          onDecline={handleDeclineAppointment}
          isOwnMessage={isOwnMessage}
        />
      );
    }

    return (
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
  };

  // Combine messages and appointments for display
  const combinedMessages = [
    ...messages.map(msg => ({ ...msg, type: 'message' })),
    ...appointments.map(app => ({ 
      type: 'appointment', 
      appointmentId: app._id, 
      timestamp: app.createdDate 
    }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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
          {/* Three dots menu */}
          <TouchableOpacity style={styles.menuBtn} onPress={() => setShowMenu(true)}>
            <Ionicons name="ellipsis-vertical" size={28} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        {/* Menu Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={handleMenuRequestAppointment}>
                <Text style={styles.menuItemText}>Request Appointment</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        
        <KeyboardAvoidingView 
          style={styles.keyboardContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={combinedMessages}
            keyExtractor={(item, index) => item.type === 'appointment' ? item.appointmentId : index.toString()}
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

        {/* Appointment Approval Modal */}
        <AppointmentApprovalModal
          visible={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          user={user}
          token={token}
          onAppointmentUpdated={handleAppointmentUpdated}
        />
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
    marginBottom: 8,
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
  menuBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: 60,
    marginRight: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuItemText: {
    fontSize: 16,
    color: '#222',
  },
}); 