import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import DiscoverScreen from '@/app/discover';
import { useAuth } from '../../hooks/useAuth';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 40 - 24) / 3;
const CARD_HEIGHT = 90;
const COLUMN_WIDTH = screenWidth / 2 - 2;

const MOTIVATIONAL_QUOTES = [
  "Every day is a fresh start.",
  "Grow through what you go through.",
  "You are capable of amazing things.",
  "Small steps every day.",
  "Let your dreams blossom."
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}
function getTodayDate() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
function getRandomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

function getTimePeriod() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

const subjectCards = [
  {
    key: "talk",
    icon: "chatbubble-ellipses-outline" as const,
    label: "Talk",
    color: "#4CAF50",
    gradient: ["#4CAF50", "#45A049"],
    route: "/chat"
  },
  {
    key: "pause",
    icon: "leaf-outline" as const,
    label: "Self care",
    color: "#2196F3",
    gradient: ["#2196F3", "#1E88E5"],
    route: "/selfCare"
  },
  {
    key: "manage",
    icon: "pencil-outline" as const,
    label: "Journal",
    color: "#9C27B0",
    gradient: ["#9C27B0", "#8E24AA"],
    route: "/journal"
  },
];

const API_URL = 'http://192.168.1.202:5000'; // Use your backend URL

const WELLNESS_POSTS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    type: 'image',
    aspectRatio: 1.5,
    likes: '23.5K',
    category: 'Meditation',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5',
    type: 'image',
    aspectRatio: 0.8,
    likes: '18.2K',
    category: 'Mindfulness',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    type: 'image',
    aspectRatio: 1.2,
    likes: '31.1K',
    category: 'Self-Care',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0',
    type: 'image',
    aspectRatio: 1.3,
    likes: '15.7K',
    category: 'Mental Health',
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2',
    type: 'image',
    aspectRatio: 0.9,
    likes: '42.3K',
    category: 'Wellness',
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1517021897933-0e0319cfbc28',
    type: 'image',
    aspectRatio: 1.1,
    likes: '27.8K',
    category: 'Therapy',
  },
];

const WELLNESS_CATEGORIES = [
  { id: '1', name: 'Meditation', icon: 'leaf' },
  { id: '2', name: 'Anxiety', icon: 'heart' },
  { id: '3', name: 'Stress Relief', icon: 'sunny' },
  { id: '4', name: 'Self-Care', icon: 'sparkles' },
  { id: '5', name: 'Sleep', icon: 'moon' },
  { id: '6', name: 'Mindfulness', icon: 'flower' },
];

const FEATURED_ARTICLES = [
  {
    id: '1',
    title: 'Understanding Anxiety',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    author: 'Dr. Sarah Johnson',
  },
  {
    id: '2',
    title: 'Daily Meditation Guide',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5',
    author: 'Mindfulness Expert',
  },
  {
    id: '3',
    title: 'Stress Management Tips',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
    author: 'Wellness Coach',
  },
];

const DEFAULT_PROFILE_IMAGES = [
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1519340333755-c1aa5571fd46?auto=format&fit=facearea&w=256&h=256&facepad=2",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=256&h=256&facepad=2"
];

// Add User type for correct typing
interface User {
  username: string;
  email: string;
  profileImage?: string;
  images?: string[];
  token?: string;
  [key: string]: any;
}

// Add Therapist and Appointment types
interface Therapist {
  _id: string;
  id?: string;
  username: string;
  email: string;
  profileImage?: string;
}

interface Appointment {
  _id: string;
  title: string;
  description: string;
  status: string;
  scheduledTime?: string;
  therapist: Therapist;
  client: Therapist;
}

export default function UnifiedIndexScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user: rawUser, loading } = useAuth();
  const user = rawUser as User | null;
  const [quote] = useState(getRandomQuote());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');

  // All useEffect, useState, etc. go here
  useEffect(() => {
    if (user && (!user.profileImage || user.profileImage === '')) {
      const randomImage = DEFAULT_PROFILE_IMAGES[Math.floor(Math.random() * DEFAULT_PROFILE_IMAGES.length)];
      handleSaveProfileImage(randomImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Helper to update only the profile image
  const handleSaveProfileImage = async (img: string) => {
    try {
      await fetch('https://therapy-0gme.onrender.com/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ profileImage: img }),
      });
    } catch (e) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Enable notifications to receive motivational quotes!');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const period = getTimePeriod();
      const lastNotified = await AsyncStorage.getItem('lastNotifiedPeriod');
      if (lastNotified !== period) {
        const quote = getRandomQuote();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Motivation for you!',
            body: quote,
            sound: true,
          },
          trigger: null,
        });
        await AsyncStorage.setItem('lastNotifiedPeriod', period);
      }
    })();
  }, []);

  useEffect(() => {
    // Fetch therapists from backend
    fetch(`${API_URL}/user/therapists`)
      .then(res => res.json())
      .then(data => {
        // Defensive: ensure data is an array
        setTherapists(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to fetch therapists', err);
        setTherapists([]); // fallback to empty array on error
      });
  }, []);

  useEffect(() => {
    if (!user?.token) return;
    setAppointmentsLoading(true);
    setAppointmentsError('');
    fetch(`${API_URL}/appointment/my`, {
      headers: { 'Authorization': `Bearer ${user.token}` },
    })
      .then(res => res.json())
      .then(data => {
        setAppointments(Array.isArray(data) ? data : []);
        setAppointmentsLoading(false);
      })
      .catch(err => {
        setAppointments([]);
        setAppointmentsError('Failed to fetch appointments');
        setAppointmentsLoading(false);
      });
  }, [user?.token]);

  // Debug: log user object

  // Quick Actions
  const renderQuickActions = () => (
    <View style={styles.quickActionsRow}>
      {subjectCards.map((action) => (
              <TouchableOpacity 
          key={action.key}
          style={styles.quickActionButton}
          activeOpacity={0.85}
          onPress={() => router.push(action.route as any)}
        >
          <LinearGradient
            colors={action.gradient as [string, string]}
            style={styles.quickActionGradient}
          />
          <View style={styles.quickActionIconWrap}>
            <Ionicons name={action.icon} size={28} color="#fff" />
          </View>
          <ThemedText style={styles.quickActionLabel}>{action.label}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  // MyTherapist Section
  const renderMyTherapist = () => {
    const upcomingAppointment = getUpcomingAppointment(appointments);

    return (
      <View style={styles.sectionCard}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=500" }}
          style={styles.therapistHeaderImage}
        />
        <BlurView intensity={30} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.therapistOverlay}>
          <View style={styles.statusBadge}>
            {appointmentsLoading ? (
              <ThemedText style={styles.statusText}>Loading...</ThemedText>
            ) : appointmentsError ? (
              <ThemedText style={styles.statusText}>{appointmentsError}</ThemedText>
            ) : upcomingAppointment ? (
              <>
                <ThemedText style={styles.statusText}>
                  Upcoming: {upcomingAppointment.scheduledTime ? new Date(upcomingAppointment.scheduledTime).toLocaleString() : 'TBD'}
                </ThemedText>
                <ThemedText style={[styles.statusText, { fontSize: 13 }]}>With: {user && user.role === 'therapist'
                  ? upcomingAppointment.client?.username
                  : upcomingAppointment.therapist?.username}</ThemedText>
                <ThemedText style={[styles.statusText, { fontSize: 13 }]}>Status: {upcomingAppointment.status.charAt(0).toUpperCase() + upcomingAppointment.status.slice(1)}</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.statusText}>No upcoming session</ThemedText>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <ThemedText style={styles.sectionTitle}>Chat with a Therapist</ThemedText>
            <TouchableOpacity onPress={() => router.push('/MyTherapist')} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
              <ThemedText style={{ color: '#2196F3', fontWeight: 'bold' }}>See More</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.therapistsContainer}>
          {Array.isArray(therapists) && (therapists as Therapist[]).slice(0, 2).map((t: Therapist) => (
            <TouchableOpacity
              key={t._id || t.id}
              style={styles.therapistCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/chat/${t._id || t.id}`)}
            >
              <Image source={{ uri: t.profileImage || DEFAULT_PROFILE_IMAGES[0] }} style={styles.therapistImage} />
              <View style={styles.therapistInfo}>
                <ThemedText style={styles.therapistName}>{t.username}</ThemedText>
                <ThemedText style={styles.therapistSpecialization}>{t.email}</ThemedText>
              </View>
              <TouchableOpacity style={styles.bookButton}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
                <ThemedText style={styles.bookButtonText}>Chat</ThemedText>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {Array.isArray(therapists) && therapists.length === 0 && (
            <ThemedText>No therapists found.</ThemedText>
          )}
        </View>
      </View>
    );
  };

  // Discover Section
  const renderFeaturedArticle = ({ item }: { item: typeof FEATURED_ARTICLES[0] }) => (
    <TouchableOpacity style={styles.featuredStoryContainer}>
      <Image source={{ uri: item.image }} style={styles.featuredStoryImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.featuredStoryGradient}
      >
        <ThemedText style={styles.featuredStoryTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.featuredStoryAuthor}>{item.author}</ThemedText>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCategoryChip = ({ item }: { item: typeof WELLNESS_CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.selectedCategoryChip,
      ]}
      onPress={() => setSelectedCategory(item.id as string)}
    >
      <Ionicons
        name={item.icon as any}
        size={16}
        color={selectedCategory === item.id ? '#FFFFFF' : '#000000'}
      />
      <ThemedText
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText,
        ]}
      >
        {item.name}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderMasonryItem = ({ item }: { item: typeof WELLNESS_POSTS[0] }) => (
    <TouchableOpacity style={styles.masonryItem}>
      <Image
        source={{ uri: item.image }}
        style={[
          styles.masonryImage,
          { height: COLUMN_WIDTH * item.aspectRatio },
        ]}
      />
      <BlurView
        intensity={80}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.masonryOverlay}
      >
        <View style={styles.masonryInfo}>
          <View style={styles.masonryCategory}>
            <ThemedText style={styles.masonryCategoryText}>
              {item.category}
            </ThemedText>
          </View>
          <View style={styles.masonryStats}>
            <Ionicons name="heart" size={14} color="#FFFFFF" />
            <ThemedText style={styles.masonryStatsText}>
              {item.likes}
            </ThemedText>
                </View>
              </View>
      </BlurView>
    </TouchableOpacity>
  );

  function getUpcomingAppointment(appointments: Appointment[]): Appointment | null {
    const now = new Date();
    // Only consider approved or pending, and scheduled in the future
    const upcoming = appointments
      .filter(app =>
        (app.status === 'approved' || app.status === 'pending') &&
        app.scheduledTime &&
        new Date(app.scheduledTime) > now
      )
      .sort((a, b) => {
        if (!a.scheduledTime || !b.scheduledTime) return 0;
        return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      });
    return upcoming[0] || null;
  }

  // Only after all hooks:
  if (loading || !user) {
    return (
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.parallaxContainer}>
          <LinearGradient
            colors={["#A8E063", "#F7FAF7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          />
          <View style={styles.headerContentRow}>
            <View style={styles.headerTextCol}>
              <ThemedText style={styles.greetingText}>
                {getGreeting()}, {user?.username}! <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
              </ThemedText>
              <ThemedText style={styles.dateText}>{getTodayDate()}</ThemedText>
              <ThemedText style={styles.quoteText}>
                "{quote}"
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.avatarButton}
              onPress={() => router.push("/profile")}
              activeOpacity={0.8}
            >
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={28} color="#222" />
              </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <ThemedText style={styles.sectionHeader}>Quick Actions</ThemedText>
        {renderQuickActions()}

        {/* My Therapist */}
        <ThemedText style={styles.sectionHeader}>My Therapist</ThemedText>
        {renderMyTherapist()}

        {/* Discover (reverted) */}
        {/* <ThemedText style={styles.sectionHeader}>Discover</ThemedText> */}
        <DiscoverScreen />
      </ScrollView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  parallaxContainer: {
    paddingVertical: 30,
    paddingHorizontal: 0,
    position: 'relative',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    opacity: 0.18,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#4CAF50',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
        elevation: 3,
      },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsSection: {
    paddingTop: 10,
  },
  quickCardScroll: {
    paddingHorizontal: 10,
    paddingVertical: 25,
    gap: 12,
  },
  quickCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  quickActionButton: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    marginHorizontal: 0,
  },
  quickActionGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.13)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  contentContainer: {
    flex: 1,
    marginTop: -20,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  therapistHeaderImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  therapistOverlay: {
    // padding: 10,
    marginTop: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 5,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  therapistsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  therapistCard: {
    width: '50%',
    padding: 10,
  },
  therapistImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  therapistInfo: {
    marginTop: 10,
  },
  therapistName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  therapistSpecialization: {
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#4CAF50',

    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  featuredStoryContainer: {
    width: 200,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
  },
  featuredStoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredStoryGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  featuredStoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  featuredStoryAuthor: {
    color: 'white',
    fontSize: 14,
  },
  featuredStoriesContainer: {
    padding: 10,
  },
  categoriesContainer: {
    padding: 10,
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  selectedCategoryChip: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    color: '#000',
  },
  selectedCategoryText: {
    color: 'white',
  },
  masonryContainer: {
    padding: 10,
  },
  masonryItem: {
    width: '50%',
    padding: 5,
  },
  masonryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  masonryOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  masonryInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  masonryCategory: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 5,
  },
  masonryCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  masonryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masonryStatsText: {
    color: 'white',
    marginLeft: 5,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 24,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    color: '#222',
    paddingHorizontal: 10,
  },
});



