import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");
const API_URL = 'http://192.168.1.202:5000';

export default function MyTherapist() {
  const colorScheme = useColorScheme();
  const accent = '#388E3C';
  const textColor = '#222';
  const theme = Colors[colorScheme ?? "light"];
  const [therapists, setTherapists] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_URL}/user/therapists`)
      .then(res => res.json())
      .then(data => setTherapists(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to fetch therapists', err);
        setTherapists([]);
      });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Therapists</ThemedText>
        <View style={{ width: 32 }} />
      </View>
      <ThemedText style={styles.headerSubtitle}>Find and chat with a therapist</ThemedText>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {Array.isArray(therapists) && therapists.length > 0 ? (
          therapists.map((t) => (
            <View key={t._id || t.id} style={styles.card}>
              <Image
                source={{ uri: t.profileImage || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500" }}
                style={styles.avatar}
              />
              <View style={styles.infoCol}>
                <ThemedText style={styles.name}>{t.username}</ThemedText>
                <ThemedText style={styles.email}>{t.email}</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => router.push(`/chat/${t._id || t.id}`)}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
                <ThemedText style={styles.chatBtnText}>Chat</ThemedText>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Ionicons name="sad-outline" size={48} color="#bbb" />
            <ThemedText style={{ color: '#888', fontSize: 16, marginTop: 8 }}>No therapists found.</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 10,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  backBtn: {
    backgroundColor: 'rgba(56,142,60,0.08)',
    borderRadius: 20,
    padding: 7,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#388E3C',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#388E3C',
    fontWeight: '600',
    marginLeft: 18,
    marginBottom: 8,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginRight: 16,
    backgroundColor: '#e0e0e0',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#388E3C',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 10,
  },
  chatBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
  },
});
