import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native"; // Added specific imports for loading
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./src/navigation/AuthStack";
import MainStack from "./src/navigation/MainStack";
import { auth } from "./src/firebase/firebase";
import { PokemonProvider } from "./src/context/PokemonContext"; // ⭐ Import the Context Provider

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    // Added a simple loading spinner so the screen isn't just blank
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    // ⭐ Wrap the entire NavigationContainer in the PokemonProvider
    <PokemonProvider>
      <NavigationContainer>
        {/* Renders MainStack if user is logged in, AuthStack otherwise */}
        {user ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </PokemonProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5b21b6',
  },
});