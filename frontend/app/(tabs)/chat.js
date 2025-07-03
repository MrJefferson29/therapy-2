import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Modal,
  Text,
  Dimensions,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import moment from "moment";

const API_BASE_URL = "http://192.168.1.202:5000";
const CHAT_HISTORY_KEY = "ai_chat_history";
const SESSION_ID_KEY = "ai_session_id";
const TOKEN_KEY = "token";
const { width } = Dimensions.get("window");
const moodEmojis = ["😢", "😞", "😕", "😐", "🙂", "😊", "😃", "😁", "🤩", "😍"];

export default function Chat() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [token, setToken] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [mood, setMood] = useState(5);
  const [isResetting, setIsResetting] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTypingEffect, setIsTypingEffect] = useState(false);
  const [inputBarHeight, setInputBarHeight] = useState(0);
  
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animated bottom offset for input bar
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // load data
    (async () => {
      try {
        const savedMessages = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        const savedSession = await AsyncStorage.getItem(SESSION_ID_KEY);
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (savedMessages) setMessages(JSON.parse(savedMessages));
        if (savedSession) setSessionId(savedSession);
        else setShowMoodModal(true);
        if (savedToken) setToken(savedToken);
      } catch (e) {
        console.error(e);
      }
    })();

    // keyboard listeners
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvt, (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    });
    const subHide = Keyboard.addListener(hideEvt, () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
      // scroll to bottom when keyboard hides
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // fade in new messages
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  }, [messages]);

  // scroll on new message
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // typewriter effect
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.sender === "bot" && last.text && !last.isError) {
      setIsTypingEffect(true);
      let i = 0;
      setTypingText("");
      const iv = setInterval(() => {
        i++;
        setTypingText(last.text.slice(0, i));
        if (i >= last.text.length) {
          clearInterval(iv);
          setIsTypingEffect(false);
        }
      }, 18);
      return () => clearInterval(iv);
    } else setTypingText("");
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !token) return;
    const userMsg = {
      text: inputMessage,
      sender: "user",
      time: new Date().toISOString(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputMessage("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/session-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: userMsg.text, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI error");
      setMessages((prev) => [
        ...prev,
        { text: data.text, sender: "bot", time: new Date().toISOString() },
      ]);
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, something went wrong.",
          sender: "bot",
          isError: true,
          time: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async () => {
    setShowMoodModal(false);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/start-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mood }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "start error");
      setSessionId(d.sessionId);
      await AsyncStorage.setItem(SESSION_ID_KEY, d.sessionId);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not start session.");
    }
  };

  const startNewChat = async () => {
    setIsResetting(true);
    try {
      if (sessionId) {
        await fetch(`${API_BASE_URL}/ai/end-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });
      }
      setMessages([]);
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
      setShowMoodModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#ece5dd", "#f2fff6"]} style={styles.gradient}>
        {/* Mood Modal */}
        <Modal visible={showMoodModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View style={styles.moodCard}>
              <Text style={styles.moodTitle}>How are you feeling today?</Text>
              <Text style={styles.moodSubtitle}>
                Scale 1 (worst) to 10 (best)
              </Text>
              <Text style={styles.moodEmoji}>{moodEmojis[mood - 1]}</Text>
              <Slider
                style={{ width: width * 0.6, height: 40 }}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={mood}
                onValueChange={setMood}
                minimumTrackTintColor="#1B4332"
                maximumTrackTintColor="#BBECCA"
                thumbTintColor="#1B4332"
              />
              <Text style={styles.moodValue}>Your mood: {mood}</Text>
        <TouchableOpacity 
                style={styles.moodButton}
                onPress={handleStartSession}
        >
                <Text style={styles.moodButtonText}>Start Chat</Text>
        </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* Header */}
        <LinearGradient colors={["#1B4332", "#4BBE8A"]} style={styles.header}>
          <TouchableOpacity style={styles.avatarWrap}>
            <Ionicons name="person-circle" size={36} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Zensui Chat</Text>
            <Text style={styles.headerSubtitle}>Your private AI session</Text>
          </View>
          <TouchableOpacity 
            style={styles.fab}
            onPress={startNewChat}
            disabled={isResetting}
          >
            {isResetting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={24} color="#fff" />
            )}
          </TouchableOpacity>
      </LinearGradient>
      
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
          renderItem={({ item, index }) => {
            const isLast = index === messages.length - 1 && isTypingEffect;
            const showText =
              item.sender === "bot" && isLast ? typingText : item.text;
            return (
              <Animated.View
                style={[
                  styles.bubble,
                  item.sender === "user" ? styles.userBubble : styles.botBubble,
                  item.isError && styles.errorBubble,
                  { opacity: fadeAnim },
                ]}
              >
                <Text style={styles.bubbleText}>{showText}</Text>
                <Text style={styles.bubbleTime}>
                  {item.time
                    ? new Date(item.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </Text>
              </Animated.View>
            );
          }}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingBottom: inputBarHeight + 8 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <Animated.View
          style={[styles.inputWrapper, { bottom: keyboardHeight }]}
        >
          <View
        style={styles.inputContainer}
            onLayout={(e) => setInputBarHeight(e.nativeEvent.layout.height)}
      >
      <TextInput
              style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
              placeholder="Type a message..."
              placeholderTextColor="#888"
          multiline
              textAlignVertical="top"
        />
        <TouchableOpacity 
          onPress={sendMessage}
              style={[
                styles.sendButton,
                (!inputMessage.trim() || isLoading) && { opacity: 0.5 },
              ]}
          disabled={!inputMessage.trim() || isLoading}
        >
              <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ece5dd" },
  gradient: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  avatarWrap: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 2,
  },
  headerCenter: { flex: 1, alignItems: "center" },
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
  fab: {
    backgroundColor: "#388E3C",
    borderRadius: 24,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  bubble: {
    maxWidth: "75%",
    marginVertical: 4,
    padding: 10,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#dcf8c6",
    alignSelf: "flex-end",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 0,
  },
  botBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 0,
  },
  errorBubble: {
    backgroundColor: "#FFE5E5",
    borderColor: "#FF3B30",
    borderWidth: 1,
  },
  bubbleText: { fontSize: 16, color: "#303030" },
  bubbleTime: { fontSize: 10, color: "#555", textAlign: "right", marginTop: 4 },
  inputWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
  },
  textInput: { flex: 1, fontSize: 16, color: "#303030", paddingVertical: 4 },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#075E54",
    padding: 10,
    borderRadius: 25,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  moodCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    width: width * 0.8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  moodTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B4332",
    marginBottom: 6,
  },
  moodSubtitle: { fontSize: 15, color: "#388E3C", marginBottom: 10 },
  moodEmoji: { fontSize: 48, marginBottom: 8 },
  moodValue: {
    fontSize: 18,
    marginVertical: 8,
    color: "#1B4332",
    fontWeight: "600",
  },
  moodButton: {
    backgroundColor: "#388E3C",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 38,
    marginTop: 16,
  },
  moodButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 1,
  },
});
