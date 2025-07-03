import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from 'expo-router';

const { width } = Dimensions.get("window");
const API_URL = 'http://192.168.1.202:5000'; // Use your backend URL

export default function MyTherapist() {
  const colorScheme = useColorScheme();
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
    <ThemedView style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=500",
            }}
            style={styles.headerImage}
          />
          <View style={styles.overlay}>
            <ThemedText style={styles.title}>All Therapists</ThemedText>
            <View style={styles.statusBadge}>
              <ThemedText style={styles.statusText}>
                No upcoming session
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.therapistsContainer}>
          {Array.isArray(therapists) && therapists.length > 0 ? (
            therapists.map((t) => (
              <TouchableOpacity
                key={t._id || t.id}
                style={[
                  styles.therapistCard,
                  { backgroundColor: theme.surfaceVariant },
                ]}
                activeOpacity={0.85}
                onPress={() => router.push(`/chat/${t._id || t.id}`)}
              >
                <Image source={{ uri: t.profileImage || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500" }} style={styles.therapistImage} />
                <View style={styles.therapistInfo}>
                  <ThemedText
                    style={[styles.therapistName, { color: theme.text }]}
                  >
                    {t.username}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.therapistSpecialization,
                      { color: theme.text + "80" },
                    ]}
                  >
                    {t.email}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <ThemedText>No therapists found.</ThemedText>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
  card: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
    marginBottom: 16,
  },
  imageWrapper: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    bottom: 16,
    width: width * 0.8,
    alignSelf: "center",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.4)", // slightly more white
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, color: "#2196F3" }, // dark green
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  statusText: { fontSize: 15, fontWeight: "500", color: "#2196F3" }, // dark green
  therapistsContainer: { padding: 16 },
  therapistCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  therapistImage: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  therapistInfo: { flex: 1 },
  therapistName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  therapistSpecialization: { fontSize: 14 },
});
