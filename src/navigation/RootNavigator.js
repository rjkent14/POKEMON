// File: src/navigation/RootNavigator.js
// REPLACE YOUR ENTIRE FILE WITH THIS CODE

import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Animated } from 'react-native';

// Import your existing screens
import LoginScreen from '../screen/LoginScreen';
import SignupScreen from '../screen/SignupScreen';
import HomeScreen from '../screen/HomeScreen';
import ProfileScreen from '../screen/ProfileScreen';

// Import new screens (Requirements 3-5)
import HuntScreen from '../screen/HuntScreen';
import CaptureScreen from '../screen/CaptureScreen';
// FeedScreen removed

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({ label, focused }) => {
  const iconMap = {
    Home: '🏠',
    Hunt: '🎯',
    Capture: '📷',
    Profile: '👤',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text
        style={[styles.tabIcon, { color: focused ? '#FFF' : '#9ca3af' }]}
      >
        {iconMap[label]}
      </Text>
      <Text
        style={[styles.tabLabel, { color: focused ? '#FFF' : '#9ca3af' }]}
      >
        {label}
      </Text>
    </View>
  );
};

// Auth Stack (Login/Signup)
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

// Main App Tabs
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => (
        <TabIcon label={route.name} focused={focused} />
      ),
      tabBarActiveTintColor: '#FFF',
      tabBarInactiveTintColor: '#9ca3af',
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarItemStyle: styles.tabBarItem,
      animationEnabled: true,
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Home',
      }}
    />
    <Tab.Screen
      name="Hunt"
      component={HuntScreen}
      options={{
        title: 'Hunt',
      }}
    />
    <Tab.Screen
      name="Capture"
      component={CaptureScreen}
      options={{
        title: 'Capture',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
      }}
    />
    // Feed tab removed
   </Tab.Navigator>
);

// Root Navigator (Conditional Auth/App)
export const RootNavigator = ({ isLoggedIn }) => {
  const positionAnim = useRef(new Animated.ValueXY({x: 50, y: 100})).current;

  const onStateChange = (state) => {
    if (!state) return;
    const route = state.routes[state.index];
    let newX = 50, newY = 100;
    if (route.name === 'Home') { newX = 50; newY = 100; }
    else if (route.name === 'Hunt') { newX = 250; newY = 150; }
    else if (route.name === 'Capture') { newX = 150; newY = 250; }
    else if (route.name === 'Profile') { newX = 300; newY = 100; }
    Animated.spring(positionAnim, {
      toValue: {x: newX, y: newY},
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={{flex: 1}}>
      <NavigationContainer onStateChange={onStateChange}>
        {isLoggedIn ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
      <Animated.View style={[styles.floatingContainer, {transform: positionAnim.getTranslateTransform()}]}>
        <Text style={styles.floatingText}>🎯</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#5b21b6',
    borderTopColor: '#8b5cf6',
    borderTopWidth: 3,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarItem: {
    flex: 1,
  },
  tabBarLabel: {
    fontSize: 1, // Hide default label
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  floatingContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#8b5cf6',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingText: {
    fontSize: 24,
  },
});
