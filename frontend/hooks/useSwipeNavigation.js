import { useRef, useCallback } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import { useRouter } from "expo-router";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2; // Reduced threshold for easier swipes
const SWIPE_VELOCITY_THRESHOLD = 0.5; // Reduced velocity threshold

export function useSwipeNavigation(currentScreen) {
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);

  const navigateToScreen = useCallback((targetScreen) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    Animated.spring(pan, {
      toValue: { 
        x: targetScreen === 'discover' ? -SCREEN_WIDTH : SCREEN_WIDTH,
        y: 0 
      },
      useNativeDriver: true,
      stiffness: 1000,
      damping: 500,
      mass: 3,
      overshootClamping: true,
    }).start(() => {
      isAnimating.current = false;
      pan.setValue({ x: 0, y: 0 });
      router.replace(targetScreen === 'discover' ? '/(tabs)/discover' : '/(tabs)/community');
    });
  }, [router]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy * 1.5) && Math.abs(dx) > 5;
      },
      onPanResponderGrant: () => {
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit the drag distance
        const dx = Math.max(Math.min(gestureState.dx, SCREEN_WIDTH), -SCREEN_WIDTH);
        pan.x.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        
        if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD) {
          if (currentScreen === 'community' && (dx < 0 || vx < -SWIPE_VELOCITY_THRESHOLD)) {
            navigateToScreen('discover');
          } else if (currentScreen === 'discover' && (dx > 0 || vx > SWIPE_VELOCITY_THRESHOLD)) {
            navigateToScreen('community');
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              stiffness: 1000,
              damping: 500,
              mass: 3,
            }).start();
          }
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            stiffness: 1000,
            damping: 500,
            mass: 3,
          }).start();
        }
      },
    })
  ).current;

  return {
    pan,
    panResponder,
    animatedStyle: {
      transform: [{
        translateX: pan.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          extrapolate: 'clamp',
        }),
      }],
    },
  };
}
