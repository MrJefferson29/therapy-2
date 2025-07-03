import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import journalApi from '@/services/journalApi';

const { width } = Dimensions.get('window');

const PAPER_BG = '#F8F7F4';
const CARD_BG = '#FCFBF7';
const ACCENT = '#A3B18A';
const ACCENT_SOFT = '#DAD7CD';
const FAVORITE = '#FFD166';

// Frontend mood configuration with mapping to backend numeric values
const MOODS = [
  { key: 'great', label: 'Great', icon: 'happy', color: '#A3B18A', value: 1 },
  { key: 'good', label: 'Good', icon: 'happy-outline', color: '#B5C99A', value: 2 },
  { key: 'neutral', label: 'Okay', icon: 'remove-circle-outline', color: '#E9C46A', value: 3 },
  { key: 'low', label: 'Low', icon: 'sad-outline', color: '#F4A261', value: 4 },
  { key: 'bad', label: 'Bad', icon: 'sad', color: '#E76F51', value: 5 },
];

const EMPTY_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png';
const TEXTURE_IMAGE = 'https://www.transparenttextures.com/patterns/paper-fibers.png';

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [isWriting, setIsWriting] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entries, setEntries] = useState([]);
  const [viewEntry, setViewEntry] = useState(null);
  const [filterMood, setFilterMood] = useState(null);
  const [search, setSearch] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [modalFavorite, setModalFavorite] = useState(false);
  const [headerY] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load journal entries on component mount
  useEffect(() => {
    loadJournalEntries();
  }, []);

  // Load journal entries from API
  const loadJournalEntries = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterMood) {
        const moodObj = MOODS.find(m => m.key === filterMood);
        if (moodObj) filters.mood = moodObj.value;
      }
      if (search) filters.search = search;
      filters.sort = 'favorite'; // Show favorites first

      const response = await journalApi.getAllJournals(filters);
      setEntries(response.data || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      if (error.message === 'Invalid token' || error.message === 'No token provided') {
        Alert.alert(
          'Authentication Required',
          'Please log in to access your journal entries.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load journal entries. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new journal entry
  const createJournalEntry = async () => {
    if (!entryTitle.trim() || !entryContent.trim() || !selectedMood) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);
      const moodObj = MOODS.find(m => m.key === selectedMood);
      const entryData = {
        title: entryTitle.trim(),
        note: entryContent.trim(), // Backend expects 'note' field
        mood: moodObj.value, // Send numeric value to backend
        favorite: favorite,
      };

      const response = await journalApi.createJournal(entryData);
      
      // Add new entry to the beginning of the list
      setEntries([response.data, ...entries]);
      
      // Reset form
      setIsWriting(false);
      setEntryTitle('');
      setEntryContent('');
      setSelectedMood(null);
      setFavorite(false);
      
      Alert.alert('Success', 'Journal entry created successfully!');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      if (error.message === 'Invalid token' || error.message === 'No token provided') {
        Alert.alert(
          'Authentication Required',
          'Please log in to create journal entries.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to create journal entry. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (entryId, currentFavorite) => {
    try {
      const response = await journalApi.toggleFavorite(entryId);
      
      // Update the entry in the local state
      setEntries(entries.map(entry => 
        entry._id === entryId 
          ? { ...entry, favorite: response.data.favorite }
          : entry
      ));
      
      // Update modal favorite if viewing this entry
      if (viewEntry && viewEntry._id === entryId) {
        setModalFavorite(response.data.favorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status. Please try again.');
    }
  };

  // Delete journal entry
  const deleteJournalEntry = async (entryId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await journalApi.deleteJournal(entryId);
              
              // Remove entry from local state
              setEntries(entries.filter(entry => entry._id !== entryId));
              
              // Close modal if viewing the deleted entry
              if (viewEntry && viewEntry._id === entryId) {
                setViewEntry(null);
              }
              
              Alert.alert('Success', 'Journal entry deleted successfully!');
            } catch (error) {
              console.error('Error deleting journal entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadJournalEntries();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filterMood, search]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get mood object from backend numeric value
  const getMoodFromValue = (moodValue) => {
    return MOODS.find(m => m.value === moodValue) || MOODS[2]; // Default to neutral
  };

  // --- UI RENDERING ---

  // Glassy Floating Header
  const renderHeader = () => (
    <BlurView intensity={60} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.headerBlur}>
      <View style={styles.headerWrap}>
        <Ionicons name="book-outline" size={28} color={ACCENT} style={{ marginRight: 12 }} />
        <View>
          <ThemedText style={styles.headerTitle}>Notebook</ThemedText>
          <ThemedText style={styles.headerDate}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</ThemedText>
        </View>
      </View>
    </BlurView>
  );

  // Search Bar
  const renderSearchBar = () => (
    <View style={styles.searchBarWrap}>
      <Ionicons name="search" size={20} color={ACCENT} style={{ marginRight: 8 }} />
      <TextInput
        style={styles.searchBarInput}
        placeholder="Search notes..."
        placeholderTextColor={'#AAA'}
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={() => setSearch('')}>
          <Ionicons name="close-circle" size={18} color={'#AAA'} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Mood Filter Row
  const renderMoodFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
      <TouchableOpacity
        style={[styles.moodPill, !filterMood && styles.moodPillActive]}
        onPress={() => setFilterMood(null)}
        activeOpacity={0.8}
      >
        <Ionicons name="apps" size={18} color={ACCENT} />
        <ThemedText style={styles.moodPillLabel}>All</ThemedText>
      </TouchableOpacity>
      {MOODS.map((mood) => (
        <TouchableOpacity
          key={mood.key}
          style={[styles.moodPill, filterMood === mood.key && { backgroundColor: mood.color + '33', borderColor: mood.color }]}
          onPress={() => setFilterMood(mood.key)}
          activeOpacity={0.8}
        >
          <Ionicons name={mood.icon} size={18} color={mood.color} />
          <ThemedText style={styles.moodPillLabel}>{mood.label}</ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Entry Card
  const renderEntryCard = (entry) => {
    const mood = getMoodFromValue(entry.mood);
    return (
      <Animated.View key={entry._id} style={styles.entryCardWrap}>
        <TouchableOpacity
          style={styles.entryCard}
          activeOpacity={0.93}
          onPress={() => {
            setViewEntry(entry);
            setModalFavorite(!!entry.favorite);
          }}
        >
          <View style={styles.entryCardTopRow}>
            <View style={[styles.moodBadge, { backgroundColor: mood.color + '22' }] }>
              <Ionicons name={mood.icon} size={14} color={mood.color} style={styles.moodBadgeIcon} />
              <ThemedText style={styles.moodBadgeLabel}>{mood.label}</ThemedText>
            </View>
            <ThemedText style={styles.entryDate}>{formatDate(entry.createdAt)}</ThemedText>
          </View>
          <ThemedText style={styles.entryTitle}>{entry.title}</ThemedText>
          <ThemedText style={styles.entryContent} numberOfLines={3}>{entry.note}</ThemedText>
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => toggleFavorite(entry._id, entry.favorite)}
            activeOpacity={0.7}
          >
            <Ionicons name={entry.favorite ? 'star' : 'star-outline'} size={20} color={FAVORITE} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Feed
  const renderFeed = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <ThemedText style={styles.loadingText}>Loading your notes...</ThemedText>
        </View>
      );
    }

    if (entries.length === 0) return renderEmptyState();
    
    return (
      <View style={styles.feedWrap}>
        {entries.map(renderEntryCard)}
      </View>
    );
  };

  // Empty State
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image source={{ uri: EMPTY_IMAGE }} style={styles.emptyStateImage} />
      <ThemedText style={styles.emptyStateTitle}>No Notes Yet</ThemedText>
      <ThemedText style={styles.emptyStateText}>Start your first note and capture your thoughts, feelings, and ideas.</ThemedText>
      <TouchableOpacity style={styles.emptyStateBtn} onPress={() => setIsWriting(true)} activeOpacity={0.85}>
        <ThemedText style={styles.emptyStateBtnText}>New Note</ThemedText>
      </TouchableOpacity>
    </View>
  );

  // FAB
  const renderFAB = () => (
    <TouchableOpacity
      style={styles.fab}
      activeOpacity={0.85}
      onPress={() => {
        setIsWriting(true);
        setFavorite(false);
      }}
    >
      <BlurView intensity={40} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <Ionicons name="pencil" size={26} color={ACCENT} />
    </TouchableOpacity>
  );

  // New Entry Modal
  const renderNewEntryModal = () => (
    <Modal visible={isWriting} animationType="fade" transparent>
      <BlurView intensity={30} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.modalBlur}>
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>New Note</ThemedText>
              <TouchableOpacity onPress={() => setIsWriting(false)}>
                <Ionicons name="close" size={24} color={ACCENT} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.key}
                  style={[styles.moodSelectChip, selectedMood === mood.key && { backgroundColor: mood.color + '33', borderColor: mood.color }]}
                  onPress={() => setSelectedMood(mood.key)}
                >
                  <Ionicons name={mood.icon} size={18} color={mood.color} />
                  <ThemedText style={styles.moodSelectLabel}>{mood.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor={'#888'}
              value={entryTitle}
              onChangeText={setEntryTitle}
              maxLength={60}
            />
            <TextInput
              style={styles.modalTextarea}
              placeholder="Write your note..."
              placeholderTextColor={'#888'}
              multiline
              value={entryContent}
              onChangeText={setEntryContent}
              maxLength={2000}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.favoriteBtn}
                onPress={() => setFavorite(f => !f)}
                activeOpacity={0.7}
              >
                <Ionicons name={favorite ? 'star' : 'star-outline'} size={22} color={FAVORITE} />
                <ThemedText style={styles.favoriteLabel}>Favorite</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!(entryTitle && entryContent && selectedMood) || saving) && { opacity: 0.5 }]}
                disabled={!(entryTitle && entryContent && selectedMood) || saving}
                onPress={createJournalEntry}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.saveBtnText}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );

  // View Entry Modal
  const renderViewEntryModal = () => {
    if (!viewEntry) return null;
    const mood = getMoodFromValue(viewEntry.mood);
    return (
      <Modal visible animationType="fade" transparent>
        <BlurView intensity={30} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.modalBlur}>
          <View style={styles.modalOverlay}>
            <Animated.View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={mood.icon} size={18} color={mood.color} style={{ marginRight: 8 }} />
                  <ThemedText style={styles.modalTitle}>{viewEntry.title}</ThemedText>
                </View>
                <TouchableOpacity onPress={() => setViewEntry(null)}>
                  <Ionicons name="close" size={24} color={ACCENT} />
                </TouchableOpacity>
              </View>
              <ThemedText style={styles.modalDate}>{formatDate(viewEntry.createdAt)}</ThemedText>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
                <ThemedText style={styles.modalContentText}>{viewEntry.note}</ThemedText>
              </ScrollView>
              <View style={styles.modalRow}>
                <TouchableOpacity
                  style={styles.favoriteBtn}
                  onPress={() => toggleFavorite(viewEntry._id, viewEntry.favorite)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={viewEntry.favorite ? 'star' : 'star-outline'} size={22} color={FAVORITE} />
                  <ThemedText style={styles.favoriteLabel}>Favorite</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteJournalEntry(viewEntry._id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#E76F51" />
                  <ThemedText style={styles.deleteBtnText}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </BlurView>
      </Modal>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Image source={{ uri: TEXTURE_IMAGE }} style={styles.bgTexture} />
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderSearchBar()}
        {renderMoodFilter()}
        {renderFeed()}
      </ScrollView>
      {renderFAB()}
      {renderNewEntryModal()}
      {renderViewEntryModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
    backgroundColor: PAPER_BG,
  },
  bgTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.13,
    zIndex: 0,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    elevation: 8,
  },
  headerWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 18,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  headerDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
      marginTop: 2,
    },
  searchBarWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 22,
    marginTop: 110,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
    zIndex: 11,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    backgroundColor: 'transparent',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  moodRow: {
    flexDirection: 'row',
      alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
    gap: 8,
  },
  moodPill: {
      flexDirection: 'row',
      alignItems: 'center',
    backgroundColor: ACCENT_SOFT,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodPillActive: {
    backgroundColor: '#fff',
    borderColor: ACCENT,
  },
  moodPillLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 7,
    color: ACCENT,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
  },
  loadingText: {
      fontSize: 16,
    color: ACCENT,
    marginTop: 12,
    fontWeight: '600',
  },
  feedWrap: {
    paddingHorizontal: 12,
    marginTop: 6,
    zIndex: 1,
  },
  entryCardWrap: {
      marginBottom: 18,
    borderRadius: 18,
      shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  entryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: ACCENT_SOFT,
    minHeight: 90,
    zIndex: 1,
  },
  entryCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    marginBottom: 8,
    },
    moodBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    backgroundColor: ACCENT_SOFT,
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 9,
    marginRight: 8,
    },
    moodBadgeIcon: {
    marginRight: 3,
    },
    moodBadgeLabel: {
      fontWeight: '700',
    color: ACCENT,
    fontSize: 13,
    },
  entryDate: {
      fontSize: 12,
    color: '#AAA',
    fontWeight: '600',
    },
  entryTitle: {
      fontSize: 18,
    fontWeight: '800',
    color: '#222',
      marginBottom: 2,
      marginTop: 2,
      letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    },
  entryContent: {
      fontSize: 15,
    color: '#444',
      lineHeight: 22,
      maxHeight: 66,
      overflow: 'hidden',
      marginTop: 2,
    },
  favoriteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
      backgroundColor: 'transparent',
      borderRadius: 16,
    padding: 4,
  },
  favoriteLabel: {
    color: FAVORITE,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
    emptyStateContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    marginTop: 120,
      paddingHorizontal: 20,
    },
    emptyStateImage: {
      width: 120,
      height: 120,
      marginBottom: 18,
      resizeMode: 'contain',
      opacity: 0.85,
    },
    emptyStateTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: ACCENT,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: 15,
    color: '#888',
      textAlign: 'center',
    },
    emptyStateBtn: {
      marginTop: 18,
      borderRadius: 16,
      overflow: 'hidden',
    backgroundColor: ACCENT,
      paddingVertical: 14,
      paddingHorizontal: 36,
      alignItems: 'center',
      justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    },
    emptyStateBtnText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 16,
      letterSpacing: 0.2,
    },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 80,
    backgroundColor: '#fff',
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    zIndex: 20,
    borderWidth: 2,
    borderColor: ACCENT_SOFT,
  },
  modalBlur: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#fff',
    padding: 28,
    minHeight: 420,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ACCENT,
  },
  moodScroll: {
    marginBottom: 18,
  },
  moodSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: ACCENT_SOFT,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  moodSelectLabel: {
    fontWeight: '700',
    marginLeft: 8,
    color: ACCENT,
    fontSize: 15,
  },
  modalInput: {
    fontSize: 18,
    color: '#222',
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT_SOFT,
    paddingBottom: 10,
    marginBottom: 18,
    backgroundColor: 'transparent',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  modalTextarea: {
    fontSize: 16,
    color: '#222',
    borderWidth: 1,
    borderColor: ACCENT_SOFT,
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAF7',
    marginBottom: 18,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  modalDate: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginBottom: 10,
  },
  modalContentText: {
    fontSize: 16,
    color: '#222',
    lineHeight: 23,
    marginBottom: 18,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_SOFT,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  deleteBtnText: {
    color: '#E76F51',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
    },
  });