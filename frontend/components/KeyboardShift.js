import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KeyboardShift({ children, inputFocused }) {
  const [shift] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow);
    const keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide);
    return () => {
      keyboardDidShowSub.remove();
      keyboardDidHideSub.remove();
    };
  }, [inputFocused]);

  useEffect(() => {
    if (!inputFocused) {
      Animated.timing(shift, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [inputFocused]);

  const handleKeyboardDidShow = () => {
    if (!inputFocused) return;
    const { height: windowHeight } = Dimensions.get('window');
    const currentlyFocusedInput = TextInput.State.currentlyFocusedInput?.();
    if (!currentlyFocusedInput) return;
    currentlyFocusedInput.measure?.((x, y, width, height, pageX, pageY) => {
      const keyboardHeight = windowHeight - (y + height);
      if (keyboardHeight < 0) {
        Animated.timing(shift, {
          toValue: keyboardHeight - insets.bottom,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const handleKeyboardDidHide = () => {
    Animated.timing(shift, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={{ flex: 1 }}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: shift }] }]}> 
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 