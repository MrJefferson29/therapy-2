import { 
  StyleSheet, 
  ScrollView, 
  View, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Platform,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useState, useRef } from "react";
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

const POSTS = [
  {
    id: 1,
    user: {
      name: "Green Valley Farm",
      avatar: "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=200",
      verified: true
    },
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    description: "Morning harvest looking amazing! 🌾 \n\nSwipe to see the irrigation system we installed last week. The results are incredible!",
    location: "Kansas, USA",
    likes: 1234,
    comments: 89,
    tags: ["#Farming", "#OrganicFarming", "#Agriculture"],
    timeAgo: "2h"
  },
  {
    id: 2,
    user: {
      name: "TechFarm Solutions",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200",
      verified: true
    },
    image: "https://images.unsplash.com/photo-1576594496020-534bf2437b21?w=800",
    description: "New drone technology helping us monitor crop health! Check out these amazing aerial views 🚀",
    location: "California, USA",
    likes: 892,
    comments: 156,
    tags: ["#AgTech", "#Innovation", "#Drones"],
    timeAgo: "4h"
  },
  // Add more posts as needed
];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('following');
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerTabs}>
          <TouchableOpacity 
            style={[styles.headerTab, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <ThemedText style={[
              styles.headerTabText,
              activeTab === 'following' && styles.activeTabText
            ]}>Following</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerTab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => router.push('/discover')}
          >
            <ThemedText style={[
              styles.headerTabText,
              activeTab === 'discover' && styles.activeTabText
            ]}>Discover</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Stories Section */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.storiesContainer}
        contentContainerStyle={styles.storiesContent}
      >
        {/* Add Story Button */}
        <View style={styles.storyItem}>
          <TouchableOpacity style={styles.addStoryButton}>
            <LinearGradient
              colors={['#BBECCA', '#F2FFF6']}
              style={styles.storyGradient}
            >
              <Ionicons name="add" size={24} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
          <ThemedText style={styles.storyUsername}>Add Story</ThemedText>
        </View>
        
        {/* Story Items */}
        {POSTS.map(post => (
          <View key={post.id} style={styles.storyItem}>
            <TouchableOpacity style={styles.storyRing}>
              <LinearGradient
                colors={['#BBECCA', '#F2FFF6']}
                style={styles.storyGradient}
              >
                <Image source={{ uri: post.user.avatar }} style={styles.storyAvatar} />
              </LinearGradient>
            </TouchableOpacity>
            <ThemedText style={styles.storyUsername} numberOfLines={1}>
              {post.user.name}
            </ThemedText>
          </View>
        ))}
      </ScrollView>

      {/* Posts Feed */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {POSTS.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

// PostCard Component
function PostCard({ post }) {
  return (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
          <View>
            <View style={styles.nameRow}>
              <ThemedText style={styles.username}>{post.user.name}</ThemedText>
              {post.user.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#BBECCA" />
              )}
            </View>
            {post.location && (
              <ThemedText style={styles.location}>{post.location}</ThemedText>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      <Image source={{ uri: post.image }} style={styles.postImage} />

      {/* Post Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.contentContainer}>
        <ThemedText style={styles.likes}>
          {post.likes.toLocaleString()} likes
        </ThemedText>
        <View style={styles.captionContainer}>
          <ThemedText style={styles.caption}>
            <ThemedText style={styles.username}>{post.user.name}</ThemedText>
            {" "}{post.description}
          </ThemedText>
        </View>
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <TouchableOpacity key={index}>
              <ThemedText style={styles.tag}>{tag}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity>
          <ThemedText style={styles.comments}>
            View all {post.comments} comments
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.timeAgo}>{post.timeAgo}</ThemedText>
      </View>
    </View>
  );
}

function SwipeIndicator({ direction, visible }) {
  return (
    <Animated.View
      style={[
        styles.swipeIndicator,
        {
          opacity: visible ? 1 : 0,
          left: direction === 'left' ? 20 : undefined,
          right: direction === 'right' ? 20 : undefined,
        },
      ]}
    >
      <Ionicons
        name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={24}
        color={COLORS.primaryGreen}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2FFF6',
    backgroundColor: '#FFFFFF',
  },
  headerTabs: {
    flexDirection: 'row',
    gap: 20,
  },
  headerTab: {
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#BBECCA',
  },
  headerTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#F2FFF6',
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BBECCA',
  },
  storiesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2FFF6',
  },
  storiesContent: {
    padding: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  addStoryButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 4,
    overflow: 'hidden',
  },
  storyGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 4,
    overflow: 'hidden',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyUsername: {
    fontSize: 12,
    textAlign: 'center',
  },
  postContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2FFF6',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 4,
  },
  postImage: {
    width: '100%',
    height: width,
    backgroundColor: '#F2FFF6',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  contentContainer: {
    paddingHorizontal: 12,
    gap: 6,
  },
  likes: {
    fontWeight: '600',
  },
  captionContainer: {
    paddingRight: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    color: '#0095F6',
    fontWeight: '500',
  },
  comments: {
    color: '#666',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1000,
  },
});
