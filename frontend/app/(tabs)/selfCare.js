import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View,
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Platform,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const API_BASE_URL = 'http://192.168.1.202:5000'; // Use your backend URL

const HERO_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080';
const FEATURED_IMAGE = 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1080';

const MEDITATE_URL = 'https://www.youtube.com/watch?v=inpok4MKVLM';
const BREATHE_URL = 'https://www.xhalr.com/'; // Or your own breathing screen route

const QUICK_ACTIONS = [
  {
    key: 'meditate',
    label: 'Meditate',
    icon: 'meditation',
    color: '#4CAF50',
    bg: ['#A8E063', '#56AB2F'],
  },
  {
    key: 'journal',
    label: 'Journal',
    icon: 'book-outline',
    color: '#FF9800',
    bg: ['#FFD194', '#70E1F5'],
  },
  {
    key: 'breathe',
    label: 'Breathe',
    icon: 'cloud-outline',
    color: '#2196F3',
    bg: ['#43C6AC', '#191654'],
  },
];

const MOODS = [
  { key: 'happy', icon: 'happy-outline', color: '#FFD600', label: 'Happy' },
  { key: 'calm', icon: 'leaf-outline', color: '#4CAF50', label: 'Calm' },
  { key: 'neutral', icon: 'remove-circle-outline', color: '#90A4AE', label: 'Okay' },
  { key: 'sad', icon: 'sad-outline', color: '#FF7043', label: 'Sad' },
  { key: 'tired', icon: 'bed-outline', color: '#9575CD', label: 'Tired' },
  { key: 'excited', icon: 'rocket-outline', color: '#FFB300', label: 'Excited' },
  { key: 'anxious', icon: 'alert-circle-outline', color: '#FF5252', label: 'Anxious' },
  { key: 'grateful', icon: 'heart-outline', color: '#FF80AB', label: 'Grateful' },
  { key: 'angry', icon: 'flame-outline', color: '#D84315', label: 'Angry' },
  { key: 'lonely', icon: 'person-outline', color: '#607D8B', label: 'Lonely' },
  { key: 'inspired', icon: 'bulb-outline', color: '#FFD740', label: 'Inspired' },
  { key: 'overwhelmed', icon: 'cloud-outline', color: '#90CAF9', label: 'Overwhelmed' },
];

export default function SelfCareScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState(null);
  const [daily, setDaily] = useState(null);
  const [articleModal, setArticleModal] = useState(false);
  const [focusComplete, setFocusComplete] = useState(false);
  const [focusProgress, setFocusProgress] = useState(0);
  const [focusLoading, setFocusLoading] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [focusTimeLeft, setFocusTimeLeft] = useState(0);
  const [focusTimer, setFocusTimer] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleModalLoading, setArticleModalLoading] = useState(false);
  const [moodSubmitting, setMoodSubmitting] = useState(false);
  const [moodSuccess, setMoodSuccess] = useState(false);
  const [moodError, setMoodError] = useState('');
  const [userMoods, setUserMoods] = useState([]);
  const [userMoodCount, setUserMoodCount] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchDailyContent();
  }, []);

  useEffect(() => {
    if (daily?.focus?.duration) {
      setFocusTimeLeft(daily.focus.duration);
      setFocusProgress(0);
      setFocusComplete(false);
      setFocusPaused(false);
      if (focusTimer) clearInterval(focusTimer);
    }
    // eslint-disable-next-line
  }, [daily?.focus?.duration]);

  useEffect(() => {
    if (focusComplete && focusTimer) {
      clearInterval(focusTimer);
    }
    // eslint-disable-next-line
  }, [focusComplete]);

  const fetchDailyContent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/self-care-home`);
      const data = await res.json();
      setDaily(data);
      setFocusComplete(false);
      setFocusProgress(0);
      setArticles(Array.isArray(data) ? data.filter(a => a && a.title && a.content && Array.isArray(a.files)) : []);
    } catch (e) {
      setDaily(null);
    }
  };

  // Hero Section
  const renderHero = () => (
    <View style={styles.heroContainer}>
      <Image source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080' }} style={styles.heroImage} />
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroContent}>
        <ThemedText style={styles.heroGreeting}>Good {getGreeting()} 🌱</ThemedText>
        <ThemedText style={styles.heroQuote}>
          {daily?.quote || 'Loading inspiration...'}
        </ThemedText>
      </View>
    </View>
  );

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  }

  // Quick Actions
  const handleQuickAction = (key) => {
    if (key === 'meditate') {
      Linking.openURL(MEDITATE_URL);
    } else if (key === 'journal') {
      router.push('/(tabs)/journal');
    } else if (key === 'breathe') {
      // If you have a breathing screen, use router.push('/breathe')
      Linking.openURL(BREATHE_URL);
    }
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsRow}>
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={styles.quickActionButton}
          activeOpacity={0.85}
          onPress={() => handleQuickAction(action.key)}
        >
          <LinearGradient
            colors={action.bg}
            style={styles.quickActionGradient}
          />
          <View style={styles.quickActionIconWrap}>
            {action.icon === 'meditation' ? (
              <MaterialCommunityIcons name="meditation" size={28} color="#fff" />
            ) : (
              <Ionicons name={action.icon} size={28} color="#fff" />
            )}
          </View>
          <ThemedText style={styles.quickActionLabel}>{action.label}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Focus logic
  function parseFocusType(focus) {
    if (!focus) return 'generic';
    const tip = typeof focus === 'string' ? focus : focus.tip;
    if (!tip) return 'generic';
    const f = tip.toLowerCase();
    if (f.includes('breathe')) return 'breathe';
    if (f.includes('meditat')) return 'meditate';
    if (f.includes('journal') || f.includes('write')) return 'journal';
    return 'generic';
  }

  const focusType = parseFocusType(daily?.focus);

  const handleFocusStart = () => {
    if (focusComplete) return;
    setFocusLoading(true);
    setFocusPaused(false);
    if (focusTimer) clearInterval(focusTimer);
    const duration = daily?.focus?.duration || 300;
    let timeLeft = focusTimeLeft > 0 ? focusTimeLeft : duration;
    setFocusTimeLeft(timeLeft);
    setFocusProgress(1 - timeLeft / duration);
    const timer = setInterval(() => {
      if (focusPaused) return;
      timeLeft -= 1;
      setFocusTimeLeft(timeLeft);
      setFocusProgress(1 - timeLeft / duration);
      if (timeLeft <= 0) {
        clearInterval(timer);
        setFocusProgress(1);
        setFocusComplete(true);
        setFocusLoading(false);
        Alert.alert('Great job!', "You completed today's focus!");
      }
    }, 1000);
    setFocusTimer(timer);
  };

  const handleFocusPause = () => {
    setFocusPaused(true);
    setFocusLoading(false);
  };

  const handleFocusResume = () => {
    setFocusPaused(false);
    setFocusLoading(true);
  };

  useEffect(() => {
    return () => {
      if (focusTimer) clearInterval(focusTimer);
    };
    // eslint-disable-next-line
  }, []);

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min > 0 ? min + 'm ' : ''}${sec}s`;
  }

  // Today's Focus
  const renderFocusCard = () => (
    <View style={styles.focusCard}>
      <ThemedText style={styles.focusTitle}>Today's Focus</ThemedText>
      <ThemedText style={styles.focusTip}>
        {daily?.focus?.tip || daily?.focus || 'Loading focus...'}
      </ThemedText>
      <ThemedText style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
        {focusComplete ? 'Completed!' : `Time: ${formatTime(focusTimeLeft)}`}
      </ThemedText>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${focusProgress * 100}%` }]} />
      </View>
      {focusComplete ? (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Ionicons name="checkmark-circle" size={32} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, fontWeight: '700', marginTop: 4 }}>Completed!</ThemedText>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.focusLongButton, (focusLoading || focusPaused) && { backgroundColor: '#bbb' }]}
          activeOpacity={0.85}
          onPress={
            !focusLoading && !focusPaused
              ? handleFocusStart
              : focusLoading && !focusPaused
              ? handleFocusPause
              : handleFocusResume
          }
        >
          <ThemedText style={styles.focusLongButtonText}>
            {!focusLoading && !focusPaused && 'Start'}
            {focusLoading && !focusPaused && 'Pause'}
            {focusPaused && 'Resume'}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  // Mood Tracker
  const handleConfirmMood = async () => {
    if (!selectedMood) return;
    setMoodSubmitting(true);
    setMoodSuccess(false);
    setMoodError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mood: selectedMood }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit mood');
      }
      setMoodSuccess(true);
      setTimeout(() => setMoodSuccess(false), 2000);
    } catch (e) {
      setMoodError(e.message || 'Failed to submit mood');
      setTimeout(() => setMoodError(''), 2000);
    } finally {
      setMoodSubmitting(false);
    }
  };

  const renderMoodTracker = () => {
    if (!focusComplete) {
      return (
        <View style={styles.moodSection}>
          <ThemedText style={styles.moodTitle}>How are you feeling afterwards?</ThemedText>
          <View style={{ alignItems: 'center', marginVertical: 18 }}>
            <Ionicons name="lock-closed-outline" size={36} color="#bbb" style={{ marginBottom: 8 }} />
            <ThemedText style={{ color: '#888', fontSize: 15, textAlign: 'center' }}>
              Complete today's focus to log your mood.
            </ThemedText>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.moodSection}>
        <ThemedText style={styles.moodTitle}>How are you feeling afterwards?</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.key}
              style={[styles.moodButton, selectedMood === mood.key && { backgroundColor: mood.color + '33' }]}
              onPress={() => setSelectedMood(mood.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={mood.icon} size={26} color={mood.color} />
              <ThemedText style={styles.moodLabel}>{mood.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selectedMood && (
          <TouchableOpacity
            style={[styles.focusLongButton, { marginTop: 16, backgroundColor: '#388E3C' }]}
            onPress={handleConfirmMood}
            disabled={moodSubmitting}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.focusLongButtonText}>
              {moodSubmitting ? 'Submitting...' : moodSuccess ? 'Mood Saved!' : 'Confirm Mood'}
            </ThemedText>
          </TouchableOpacity>
        )}
        {moodError ? (
          <ThemedText style={{ color: '#E53935', marginTop: 8 }}>{moodError}</ThemedText>
        ) : null}
        <ThemedText style={{ color: '#888', fontSize: 13, marginTop: 6, marginBottom: 2 }}>You've logged {userMoodCount} moods</ThemedText>
      </View>
    );
  };

  // Featured Article
  const renderFeatured = () => (
    <TouchableOpacity style={styles.featuredCard} activeOpacity={0.88} onPress={() => setArticleModal(true)}>
      <View style={{ position: 'absolute', top: 18, left: 18, zIndex: 2 }}>
        {daily?.article?.icon && (
          daily.article.icon.startsWith('meditation') ? (
            <MaterialCommunityIcons name={daily.article.icon} size={32} color="#fff" />
          ) : (
            <Ionicons name={daily.article.icon} size={32} color="#fff" />
          )
        )}
      </View>
      <Image source={{ uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1080' }} style={styles.featuredImage} />
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']}
        style={styles.featuredGradient}
      />
      <View style={styles.featuredContent}>
        <ThemedText style={styles.featuredTitle}>{daily?.article?.title || 'Loading...'}</ThemedText>
        <ThemedText style={{ color: '#fff', marginBottom: 10 }}>{daily?.article?.summary || ''}</ThemedText>
        <TouchableOpacity style={styles.featuredButton}>
          <ThemedText style={styles.featuredButtonText}>Read More</ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const handleOpenArticleModal = async (articleId) => {
    setArticleModalLoading(true);
    setArticleModal(true);
    try {
      const res = await fetch(`${API_BASE_URL}/article/${articleId}`);
      const data = await res.json();
      setSelectedArticle(data);
    } catch (e) {
      setSelectedArticle(null);
    } finally {
      setArticleModalLoading(false);
    }
  };

  const renderArticleModal = () => (
    <Modal visible={articleModal} animationType="slide" transparent onRequestClose={() => setArticleModal(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 24, width: '92%', maxHeight: '90%' }}>
          {articleModalLoading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : selectedArticle ? (
            <>
              <ThemedText style={{ fontWeight: '800', fontSize: 18 }}>{selectedArticle.title}</ThemedText>
              <ScrollView style={{ maxHeight: 320 }}>
                <ThemedText style={{ fontSize: 15, marginBottom: 12 }}>{selectedArticle.content}</ThemedText>
                {selectedArticle.files && selectedArticle.files.length > 0 && (
                  <Image source={{ uri: selectedArticle.files[0].url }} style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 12 }} />
                )}
              </ScrollView>
              <TouchableOpacity style={[styles.featuredButton, { marginTop: 12 }]} onPress={() => setArticleModal(false)}>
                <ThemedText style={styles.featuredButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <ThemedText style={{ color: '#888' }}>Failed to load article.</ThemedText>
          )}
        </View>
      </View>
    </Modal>
  );

  // Footer
  const renderFooter = () => (
    <View style={styles.footer}>
      <ThemedText style={styles.footerText}>You're doing great. Take it one step at a time 🌾</ThemedText>
    </View>
  );

  // Fetch userId from token or profile
  useEffect(() => {
    const fetchUserId = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Decode JWT to get userId (if not available, fallback to profile fetch)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.id || payload._id || payload.userId);
        } catch {
          // fallback: fetch profile
          try {
            const res = await fetch(`${API_BASE_URL}/user/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setUserId(data._id || data.id);
          } catch {}
        }
      }
    };
    fetchUserId();
  }, []);

  // Fetch moods for user
  const fetchUserMoods = async (authorId) => {
    if (!authorId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/mood/author/${authorId}`, {
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

  // Fetch moods when modal opens or after mood submit
  useEffect(() => {
    if (articleModal && userId) fetchUserMoods(userId);
  }, [articleModal, userId]);
  useEffect(() => {
    if (moodSuccess && userId) fetchUserMoods(userId);
  }, [moodSuccess, userId]);

  const renderUserMoodsGrid = () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 18 }}>
      {userMoods.map((mood, idx) => {
        const moodObj = MOODS.find(m => m.key === mood.mood) || MOODS.find(m => m.label.toLowerCase() === mood.mood.toLowerCase());
        return (
          <View key={mood._id || idx} style={{ width: '48%', backgroundColor: '#F1F3F4', borderRadius: 14, padding: 12, marginBottom: 12, alignItems: 'center', flexDirection: 'row' }}>
            <Ionicons name={moodObj?.icon || 'happy-outline'} size={22} color={moodObj?.color || '#888'} style={{ marginRight: 8 }} />
            <View>
              <ThemedText style={{ fontWeight: '700', color: moodObj?.color || '#333' }}>{moodObj?.label || mood.mood}</ThemedText>
              {mood.createdAt && <ThemedText style={{ color: '#888', fontSize: 12 }}>{new Date(mood.createdAt).toLocaleDateString()}</ThemedText>}
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderHero()}
        {renderQuickActions()}
        {renderFocusCard()}
        {renderMoodTracker()}
        {renderFeatured()}
        {renderFooter()}
      </ScrollView>
      {renderArticleModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    height: 220,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 28,
    height: '100%',
  },
  heroGreeting: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroQuote: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.13)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 24,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
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
  focusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 20,
    padding: 22,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    color: '#4CAF50',
  },
  focusTip: {
    fontSize: 15,
    color: '#222',
    marginBottom: 18,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '40%',
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  focusLongButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  focusLongButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  moodSection: {
    marginHorizontal: 5,
    marginBottom: 28,
  },
  moodTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    color: '#222',
  },
  moodRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moodButton: {
    backgroundColor: '#F1F3F4',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    color: '#333',
  },
  featuredCard: {
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 32,
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.13)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  featuredButtonText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 38,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
});
