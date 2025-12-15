import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // ⭐ Import Stack
import { View, Text, StyleSheet } from 'react-native';

// Import Screens
import HomeScreen from '../screen/HomeScreen';
import DetailScreen from '../screen/DetailScreen';
import ProfileScreen from '../screen/ProfileScreen';
import HuntScreen from '../screen/HuntScreen';
import EncounterScreen from '../screen/EncounterScreen'; // ⭐ New Screen
// FeedScreen removed

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- STACK 1: HUNT TAB (Map -> Encounter) ---
function HuntStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HuntMap" component={HuntScreen} />
      <Stack.Screen name="Encounter" component={EncounterScreen} />
    </Stack.Navigator>
  );
}

// --- STACK 2: PROFILE TAB (Profile -> Detail) ---
function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}

// --- STACK 3: POKEDEX TAB (List -> Detail) ---
// Optional: If you want clicking a Pokemon in the main list to open details too
function PokedexStackNavigator() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PokedexList" component={HomeScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
      </Stack.Navigator>
    );
}

// Custom Tab Bar Icon Component (Kept your exact design)
const TabIcon = ({ label, focused }) => {
  const iconMap = {
    Hunt: '🎯',
    Pokedex: '📚',
    AR: '📷',
    Profile: '👤',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { color: focused ? '#fbbf24' : '#9ca3af' }]}>
        {iconMap[label] || '❓'}
      </Text>
      <Text style={[styles.tabLabel, { color: focused ? '#fbbf24' : '#9ca3af' }]}>
        {label}
      </Text>
    </View>
  );
};

// Main Stack with Bottom Tabs
export default function MainStack() {
  return (
    <Tab.Navigator
      initialRouteName="Hunt"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#fbbf24',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        animationEnabled: true,
      })}
    >
      {/* Tab 1: Hunt (Now uses the Stack, so it knows about 'Encounter') */}
      <Tab.Screen
        name="Hunt"
        component={HuntStackNavigator} // ⭐ Changed from HuntScreen
      />

      {/* Tab 2: Pokedex */}
      <Tab.Screen
        name="Pokedex"
        component={PokedexStackNavigator} // ⭐ Changed to Stack so items are clickable
      />

      {/* Tab 4: Profile (Now uses Stack, so it knows about 'Detail') */}
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator} // ⭐ Changed from ProfileScreen
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111827',
    borderTopColor: '#fbbf24',
    borderTopWidth: 2,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
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