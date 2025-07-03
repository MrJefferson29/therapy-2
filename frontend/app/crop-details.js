import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CROP_DETAILS } from './cropData';

const { width } = Dimensions.get('window');

export default function CropDetailsScreen() {
  const router = useRouter();
  const { cropId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const cropData = CROP_DETAILS[cropId] || CROP_DETAILS["Tomatoes"];

  const handleCultivate = () => {
    Alert.alert(
      "Start Cultivation",
      `Would you like to start cultivating ${cropData.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert(
                "Success!",
                `You've started the cultivation of ${cropData.name}. We'll help you track its progress!`,
                [{ text: "OK", onPress: () => router.back() }]
              );
            }, 1500);
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{cropData.name}</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Image */}
        <View style={styles.imageContainer}>
              <Image
            source={{ uri: cropData.images[0] }}
            style={styles.mainImage}
                resizeMode="cover"
              />
          <View style={styles.imageOverlay}>
            <ThemedText style={styles.scientificName}>{cropData.scientificName}</ThemedText>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>About</ThemedText>
            <ThemedText style={styles.description}>{cropData.description}</ThemedText>
          </View>

          {/* Quick Facts */}
          <View style={styles.quickFacts}>
            <View style={styles.factCard}>
              <Ionicons name="time" size={24} color="#1B4332" />
              <ThemedText style={styles.factLabel}>Growth Period</ThemedText>
              <ThemedText style={styles.factValue}>{cropData.growthPeriod}</ThemedText>
            </View>
            <View style={styles.factCard}>
              <Ionicons name="water" size={24} color="#1B4332" />
              <ThemedText style={styles.factLabel}>Water Needs</ThemedText>
              <ThemedText style={styles.factValue}>{cropData.waterRequirements}</ThemedText>
            </View>
            <View style={styles.factCard}>
              <Ionicons name="leaf" size={24} color="#1B4332" />
              <ThemedText style={styles.factLabel}>Soil Type</ThemedText>
              <ThemedText style={styles.factValue}>{cropData.soilType}</ThemedText>
            </View>
            <View style={styles.factCard}>
              <Ionicons name="sunny" size={24} color="#1B4332" />
              <ThemedText style={styles.factLabel}>Climate</ThemedText>
              <ThemedText style={styles.factValue}>{cropData.climate}</ThemedText>
            </View>
          </View>

          {/* Cultivation Steps */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Cultivation Guide</ThemedText>
            {cropData.cultivationSteps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText>
                </View>
                <ThemedText style={styles.stepText}>{step}</ThemedText>
              </View>
            ))}
          </View>

          {/* Varieties */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Varieties</ThemedText>
            <View style={styles.varietiesContainer}>
              {cropData.varieties.map((variety, index) => (
                <View key={index} style={styles.varietyTag}>
                  <ThemedText style={styles.varietyText}>{variety}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Nutritional Value */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Nutritional Value</ThemedText>
            <View style={styles.nutritionCard}>
              <ThemedText style={styles.nutritionText}>Calories: {cropData.nutritionalValue.calories}</ThemedText>
              <View style={styles.nutritionList}>
                <View style={styles.nutritionColumn}>
                  <ThemedText style={styles.nutritionSubtitle}>Vitamins</ThemedText>
                  {cropData.nutritionalValue.vitamins.map((vitamin, index) => (
                    <ThemedText key={index} style={styles.nutritionItem}>• {vitamin}</ThemedText>
                  ))}
                </View>
                <View style={styles.nutritionColumn}>
                  <ThemedText style={styles.nutritionSubtitle}>Minerals</ThemedText>
                  {cropData.nutritionalValue.minerals.map((mineral, index) => (
                    <ThemedText key={index} style={styles.nutritionItem}>• {mineral}</ThemedText>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Expected Yield */}
          <View style={[styles.section, styles.yieldSection]}>
            <ThemedText style={styles.sectionTitle}>Expected Yield</ThemedText>
            <View style={styles.yieldCard}>
              <Ionicons name="basket" size={24} color="#1B4332" />
              <ThemedText style={styles.yieldText}>{cropData.expectedYield}</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Cultivate Button */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.cultivateButton}
          onPress={handleCultivate}
          disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="leaf" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>Start Cultivation</ThemedText>
              </>
            )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: 200,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  scientificName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1B4332',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  quickFacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  factCard: {
    width: '48%',
    backgroundColor: '#F7F7F7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  factLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  factValue: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginTop: 4,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1B4332',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  varietiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  varietyTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  varietyText: {
    color: '#1B4332',
    fontSize: 14,
  },
  nutritionCard: {
    backgroundColor: '#F7F7F7',
    padding: 16,
    borderRadius: 12,
  },
  nutritionText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
  },
  nutritionList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionColumn: {
    flex: 1,
  },
  nutritionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B4332',
    marginBottom: 8,
  },
  nutritionItem: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  yieldSection: {
    marginBottom: 80,
  },
  yieldCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  yieldText: {
    fontSize: 16,
    color: '#1B4332',
    marginLeft: 12,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cultivateButton: {
    backgroundColor: '#1B4332',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
