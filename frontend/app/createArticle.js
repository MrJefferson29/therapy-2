import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const API_URL = 'http://192.168.1.202:5000/article';

export default function CreateArticle() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState([]); // { uri, type, name }
  const [loading, setLoading] = useState(false);

  const pickFiles = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      let picked = result.assets || [result];
      setFiles([
        ...files,
        ...picked.map(f => ({
          uri: f.uri,
          type: f.type === 'video' ? 'video/mp4' : 'image/jpeg',
          name: f.fileName || f.uri.split('/').pop(),
        }))
      ]);
    }
  };

  const removeFile = idx => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title || !content || !category) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    setLoading(true);
    try {
      let form = new FormData();
      form.append('title', title);
      form.append('content', content);
      form.append('category', category);
      files.forEach((file, i) => {
        form.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name || `file${i}`,
        });
      });
      const res = await fetch(API_URL, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create article');
      Alert.alert('Success', 'Article created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#e0ffe7", "#f2fff6"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1B4332" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Article</Text>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Content"
          value={content}
          onChangeText={setContent}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
        />
        <View style={styles.fileRow}>
          <Text style={styles.label}>Files (images/videos):</Text>
          <TouchableOpacity style={styles.addBtn} onPress={pickFiles}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {files.map((file, idx) => (
            <View key={idx} style={styles.fileThumbWrap}>
              {file.type.startsWith('image') ? (
                <Image source={{ uri: file.uri }} style={styles.fileThumb} />
              ) : (
                <View style={styles.fileThumbVideo}><Ionicons name="videocam" size={32} color="#388E3C" /></View>
              )}
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFile(idx)}>
                <Ionicons name="close-circle" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit</Text>}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 48,
    alignItems: 'stretch',
  },
  backBtn: {
    position: 'absolute',
    top: 32,
    left: 16,
    zIndex: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 24,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBECCA',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: '#1B4332',
    fontWeight: '600',
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#388E3C',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  fileThumbWrap: {
    marginRight: 12,
    position: 'relative',
  },
  fileThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  fileThumbVideo: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#e0ffe7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  submitBtn: {
    backgroundColor: '#388E3C',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    elevation: 2,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
}); 