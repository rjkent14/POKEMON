// File: src/navigation/RootNavigator.js
// REPLACE YOUR ENTIRE FILE WITH THIS CODE

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

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
export const RootNavigator = ({ isLoggedIn }) => (
  <NavigationContainer>
    {isLoggedIn ? <MainTabs /> : <AuthStack />}
  </NavigationContainer>
);

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
});
