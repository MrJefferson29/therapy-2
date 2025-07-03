import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '../hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation, onRegisterSuccess }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const accent = '#388E3C';
  const accentLight = '#A5D6A7';
  const cardBg = '#F8FFF6';
  const textColor = '#222';
  const errorColor = '#D32F2F';
  const successColor = '#388E3C';
  const styles = getRegisterStyles({ accent, accentLight, cardBg, textColor, errorColor, successColor });
  const { register, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState('');
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    const ok = await register({ username, email, password });
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onRegisterSuccess) onRegisterSuccess();
        if (navigation) navigation.navigate('Login');
      }, 1200);
    }
  };

  return (
    <LinearGradient colors={[accent, accentLight]} style={styles.background}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View style={[styles.card, {
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
          }]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="leaf" size={48} color={accent} />
            </View>
            <ThemedText style={styles.title}>Create Account</ThemedText>
            <ThemedText style={styles.subtitle}>Your journey starts here. Join our community.</ThemedText>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={focused === 'username' ? accent : accentLight + '80'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, focused === 'username' && styles.inputFocused]}
                placeholder="Username"
                placeholderTextColor={accentLight + '80'}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused('')}
              />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={focused === 'email' ? accent : accentLight + '80'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, focused === 'email' && styles.inputFocused]}
                placeholder="Email"
                placeholderTextColor={accentLight + '80'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
              />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={focused === 'password' ? accent : accentLight + '80'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, focused === 'password' && styles.inputFocused]}
                placeholder="Password"
                placeholderTextColor={accentLight + '80'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
              />
            </View>
            {error ? (
              <View style={styles.errorWrap}>
                <Ionicons name="alert-circle" size={18} color={errorColor} style={{ marginRight: 6 }} />
                <ThemedText style={styles.error}>{error}</ThemedText>
              </View>
            ) : null}
            {success ? (
              <View style={styles.successWrap}>
                <Ionicons name="checkmark-circle" size={18} color={accent} style={{ marginRight: 6 }} />
                <ThemedText style={styles.success}>Registration successful!</ThemedText>
              </View>
            ) : null}
            <Animated.View style={{ transform: [{ scale: buttonAnim }], width: '100%' }}>
              <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Register</ThemedText>}
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity onPress={() => navigation && navigation.navigate('Login')} style={styles.linkWrap}>
              <ThemedText style={styles.link}>Already have an account? Login</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function getRegisterStyles({ accent, accentLight, cardBg, textColor, errorColor, successColor }) {
  const { width } = Dimensions.get('window');
  return StyleSheet.create({
    background: {
      flex: 1,
    },
    card: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: cardBg,
      borderRadius: 28,
      padding: 28,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.10,
      shadowRadius: 18,
      elevation: 8,
    },
    iconWrap: {
      backgroundColor: accentLight,
      borderRadius: 32,
      padding: 12,
      marginBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: textColor,
      marginBottom: 6,
      marginTop: 2,
    },
    subtitle: {
      fontSize: 15,
      color: textColor + 'BB',
      marginBottom: 22,
      textAlign: 'center',
    },
    inputWrap: {
      width: '100%',
      maxWidth: 340,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: accentLight,
      paddingHorizontal: 10,
    },
    inputIcon: {
      marginRight: 6,
      color: accent,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      color: textColor,
      fontSize: 16,
    },
    inputFocused: {
      borderColor: accent,
      backgroundColor: '#F4FFF4',
    },
    button: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: accent,
      paddingVertical: 15,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 10,
      shadowColor: accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 6,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 17,
    },
    errorWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      marginTop: 2,
    },
    error: {
      color: errorColor,
      fontWeight: '700',
      fontSize: 15,
    },
    successWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      marginTop: 2,
    },
    success: {
      color: successColor,
      fontWeight: '700',
      fontSize: 15,
    },
    linkWrap: {
      marginTop: 2,
      marginBottom: 2,
    },
    link: {
      color: accent,
      fontWeight: '700',
      fontSize: 15,
      textAlign: 'center',
    },
  });
} 