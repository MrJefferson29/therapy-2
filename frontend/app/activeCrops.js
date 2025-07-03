import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Platform, 
  Animated, 
  Pressable 
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { ACTIVE_CROPS_DATA } from './activeCropsData';
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React, { useCallback } from 'react';

function AnimatedCropCard({ crop, onPress }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const animatedScale = new Animated.Value(1);
  const animatedShadow = new Animated.Value(3);

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(animatedShadow, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(animatedShadow, {
        toValue: 3,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.cardWrapper,
        pressed && styles.cardPressed,
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: animatedScale }],
            shadowOpacity: animatedShadow.interpolate({
              inputRange: [1, 3],
              outputRange: [0.1, 0.2],
            }),
            backgroundColor: theme.surfaceVariant,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
            <Ionicons name={crop.icon} size={30} color={theme.primary} />
          </View>
          <ThemedText style={styles.cropName}>{crop.name}</ThemedText>
        </View>
        
        <View style={styles.infoContainer}>
          <InfoItem label="Stage" value={crop.stage} />
          <InfoItem label="Days Left" value={`${crop.daysLeft}d`} />
          <InfoItem label="Health" value={crop.health} />
          <InfoItem label="Temp" value={crop.temp} />
          <InfoItem label="Humidity" value={crop.humidity} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function InfoItem({ label, value }) {
  return (
    <View style={styles.infoItem}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

export default function ActiveCrops() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  
  const handleCropPress = (cropId) => {
    router.push(`/activeCropDetails/${cropId}`);
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerText}>
          Active Cultivations
        </ThemedText>
        <ThemedText style={[styles.viewAllText, { color: theme.primary }]}>
          View all
        </ThemedText>
      </ThemedView>

      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {ACTIVE_CROPS_DATA.map((crop) => (
          <AnimatedCropCard
            key={crop.id}
            crop={crop}
            onPress={() => handleCropPress(crop.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  headerText: {
    fontSize: 17,
    fontWeight: "bold",
  },
  viewAllText: {
    fontSize: 17,
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  cardWrapper: {
    marginRight: 15,
  },
  cardPressed: {
    opacity: 1,
  },
  card: {
    width: 200,
    height: 255,
    borderRadius: 15,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  cropName: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-around",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
  },
});
