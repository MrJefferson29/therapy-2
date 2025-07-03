import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MasonryList from '@react-native-seoul/masonry-list';
import { Video } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TapGestureHandler, State } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 2;

export const WELLNESS_CATEGORIES = [
  { id: '1', name: 'Meditation', icon: 'leaf' },
  { id: '2', name: 'Anxiety', icon: 'heart' },
  { id: '3', name: 'Stress Relief', icon: 'sunny' },
  { id: '4', name: 'Self-Care', icon: 'sparkles' },
  { id: '5', name: 'Sleep', icon: 'moon' },
  { id: '6', name: 'Mindfulness', icon: 'flower' },
];

// Utility: get a random subset of an array
function getRandomSubset(arr, n) {
  if (!arr || arr.length === 0) return [];
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

const getVideoThumbnail = async (videoUrl, articleId, setVideoThumbs, videoThumbs) => {
  if (videoThumbs[articleId]) return videoThumbs[articleId];
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
    setVideoThumbs(prev => ({ ...prev, [articleId]: uri }));
    return uri;
  } catch {
    return null;
  }
};

function getArticleThumbnail(article) {
  if (!article.files || article.files.length === 0) return { type: 'none', url: null };
  const imageFile = article.files.find(f => f.type === 'image');
  if (imageFile) return { type: 'image', url: imageFile.url };
  const videoFile = article.files.find(f => f.type === 'video');
  if (videoFile) return { type: 'video', url: videoFile.url };
  return { type: 'none', url: null };
}

function ArticleThumbnail({ article, style }) {
  const { type: thumbType, url: thumbUrl } = getArticleThumbnail(article);
  const videoFile = article.files && article.files.find(f => f.type === 'video');
  const [thumbUri, setThumbUri] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchThumb() {
      if (thumbType === 'video' && videoFile?.url) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoFile.url, { time: 1000 });
          if (isMounted) setThumbUri(uri);
        } catch {
          // ignore
        }
      }
    }
    fetchThumb();
    return () => { isMounted = false; };
  }, [videoFile?.url, article._id, thumbType]);

  if (thumbType === 'image' && thumbUrl) {
    return <Image source={{ uri: thumbUrl }} style={style} />;
  } else if (thumbType === 'video' && videoFile?.url) {
    return thumbUri ? (
      <Image source={{ uri: thumbUri }} style={style} />
    ) : (
      <View style={[style, { backgroundColor: '#e0ffe7', alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="videocam" size={48} color="#388E3C" />
      </View>
    );
  } else {
    return (
      <View style={[style, { backgroundColor: '#e0ffe7', alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="image" size={48} color="#388E3C" />
      </View>
    );
  }
}

// Utility: format time ago
function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Fun illustration for empty state
const EMPTY_ARTICLE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png';

function NoArticlesFound({ category }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 24 }}>
      <Image source={{ uri: EMPTY_ARTICLE_IMAGE }} style={{ width: 120, height: 120, marginBottom: 18, opacity: 0.85 }} />
      <ThemedText style={{ fontSize: 22, fontWeight: '800', color: '#388E3C', marginBottom: 6, textAlign: 'center' }}>
        No Articles Found
      </ThemedText>
      <ThemedText style={{ fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 8 }}>
        {category
          ? `Looks like there are no articles in "${category}" yet. Why not create the first one?`
          : 'No articles to display.'}
      </ThemedText>
      <Ionicons name="leaf-outline" size={38} color="#A3B18A" style={{ marginTop: 8, opacity: 0.7 }} />
    </View>
  );
}

export default function DiscoverScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [viewedArticles, setViewedArticles] = useState(new Set());
  const doubleTapRef = React.useRef();
  const [currentFileIndexes, setCurrentFileIndexes] = useState({});
  const [pausedVideos, setPausedVideos] = useState({});
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [likedArticles, setLikedArticles] = useState(new Set());

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://192.168.1.202:5000/article');
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      setArticles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const storedLikes = await AsyncStorage.getItem('likedArticles');
        if (storedLikes) setLikedArticles(new Set(JSON.parse(storedLikes)));
        const storedViews = await AsyncStorage.getItem('viewedArticles');
        if (storedViews) setViewedArticles(new Set(JSON.parse(storedViews)));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('likedArticles', JSON.stringify(Array.from(likedArticles)));
  }, [likedArticles]);

  useEffect(() => {
    AsyncStorage.setItem('viewedArticles', JSON.stringify(Array.from(viewedArticles)));
  }, [viewedArticles]);

  useEffect(() => {
    setFeaturedArticles(getRandomSubset(articles, 7));
  }, [articles]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchArticles();
  }, []);

  const gridArticles = selectedCategory
    ? articles.filter(a => {
        const cat = WELLNESS_CATEGORIES.find(c => c.id === selectedCategory)?.name;
        return (
          typeof a.category === 'string' &&
          a.category.trim().toLowerCase() === cat.trim().toLowerCase()
        );
      })
    : articles;
  const videoArticles = articles.filter(a => a.files && a.files.some(f => f.type === 'video'));

  const openMediaModal = (article) => {
    const idx = articles.findIndex(a => a._id === article._id);
    setMediaIndex(idx >= 0 ? idx : 0);
    setMediaModalVisible(true);
  };

  const renderFeaturedArticle = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredStoryContainer}
      onPress={() => openMediaModal(item)}
      activeOpacity={0.8}
    >
      <ArticleThumbnail article={item} style={styles.featuredStoryImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.featuredStoryGradient}
      >
        <ThemedText style={styles.featuredStoryTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.featuredStoryContent} numberOfLines={2}>{item.content}</ThemedText>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
    <TouchableOpacity
        style={[
          styles.categoryChip,
          !selectedCategory && styles.selectedCategoryChip,
        ]}
        onPress={() => setSelectedCategory(null)}
        activeOpacity={0.8}
      >
        <Ionicons name="apps" size={16} color={!selectedCategory ? '#FFFFFF' : '#000000'} />
        <ThemedText style={[
          styles.categoryText,
          !selectedCategory && styles.selectedCategoryText,
        ]}>All</ThemedText>
      </TouchableOpacity>
      {WELLNESS_CATEGORIES.map(item => (
        <TouchableOpacity
          key={item.id}
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.selectedCategoryChip,
      ]}
      onPress={() => setSelectedCategory(item.id)}
          activeOpacity={0.8}
    >
      <Ionicons
        name={item.icon}
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
      ))}
    </ScrollView>
  );

  const renderMasonryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.masonryItem}
      onPress={() => openMediaModal(item)}
      activeOpacity={0.8}
    >
      <ArticleThumbnail article={item} style={[styles.masonryImage, { height: COLUMN_WIDTH * 1.2 }]} />
      <BlurView
        intensity={80}
        tint="dark"
        style={styles.masonryOverlay}
      >
        <View style={styles.masonryInfo}>
          <View style={styles.masonryCategory}>
            <ThemedText style={styles.masonryCategoryText}>{item.category}</ThemedText>
          </View>
          <View style={styles.masonryStats}>
            <Ionicons name="heart" size={14} color="#FFFFFF" />
            <ThemedText style={styles.masonryStatsText}>{item.likes}</ThemedText>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const renderModalContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#388E3C" style={{ marginTop: 100 }} />;
    }
    return (
      <View style={{ width: '100%', height: Dimensions.get('window').height, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        {renderArticleFilesCarousel(articles[mediaIndex], mediaIndex)}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 20,
          backgroundColor: 'rgba(0,0,0,0.45)'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Image source={{ uri: articles[mediaIndex].user?.avatar || 'https://ui-avatars.com/api/?name=User' }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
            <ThemedText style={{ color: '#fff9', fontSize: 12 }}>{formatTimeAgo(articles[mediaIndex].createdAt)}</ThemedText>
          </View>
          <ThemedText style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
            {articles[mediaIndex].title || 'Untitled'}
          </ThemedText>
          <ThemedText style={{ color: '#fff', fontSize: 15, marginBottom: 6 }} numberOfLines={3}>
            {articles[mediaIndex].content || 'No content available.'}
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{
              backgroundColor: '#fff2',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginRight: 12
            }}>
              <ThemedText style={{ color: '#fff', fontSize: 13 }}>{articles[mediaIndex].category || 'Uncategorized'}</ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => handleLike(articles[mediaIndex]._id)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
              disabled={likedArticles.has(articles[mediaIndex]._id)}
            >
              <Ionicons name="heart" size={22} color={likedArticles.has(articles[mediaIndex]._id) ? '#E53935' : '#fff'} />
              <ThemedText style={{ color: '#fff', fontSize: 16, marginLeft: 4 }}>{articles[mediaIndex].likes}</ThemedText>
            </TouchableOpacity>
            <Ionicons name="eye" size={20} color="#fff" style={{ marginRight: 4 }} />
            <ThemedText style={{ color: '#fff', fontSize: 15 }}>{articles[mediaIndex].views}</ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
          onPress={() => setMediaModalVisible(false)}
        >
          <Ionicons name="close" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleLike = async (articleId) => {
    if (likedArticles.has(articleId)) return;
    setLikedArticles(prev => {
      const newSet = new Set(prev);
      newSet.add(articleId);
      return newSet;
    });
    setArticles(prev =>
      prev.map(a => a._id === articleId ? { ...a, likes: (a.likes || 0) + 1 } : a)
    );
    try {
      const res = await fetch(`http://192.168.1.202:5000/article/${articleId}/like`, { method: 'POST' });
      const data = await res.json();
      setArticles(prev =>
        prev.map(a => a._id === articleId ? { ...a, likes: data.likes } : a)
      );
    } catch (e) {
      // Optionally show error
    }
  };

  const handleView = async (articleId) => {
    if (viewedArticles.has(articleId)) return;
    setViewedArticles(prev => {
      const newSet = new Set(prev);
      newSet.add(articleId);
      return newSet;
    });
    setArticles(prev =>
      prev.map(a => a._id === articleId ? { ...a, views: (a.views || 0) + 1 } : a)
    );
    try {
      const res = await fetch(`http://192.168.1.202:5000/article/${articleId}/view`, { method: 'POST' });
      const data = await res.json();
      setArticles(prev =>
        prev.map(a => a._id === articleId ? { ...a, views: data.views } : a)
      );
    } catch (e) {
      // Optionally show error
    }
  };

  // Helper to render the file carousel in the modal
  function renderArticleFilesCarousel(item, articleIndex) {
    const files = item.files || [];
    const fileIndex = currentFileIndexes[item._id] || 0;
    if (files.length <= 1) {
      // Single file: just render as before
      const file = files[0];
      if (!file) return null;
      const isVideo = file.type === 'video';
      const isActive = articleIndex === currentMediaIndex && fileIndex === 0;
      const paused = pausedVideos[item._id]?.[0] ?? false;
      return (
        <TapGestureHandler
          ref={doubleTapRef}
          numberOfTaps={2}
          maxPointers={1}
          onActivated={() => handleLike(item._id)}
        >
          <View style={{ flex: 1, width: '100%', height: '100%' }}>
            {isVideo ? (
              <TouchableOpacity
                activeOpacity={1}
                style={{ flex: 1 }}
                onPress={() => {
                  setPausedVideos(prev => ({
                    ...prev,
                    [item._id]: { ...prev[item._id], 0: !paused }
                  }));
                }}
              >
                <Video
                  source={{ uri: file.url }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  isLooping
                  shouldPlay={isActive && !paused}
                  paused={paused}
                  useNativeControls={false}
                />
              </TouchableOpacity>
            ) : file.type === 'image' ? (
              <Image
                source={{ uri: file.url }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            ) : null}
          </View>
        </TapGestureHandler>
      );
    }
    // Multiple files: horizontal FlatList carousel
    return (
      <View style={{ flex: 1, width: '100%', height: '100%' }}>
        <FlatList
          data={files}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, idx) => idx.toString()}
          initialScrollIndex={fileIndex}
          getItemLayout={(_, idx) => ({ length: width, offset: width * idx, index: idx })}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentFileIndexes(prev => ({ ...prev, [item._id]: idx }));
          }}
          renderItem={({ item: file, index: idx }) => {
            const isVideo = file.type === 'video';
            const isActive = articleIndex === currentMediaIndex && idx === (currentFileIndexes[item._id] || 0);
            const paused = pausedVideos[item._id]?.[idx] ?? false;
            return (
              <TapGestureHandler
                ref={doubleTapRef}
                numberOfTaps={2}
                maxPointers={1}
                onActivated={() => handleLike(item._id)}
              >
                <View style={{ width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  {isVideo ? (
                    <TouchableOpacity
                      activeOpacity={1}
                      style={{ flex: 1, width: '100%', height: '100%' }}
                      onPress={() => {
                        setPausedVideos(prev => ({
                          ...prev,
                          [item._id]: { ...prev[item._id], [idx]: !paused }
                        }));
                      }}
                    >
                      <Video
                        source={{ uri: file.url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        isLooping
                        shouldPlay={isActive && !paused}
                        paused={paused}
                        useNativeControls={false}
                      />
                    </TouchableOpacity>
                  ) : file.type === 'image' ? (
                    <Image
                      source={{ uri: file.url }}
                      style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                    />
                  ) : null}
                </View>
              </TapGestureHandler>
            );
          }}
        />
        {/* Dots indicator */}
        <View style={{ position: 'absolute', bottom: 18, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          {files.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 3,
                backgroundColor: idx === fileIndex ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#388E3C" />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Featured Articles */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Featured Articles</ThemedText>
              {/* <TouchableOpacity>
                <ThemedText style={styles.seeAllButton}>See All</ThemedText>
              </TouchableOpacity> */}
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredArticles}
              renderItem={renderFeaturedArticle}
              keyExtractor={(item, idx) => item._id || idx.toString()}
              contentContainerStyle={styles.featuredStoriesContainer}
            />
          </View>

          {/* Category Filter Row (only one) */}
          {renderCategoryFilter()}

          {/* Wellness Grid */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {gridArticles.length === 0 ? (
              <NoArticlesFound category={selectedCategory ? WELLNESS_CATEGORIES.find(c => c.id === selectedCategory)?.name : null} />
            ) : (
          <MasonryList
            data={gridArticles}
            keyExtractor={(item, idx) => item._id || idx.toString()}
            numColumns={2}
            contentContainerStyle={styles.masonryContainer}
            renderItem={renderMasonryItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
            )}
          </ScrollView>
        </ScrollView>
      )}
      <Modal
        visible={mediaModalVisible}
        animationType="slide"
        onRequestClose={() => setMediaModalVisible(false)}
        transparent={false}
      >
        <FlatList
          data={articles}
          keyExtractor={item => item._id}
          pagingEnabled
          horizontal={false}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={mediaIndex}
          getItemLayout={(_, index) => ({
            length: Dimensions.get('window').height,
            offset: Dimensions.get('window').height * index,
            index,
          })}
          onViewableItemsChanged={React.useRef(({ viewableItems }) => {
            if (viewableItems && viewableItems.length > 0) {
              setCurrentMediaIndex(viewableItems[0].index);
              const article = articles[viewableItems[0].index];
              if (article) handleView(article._id);
            }
          }).current}
          viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
          renderItem={({ item, index }) => {
            const liked = likedArticles.has(item._id);
            return (
              <View style={{ width: '100%', height: Dimensions.get('window').height, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                {renderArticleFilesCarousel(item, index)}
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 20,
                  backgroundColor: 'rgba(0,0,0,0.45)'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Image source={{ uri: item.user?.avatar || 'https://ui-avatars.com/api/?name=User' }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
                    <ThemedText style={{ color: '#fff9', fontSize: 12 }}>{formatTimeAgo(item.createdAt)}</ThemedText>
                  </View>
                  <ThemedText style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={{ color: '#fff', fontSize: 15, marginBottom: 6 }} numberOfLines={3}>
                    {item.content}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{
                      backgroundColor: '#fff2',
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      marginRight: 12
                    }}>
                      <ThemedText style={{ color: '#fff', fontSize: 13 }}>{item.category}</ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleLike(item._id)}
                      style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
                      disabled={liked}
                    >
                      <Ionicons name="heart" size={22} color={liked ? '#E53935' : '#fff'} />
                      <ThemedText style={{ color: '#fff', fontSize: 16, marginLeft: 4 }}>{item.likes}</ThemedText>
                    </TouchableOpacity>
                    <Ionicons name="eye" size={20} color="#fff" style={{ marginRight: 4 }} />
                    <ThemedText style={{ color: '#fff', fontSize: 15 }}>{item.views}</ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
                  onPress={() => setMediaModalVisible(false)}
                >
                  <Ionicons name="close" size={36} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllButton: {
    color: '#2D6A4F',
    fontWeight: '500',
  },
  featuredStoriesContainer: {
    paddingHorizontal: 12,
    gap: 12,
  },
  featuredStoryContainer: {
    width: width * 0.8,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredStoryImage: {
    width: '100%',
    height: '100%',
  },
  featuredStoryGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredStoryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featuredStoryContent: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2FFF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedCategoryChip: {
    backgroundColor: '#2D6A4F',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  masonryContainer: {
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  masonryItem: {
    flex: 1,
    margin: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  masonryImage: {
    width: COLUMN_WIDTH,
    backgroundColor: '#F2FFF6',
  },
  masonryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  masonryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masonryCategory: {
    backgroundColor: 'rgba(45, 106, 79, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  masonryCategoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  masonryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  masonryStatsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
