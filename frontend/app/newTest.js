import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CROP_DETAILS } from './cropData';

const { width } = Dimensions.get('window');

// Test data for demonstration
const SAMPLE_RESULTS = {
  npk: {
    nitrogen: 45,
    phosphorus: 25,
    potassium: 90,
  },
  recommendations: [
    {
      name: 'Tomatoes',
      confidence: 92,
      requirements: {
        sunlight: 'Full Sun',
        water: 'Moderate',
        season: 'Spring-Summer',
      },
      description: 'Ideal NPK ratio match. The soil composition suggests excellent conditions for tomato growth.',
    },
    {
      name: 'Bell Peppers',
      confidence: 87,
      requirements: {
        sunlight: 'Full Sun',
        water: 'Moderate',
        season: 'Spring-Summer',
      },
      description: 'Good nitrogen levels for leaf development. Phosphorus levels support fruit production.',
    },
    {
      name: 'Lettuce',
      confidence: 78,
      requirements: {
        sunlight: 'Partial Shade',
        water: 'Regular',
        season: 'Spring-Fall',
      },
      description: 'Suitable nitrogen levels for leafy growth. Consider additional potassium supplementation.',
    },
    {
      name: 'Carrots',
      confidence: 75,
      requirements: {
        sunlight: 'Full Sun',
        water: 'Moderate',
        season: 'Spring-Fall',
      },
      description: 'Phosphorus levels good for root development. May benefit from nitrogen management.',
    },
  ]
};

export default function NewTest() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const requestPermissions = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera and photo library permissions to use this feature.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (!(await requestPermissions())) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImages(prev => [...prev, result.assets[0]]);
        setShowImagePicker(false);
        analyzeImage();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImages = async () => {
    if (!(await requestPermissions())) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        setImages(prev => [...prev, ...result.assets]);
        setShowImagePicker(false);
        analyzeImage();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeImage = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Simulate API call delay
      setTimeout(() => {
        setResults(SAMPLE_RESULTS);
        setError(null);
        setAnalyzing(false);
      }, 2000);
    } catch (error) {
      setError('An error occurred while analyzing the image. Please try again.');
      setResults(null);
      setAnalyzing(false);
    }
  };

  const renderNPKCard = (label, value, color, icon) => (
    <View style={styles.npkCard}>
      <LinearGradient
        colors={[color, '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.npkGradient}
      >
        <View style={styles.npkIconContainer}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <ThemedText style={styles.npkLabel}>{label}</ThemedText>
        <View style={styles.npkValueContainer}>
          <ThemedText style={styles.npkValue}>{value}</ThemedText>
          <ThemedText style={styles.npkUnit}>mg/kg</ThemedText>
        </View>
      </LinearGradient>
    </View>
  );

  // Add navigation to crop details
  const handleCropPress = (cropName) => {
    console.log('Navigating to crop:', cropName);
    console.log('Available crops:', Object.keys(CROP_DETAILS));
    router.push({
      pathname: "/crop-details",
      params: { cropId: cropName }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Soil Analysis</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Section */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.subtitle}>
            Upload a soil image for AI-powered crop recommendations
          </ThemedText>
        </View>

        {/* Image Upload Section */}
        <View style={styles.uploadSection}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageScrollContainer}
            >
              {images.map((img, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: img.uri }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity
                  style={styles.addMoreButton}
                  onPress={() => setShowImagePicker(true)}
                >
                  <Ionicons name="add-circle" size={32} color="#BBECCA" />
                  <ThemedText style={styles.addMoreText}>Add More</ThemedText>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <TouchableOpacity 
              style={styles.uploadPlaceholder}
              onPress={() => setShowImagePicker(true)}
            >
              <View style={styles.uploadIconContainer}>
                <Ionicons name="images" size={32} color="#BBECCA" />
              </View>
              <ThemedText style={styles.uploadText}>
                Tap to add soil images
              </ThemedText>
              <ThemedText style={styles.uploadSubtext}>
                Take a photo or select from gallery
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Image Picker Modal */}
        <Modal
          visible={showImagePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowImagePicker(false)}
          >
            <BlurView intensity={80} style={styles.modalContent}>
              <View style={styles.pickerOptions}>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={takePhoto}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="camera" size={28} color="#BBECCA" />
                  </View>
                  <ThemedText style={styles.optionText}>Take Photo</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={pickImages}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="images" size={28} color="#BBECCA" />
                  </View>
                  <ThemedText style={styles.optionText}>Choose from Gallery</ThemedText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowImagePicker(false)}
              >
                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
              </TouchableOpacity>
            </BlurView>
          </TouchableOpacity>
        </Modal>

        {analyzing && (
          <View style={styles.analyzingContainer}>
            <BlurView intensity={80} style={styles.analyzingContent}>
              <ActivityIndicator color="#BBECCA" size="large" />
              <ThemedText style={styles.analyzingText}>
                Analyzing soil composition...
              </ThemedText>
            </BlurView>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <BlurView intensity={80} style={styles.errorContent}>
              <Ionicons name="alert-circle" size={32} color="#FF3B30" />
              <ThemedText style={styles.errorText}>
                {error}
              </ThemedText>
            </BlurView>
          </View>
        )}

        {results && !error && (
          <>
            {/* NPK Values */}
            <View style={styles.npkContainer}>
              {renderNPKCard('Nitrogen .', results.npk.nitrogen, '#BBECCA', 'flask')}
              {renderNPKCard('Phosphorus', results.npk.phosphorus, '#A8E6CF', 'water')}
              {renderNPKCard('Potassium', results.npk.potassium, '#FFD3B6', 'leaf')}
            </View>

            {/* Recommendations */}
            <View style={styles.recommendationsContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="leaf" size={24} color="#BBECCA" />
                <ThemedText style={styles.recommendationsTitle}>
                  Recommended Crops
                </ThemedText>
              </View>
              
              {results.recommendations.map((crop, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.cropCard,
                    index === results.recommendations.length - 1 && styles.lastCropCard
                  ]}
                  onPress={() => handleCropPress(crop.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cropHeader}>
                    <View>
                      <ThemedText style={styles.cropName}>
                        {crop.name}
                      </ThemedText>
                      <View style={styles.confidenceContainer}>
                        <Ionicons name="analytics" size={14} color="#666" />
                        <ThemedText style={styles.confidenceText}>
                          {crop.confidence}% Match
                        </ThemedText>
                      </View>
                    </View>
                    <LinearGradient
                      colors={['#BBECCA', '#F2FFF6']}
                      style={styles.confidenceBadge}
                    >
                      <ThemedText style={styles.confidenceValue}>
                        {crop.confidence}%
                      </ThemedText>
                    </LinearGradient>
                  </View>

                  <ThemedText style={styles.cropDescription}>
                    {crop.description}
                  </ThemedText>

                  <View style={styles.requirementsContainer}>
                    <View style={styles.requirementItem}>
                      <Ionicons name="sunny" size={16} color="#666" />
                      <ThemedText style={styles.requirementText}>
                        {crop.requirements.sunlight}
                      </ThemedText>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons name="water" size={16} color="#666" />
                      <ThemedText style={styles.requirementText}>
                        {crop.requirements.water}
                      </ThemedText>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <ThemedText style={styles.requirementText}>
                        {crop.requirements.season}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2FFF6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F2FFF6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  infoSection: {
    padding: 16,
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  uploadSection: {
    margin: 16,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F2FFF6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageScrollContainer: {
    padding: 12,
    gap: 12,
  },
  imageContainer: {
    width: 150,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addMoreButton: {
    width: 150,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F2FFF6',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  pickerOptions: {
    padding: 20,
    gap: 16,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2FFF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F2FFF6',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  analyzingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  analyzingContent: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  npkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  npkCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  npkGradient: {
    padding: 16,
    alignItems: 'center',
  },
  npkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  npkLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  npkValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  npkValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  npkUnit: {
    fontSize: 12,
    color: '#666',
  },
  recommendationsContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  lastCropCard: {
    marginBottom: 0,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cropDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  requirementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F2FFF6',
    borderRadius: 12,
    padding: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requirementText: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  errorContent: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: '500',
  },
});
