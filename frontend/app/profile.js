import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from '../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const MOODS = [
  { key: 'happy', value: 1, label: 'Happy', icon: 'happy-outline', color: '#FFD600' },
  { key: 'calm', value: 2, label: 'Calm', icon: 'leaf-outline', color: '#4CAF50' },
  { key: 'neutral', value: 3, label: 'Okay', icon: 'remove-circle-outline', color: '#90A4AE' },
  { key: 'sad', value: 4, label: 'Sad', icon: 'sad-outline', color: '#FF7043' },
  { key: 'tired', value: 5, label: 'Tired', icon: 'bed-outline', color: '#9575CD' },
  { key: 'excited', label: 'Excited', icon: 'rocket-outline', color: '#FFB300' },
  { key: 'anxious', label: 'Anxious', icon: 'alert-circle-outline', color: '#FF5252' },
  { key: 'grateful', label: 'Grateful', icon: 'heart-outline', color: '#FF80AB' },
  { key: 'angry', label: 'Angry', icon: 'flame-outline', color: '#D84315' },
  { key: 'lonely', label: 'Lonely', icon: 'person-outline', color: '#607D8B' },
  { key: 'inspired', label: 'Inspired', icon: 'bulb-outline', color: '#FFD740' },
  { key: 'overwhelmed', label: 'Overwhelmed', icon: 'cloud-outline', color: '#90CAF9' },
];

function getInstagramProfileStyles({ accent, textColor, errorColor }) {
  const { width } = Dimensions.get('window');
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 54 : 24,
      paddingBottom: 12,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      backgroundColor: '#fff',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: accent,
      letterSpacing: 0.5,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 24,
      paddingBottom: 12,
    },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      borderWidth: 2,
      borderColor: accent,
      backgroundColor: '#eaeaea',
      marginRight: 24,
    },
    profileInfo: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    usernameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    username: {
      fontSize: 22,
      fontWeight: '700',
      color: textColor,
      marginRight: 10,
    },
    editBtn: {
      backgroundColor: accent,
      borderRadius: 18,
      paddingVertical: 6,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    editBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 6,
      width: '100%',
    },
    statBlock: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontWeight: '800',
      fontSize: 18,
      color: textColor,
    },
    statLabel: {
      fontSize: 13,
      color: '#888',
      fontWeight: '600',
      marginTop: 2,
    },
    bio: {
      fontSize: 15,
      color: textColor,
      paddingHorizontal: 18,
      marginTop: 8,
      marginBottom: 16,
    },
    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      marginBottom: 0,
    },
    tabBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
    },
    tabBtnActive: {
      borderBottomWidth: 2,
      borderBottomColor: accent,
    },
    tabBtnText: {
      fontWeight: '700',
      fontSize: 15,
      color: '#888',
    },
    tabBtnTextActive: {
      color: accent,
    },
    tabContent: {
      flex: 1,
      minHeight: 200,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      borderRadius: 18,
      padding: 24,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 18,
      color: textColor,
    },
    modalInput: {
      width: '100%',
      padding: 14,
      borderRadius: 12,
      backgroundColor: '#f8f8f8',
      color: textColor,
      fontSize: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#eee',
    },
    modalLabel: {
      fontWeight: '700',
      marginBottom: 6,
      fontSize: 15,
      color: textColor,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginHorizontal: 6,
    },
    modalButtonText: {
      fontWeight: '700',
      fontSize: 16,
    },
    errorText: {
      color: errorColor,
      marginBottom: 8,
      fontWeight: '700',
    },
  });
}

const formatMoodDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Profile() {
  const colorScheme = useColorScheme();
  const accent = '#388E3C';
  const textColor = '#222';
  const errorColor = '#D32F2F';
  const styles = getInstagramProfileStyles({ accent, textColor, errorColor });
  const router = useRouter();
  const { user, getProfile, loading, logout, token } = useAuth();
  console.log('DEBUG: user object in Profile screen:', user);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('journal');
  const [uploading, setUploading] = useState(false);
  const [userMoods, setUserMoods] = useState([]);
  const [userMoodCount, setUserMoodCount] = useState(0);
  const [journalMoods, setJournalMoods] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');

  React.useEffect(() => {
    (async () => {
      await getProfile();
    })();
  }, []);

  // Fetch moods for user
  const fetchUserMoods = async (authorId) => {
    if (!authorId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.1.202:5000/mood/author/${authorId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUserMoods(data);
        setUserMoodCount(data.length);
      } else {
        setUserMoods([]);
        setUserMoodCount(0);
      }
    } catch {
      setUserMoods([]);
      setUserMoodCount(0);
    }
  };

  // Fetch journals for user and extract moods
  const fetchUserJournals = async (authorId) => {
    if (!authorId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.1.202:5000/journal/author/${authorId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data)) {
        // Extract moods and dates from journals
        const moods = data.data.map(j => ({
          mood: j.mood,
          createdAt: j.createdAt,
          _id: j._id,
          source: 'journal',
        }));
        setJournalMoods(moods);
      } else {
        setJournalMoods([]);
      }
    } catch {
      setJournalMoods([]);
    }
  };

  // Fetch all appointments for the user (client or therapist)
  const fetchAppointments = async () => {
    if (!token) return;
    setAppointmentsLoading(true);
    setAppointmentsError('');
    try {
      const res = await fetch('http://192.168.1.202:5000/appointment/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
        setAppointmentsCount(data.length);
      } else {
        setAppointments([]);
        setAppointmentsCount(0);
      }
    } catch (e) {
      setAppointments([]);
      setAppointmentsCount(0);
      setAppointmentsError('Failed to fetch appointments');
    }
    setAppointmentsLoading(false);
  };

  // Fetch all user data (profile, moods, journals, appointments) on mount when user is available
  React.useEffect(() => {
    if (user && token) {
      fetchUserMoods(user._id || user.id);
      fetchUserJournals(user._id || user.id);
      fetchAppointments();
    }
  }, [user, token]);

  // Merge moods from mood logs and journals, sort by date descending, deduplicate by mood+date
  const mergedMoods = React.useMemo(() => {
    const all = [...userMoods, ...journalMoods];
    // Use a map to deduplicate by mood+date
    const map = new Map();
    all.forEach(m => {
      const key = `${m.mood}-${formatMoodDate(m.createdAt)}`;
      if (!map.has(key)) map.set(key, m);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userMoods, journalMoods]);

  // Helper to get mood label/icon from value
  const getMood = (moodValue) => {
    return MOODS.find(m => m.value === moodValue) || MOODS[2];
  };

  // Example stats (replace with real data if available)
  const stats = [
    { label: 'Journal', value: user?.journalCount || 0 },
    { label: 'Sessions', value: appointmentsCount },
    { label: 'Mood', value: userMoodCount },
  ];

  // Render moods grid
  const renderUserMoodsGrid = () => {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'}}>
        {mergedMoods.map((mood, idx) => {
          let moodObj = MOODS.find(m => m.key === mood.mood) || MOODS.find(m => m.value === mood.mood) || MOODS.find(m => m.label.toLowerCase() === (mood.mood || '').toLowerCase());
          if (!moodObj && typeof mood.mood === 'number') moodObj = MOODS.find(m => m.value === mood.mood);
          const bgColor = moodObj?.color ? moodObj.color + '33' : '#F1F3F4';
          const isLarge = idx % 5 === 0;
          return (
            <View
              key={mood._id || idx}
              style={{
                width: isLarge ? '62%' : '31%',
                aspectRatio: isLarge ? 1.2 : 1,
                backgroundColor: bgColor,
                borderRadius: 8,
                margin: '1%',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 3,
                shadowColor: moodObj?.color || '#888',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.10,
                shadowRadius: 8,
                padding: isLarge ? 10 : 6,
              }}
            >
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Ionicons name={moodObj?.icon || 'happy-outline'} size={isLarge ? 54 : 38} color={moodObj?.color || '#888'} style={{ marginBottom: isLarge ? 8 : 4 }} />
                <ThemedText style={{ fontWeight: '800', color: '#333', fontSize: isLarge ? 20 : 14, marginBottom: 2, textAlign: 'center' }}>{moodObj?.label || mood.mood}</ThemedText>
                {mood.createdAt && <ThemedText style={{ color: '#555', fontSize: isLarge ? 13 : 10, opacity: 0.85, textAlign: 'center' }}>{formatMoodDate(mood.createdAt)}</ThemedText>}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // --- Early return after all hooks ---
  if (loading || !user) {
    return (
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const openEditModal = () => {
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditProfileImage(user.profileImage);
    setEditModalVisible(true);
    setError('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('http://192.168.1.202:5000/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          profileImage: editProfileImage,
        }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      await getProfile();
      setEditModalVisible(false);
    } catch (e) {
      setError('Failed to update profile');
    }
    setSaving(false);
  };

  const pickAndUploadImage = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const formData = new FormData();
        formData.append('image', {
          uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
        const res = await fetch('http://192.168.1.202:5000/user/me/upload-profile-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload image');
        const data = await res.json();
        setEditProfileImage(data.profileImage);
      }
    } catch (e) {
      setError('Failed to upload image');
    }
    setUploading(false);
  };

  // --- Render ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Header Row: Go Back, Title, Add Article (admin/therapist), Logout */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 }}>
          {/* Go Back Button */}
          <TouchableOpacity
            onPress={() => {
              try {
                router.back();
                // Fallback: after a short delay, go home if still on profile
                setTimeout(() => {
                  if (window && window.location && window.location.pathname.includes('profile')) {
                    router.replace('/');
                  }
                }, 200);
              } catch {
                router.replace('/');
              }
            }}
            style={{ padding: 6, borderRadius: 18, backgroundColor: 'rgba(56,142,60,0.08)', marginRight: 6 }}
          >
            <Ionicons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          {/* Title */}
          <ThemedText style={{ fontSize: 22, fontWeight: '800', color: accent, flex: 1, textAlign: 'center', marginLeft: -30 }}>Profile</ThemedText>
          {/* Add Article Button (admin/therapist only) */}
          {(user.role === 'admin' || user.role === 'therapist') && (
            <TouchableOpacity
              style={{ padding: 6, borderRadius: 18, backgroundColor: 'rgba(56,142,60,0.08)', marginLeft: 6 }}
              onPress={() => router.push('/createArticle')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={24} color={accent} />
            </TouchableOpacity>
          )}
          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout} style={{ padding: 6, borderRadius: 18, backgroundColor: 'rgba(56,142,60,0.08)', marginLeft: 6 }}>
            <Ionicons name="log-out-outline" size={24} color={accent} />
          </TouchableOpacity>
        </View>
        {/* Profile Row */}
        <View style={styles.profileRow}>
          <Image source={{ uri: user.profileImage || user.images?.[0] }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <View style={styles.usernameRow}>
              <ThemedText style={styles.username}>{user.username}</ThemedText>
              <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
                <ThemedText style={styles.editBtnText}>Edit Profile</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statBlock}>
                  <ThemedText style={styles.statNumber}>{stat.value}</ThemedText>
                  <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>
        {/* Role/Bio and My Chats or Quote Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 18, marginTop: 2, marginBottom: 10 }}>
          <ThemedText style={styles.bio}>{user.role || 'Farmer, Dreamer, Grower'}</ThemedText>
          {user.role === 'therapist' ? (
            <TouchableOpacity
              style={{
                backgroundColor: accent,
                borderRadius: 18,
                paddingVertical: 8,
                paddingHorizontal: 18,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
              onPress={() => router.push('/therapist-chats')}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <ThemedText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>My Chats</ThemedText>
            </TouchableOpacity>
          ) : user.role === 'user' ? (
            <ThemedText style={{ color: accent, fontWeight: '600', fontSize: 15, marginLeft: 8 }}>
              "Every day is a fresh start."
            </ThemedText>
          ) : null}
        </View>
        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'journal' && styles.tabBtnActive]}
            onPress={() => setActiveTab('journal')}
          >
            <ThemedText style={[styles.tabBtnText, activeTab === 'journal' && styles.tabBtnTextActive]}>Journal</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'appointments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('appointments')}
          >
            <ThemedText style={[styles.tabBtnText, activeTab === 'appointments' && styles.tabBtnTextActive]}>Appointments</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'mood' && styles.tabBtnActive]}
            onPress={() => setActiveTab('mood')}
          >
            <ThemedText style={[styles.tabBtnText, activeTab === 'mood' && styles.tabBtnTextActive]}>Mood</ThemedText>
          </TouchableOpacity>
        </View>
        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'journal' && (
            user.journals && user.journals.length > 0 ? (
              <ScrollView style={{ width: '110%' }}>
                {user.journals.map(journal => {
                  const mood = getMood(journal.mood);
                  return (
                    <View key={journal._id || journal.title + journal.createdAt} style={{ marginBottom: 18, backgroundColor: '#FAFAF7', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name={mood.icon} size={18} color={mood.color} style={{ marginRight: 8 }} />
                        <ThemedText style={{ fontWeight: '700', fontSize: 16 }}>{journal.title}</ThemedText>
                      </View>
                      <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>{mood.label}</ThemedText>
                      <ThemedText style={{ fontSize: 15 }}>{journal.note}</ThemedText>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <ThemedText style={{ color: '#888' }}>No journal entries yet.</ThemedText>
            )
          )}
          {activeTab === 'fields' && <ThemedText>Appointments managed will appear here.</ThemedText>}
          {activeTab === 'mood' && (
            userMoods.length > 0 ? (
              <ScrollView style={{ width: '110%' }}>
                {renderUserMoodsGrid()}
              </ScrollView>
            ) : (
              <ThemedText style={{ color: '#888' }}>No mood logs yet.</ThemedText>
            )
          )}
          {activeTab === 'appointments' && (
            appointmentsLoading ? (
              <ActivityIndicator size="large" color={accent} />
            ) : appointmentsError ? (
              <ThemedText style={{ color: errorColor }}>{appointmentsError}</ThemedText>
            ) : appointments.length > 0 ? (
              <ScrollView style={{ width: '110%' }}>
                {appointments.map(app => (
                  <View key={app._id} style={{ marginBottom: 18, backgroundColor: '#FAFAF7', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="calendar-outline" size={18} color={accent} style={{ marginRight: 8 }} />
                      <ThemedText style={{ fontWeight: '700', fontSize: 16 }}>{app.title}</ThemedText>
                    </View>
                    <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>{app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : ''}</ThemedText>
                    <ThemedText style={{ fontSize: 15, marginBottom: 6 }}>{app.description}</ThemedText>
                    {app.scheduledTime && (
                      <ThemedText style={{ color: '#555', fontSize: 13 }}>
                        Scheduled: {new Date(app.scheduledTime).toLocaleString()}
                      </ThemedText>
                    )}
                    <ThemedText style={{ color: '#555', fontSize: 13, marginTop: 2 }}>
                      Therapist: {app.therapist?.username || ''} | Client: {app.client?.username || ''}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <ThemedText style={{ color: '#888' }}>No appointments yet.</ThemedText>
            )
          )}
        </View>
        {/* Edit Profile Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Edit Profile</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Username"
                placeholderTextColor="#bbb"
              />
              <TextInput
                style={styles.modalInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                placeholderTextColor="#bbb"
                keyboardType="email-address"
              />
              <ThemedText style={styles.modalLabel}>Profile Image URL</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={editProfileImage}
                onChangeText={setEditProfileImage}
                placeholder="Paste image URL here or use gallery"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={[styles.editBtn, { marginBottom: 10, alignSelf: 'center' }]} onPress={pickAndUploadImage} disabled={uploading}>
                {uploading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.editBtnText}>Pick from Gallery</ThemedText>}
              </TouchableOpacity>
              {editProfileImage ? (
                <Image
                  source={{ uri: editProfileImage }}
                  style={{ width: 60, height: 60, borderRadius: 30, alignSelf: 'center', marginVertical: 10, borderWidth: 2, borderColor: accent, backgroundColor: '#eaeaea' }}
                />
              ) : null}
              {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#eee' }]} onPress={() => setEditModalVisible(false)}>
                  <ThemedText style={[styles.modalButtonText, { color: textColor }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: accent }]} onPress={handleSaveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={[styles.modalButtonText, { color: '#fff' }]}>Save</ThemedText>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

