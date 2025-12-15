import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { fetchPokemonList } from "../api/pokeapi";
import { useFocusEffect } from '@react-navigation/native';
import { getUserStats, releasePokemon } from "../api/gamification"; // Import release function

export default function ProfileScreen({ navigation }) {
  const userEmail = auth.currentUser?.email || "Unknown Trainer";
  const [myCollection, setMyCollection] = useState([]);
  const [stats, setStats] = useState({ points: 0, badges: [], dailyChallenge: null, caughtPokemon: [] });
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useFocusEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    return () => {
      slideAnim.setValue(400);
    };
  });

  useFocusEffect(
    useCallback(() => {
      loadRealProfileData();
    }, [])
  );

  const loadRealProfileData = async () => {
    setLoading(true);

    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // 1. Fetch Real User Stats
    const userStats = await getUserStats(auth.currentUser.uid);
    setStats(userStats);

    const caughtIds = userStats.caughtPokemon || [];
    const allPokemon = await fetchPokemonList();

    // 3. Filter List
    const userPokemon = allPokemon
      .filter(pokemon => caughtIds.includes(pokemon.id))
      .reverse();

    setMyCollection(userPokemon);
    setLoading(false);
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Logout Error:", error));
  };

  // NEW: Handle Release Logic
  const handleRelease = (pokemon) => {
    Alert.alert(
      "Release Pokémon?",
      `Are you sure you want to release ${pokemon.name.toUpperCase()} back into the wild?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          style: "destructive",
          onPress: async () => {
            if (auth.currentUser) {
              await releasePokemon(auth.currentUser.uid, pokemon.id);
              // Refresh the list locally to feel instant
              setMyCollection(current => current.filter(p => p.id !== pokemon.id));
              // Also reload stats to be sure
              loadRealProfileData();
            }
          }
        }
      ]
    );
  };

  const renderPokemonItem = ({ item }) => (
    <View style={styles.dexRowContainer}>
      {/* Navigate to Detail on Press */}
      <TouchableOpacity
        style={styles.dexRow}
        onPress={() => navigation.navigate('Detail', { pokemonId: item.id })}
      >
        <Text style={styles.dexId}>#{String(item.id).padStart(3, '0')}</Text>
        <Text style={styles.dexName}>{item.name.toUpperCase()}</Text>
        <View style={[styles.statusBadge, styles.badgeCaught]}>
          <Text style={styles.statusText}>CAUGHT</Text>
        </View>
      </TouchableOpacity>

      {/* Release Button */}
      <TouchableOpacity
        style={styles.releaseBtn}
        onPress={() => handleRelease(item)}
      >
        <Text style={styles.releaseText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.header}>
        {/* Removed blue light and status lights */}
      </View>

      <Text style={styles.headerTitle}>TRAINER CARD</Text>

      <View style={styles.screenContainer}>
        <View style={styles.innerScreen}>

          <View style={styles.trainerInfoContainer}>
            <Text style={styles.label}>TRAINER ID:</Text>
            <Text style={styles.trainerName} numberOfLines={1} ellipsizeMode="middle">
              {userEmail.toUpperCase()}
            </Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>LVL: {Math.floor(stats.points / 100) + 1}</Text>
              <Text style={styles.statText}>PTS: {stats.points}</Text>
              <Text style={styles.statText}>DEX: {myCollection.length}</Text>
            </View>
            <View style={styles.divider} />
          </View>

          <View style={styles.challengeBox}>
            <Text style={styles.challengeTitle}>DAILY MISSION</Text>
            <Text style={styles.challengeText}>
              {stats.dailyChallenge?.description || "Loading..."}
            </Text>
            {stats.dailyChallenge?.completed && (
              <Text style={styles.completedText}>✅ COMPLETED</Text>
            )}
          </View>

          <Text style={styles.sectionHeader}>LOGGED DISCOVERIES</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#333" style={{marginTop: 20}} />
          ) : myCollection.length > 0 ? (
            <FlatList
              data={myCollection}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderPokemonItem}
              style={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>NO DATA LOGGED.</Text>
              <Text style={styles.emptySubText}>Use 'LOG DATA' on Detail Screen.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.buttonText}>MAP</Text>
          </TouchableOpacity>

          <View style={styles.miniDpad}>
            <View style={styles.dpadV} />
            <View style={styles.dpadH} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7c3aed',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  blueLightContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  blueLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E90FF',
    borderWidth: 2,
    borderColor: '#191970',
  },
  blueLightReflection: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  statusLights: {
    flexDirection: 'row',
    marginLeft: 15,
    gap: 8,
  },
  smallLight: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#000',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#DEDEDE',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    padding: 15,
    borderBottomRightRadius: 35,
  },
  innerScreen: {
    flex: 1,
    backgroundColor: '#98CB98',
    borderWidth: 3,
    borderColor: '#555',
    borderRadius: 5,
    padding: 12,
  },
  trainerInfoContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  trainerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  statText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  divider: {
    height: 2,
    backgroundColor: '#333',
    marginTop: 5,
    opacity: 0.5,
  },
  challengeBox: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  challengeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    textDecorationLine: 'underline',
  },
  challengeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  completedText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  listContainer: {
    flex: 1,
  },
  // Updated Row Styles
  dexRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dexRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dexId: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    width: 40,
    color: '#333',
  },
  dexName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCaught: {
    backgroundColor: '#FF0000',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Release Button Style
  releaseBtn: {
    padding: 5,
    marginLeft: 8,
    backgroundColor: '#333',
    borderRadius: 15,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  releaseText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  emptyText: {
    color: '#555',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptySubText: {
    color: '#777',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 5
  },
  controlsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#28AAFD',
    width: 100,
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1C5D8D',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  miniDpad: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  dpadV: {
    position: 'absolute',
    left: 17,
    top: 5,
    width: 16,
    height: 40,
    backgroundColor: '#222',
    borderRadius: 2,
  },
  dpadH: {
    position: 'absolute',
    top: 17,
    left: 5,
    width: 40,
    height: 16,
    backgroundColor: '#222',
    borderRadius: 2,
  },
  logoutButton: {
    backgroundColor: '#FFCB05', // Pokemon Yellow
    width: '100%',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C59E00',
  },
  logoutText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  }
});