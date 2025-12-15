import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Share, Alert
} from 'react-native';
import { fetchPokemonDetails } from '../api/pokeapi';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { registerDiscovery } from '../api/gamification';

const TYPE_COLORS = {
  grass: '#78C850', fire: '#F08030', water: '#6890F0',
  bug: '#A8B820', normal: '#A8A878', poison: '#A040A0',
  electric: '#F8D030', ground: '#E0C068', fairy: '#EE99AC',
  fighting: '#C03028', psychic: '#F85888', rock: '#B8A038',
  ghost: '#705898', ice: '#98D8D8', dragon: '#7038F8',
};

export default function DetailScreen({ route, navigation }) {
  const { pokemonId } = route.params || {};
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pokemonId) return;
    const loadDetails = async () => {
      setLoading(true);
      const data = await fetchPokemonDetails(pokemonId);
      setDetails(data);
      setLoading(false);
    };
    loadDetails();
  }, [pokemonId]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I found ${details.name.toUpperCase()} on Poké-Explore! It's a ${details.types.join('/')} type Pokémon.`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleLogDiscovery = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Login to save progress!");
      return;
    }

    try {
      // 1. Trigger Gamification Update
      const resultMessage = await registerDiscovery(user.uid, details);

      // 2. Save to Feed
      await addDoc(collection(db, "posts"), {
        pokemonName: details.name,
        pokemonId: details.id,
        pokemonImage: details.image,
        trainerEmail: user.email,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", resultMessage || "Discovery Logged!");
    } catch (error) {
      console.error("Error logging discovery: ", error);
      Alert.alert("Error", "Could not save discovery.");
    }
  };

  if (loading || !details) {
    return (
      <View style={[styles.container, {justifyContent:'center'}]}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>◀ BACK</Text>
      </TouchableOpacity>

      <View style={styles.whiteScreen}>
        <Image
          source={{ uri: details.sprite || details.image }}
          style={styles.mainImage}
          resizeMode="contain"
        />
        <View style={styles.nameTag}>
          <Text style={styles.nameText}>#{details.id} {details.name.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialBtn} onPress={handleShare}>
          <Text style={styles.socialText}>SHARE 📤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, styles.logBtn]} onPress={handleLogDiscovery}>
          <Text style={styles.socialText}>LOG DATA 💾</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.greenScreen}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.flavorText}>{details.description}</Text>

          <View style={styles.section}>
            <Text style={styles.label}>TYPES:</Text>
            <View style={styles.row}>
              {details.types.map(t => (
                <View key={t} style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[t] || '#777' }]}>
                  <Text style={styles.typeText}>{t.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>EVOLUTION CHAIN:</Text>
            <View style={styles.evoContainer}>
              {details.evolutions?.map((evo, index) => (
                <React.Fragment key={evo.id}>
                  {index > 0 && <Text style={styles.arrow}>→</Text>}
                  <TouchableOpacity
                    style={styles.evoItem}
                    onPress={() => navigation.push('Detail', { pokemonId: evo.id })}
                  >
                    <Image source={{ uri: evo.image }} style={styles.evoImage} />
                    <Text style={styles.evoName}>{evo.name}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#9333ea', padding: 20 },
  backButton: { marginBottom: 10 },
  backText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  whiteScreen: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#DEDEDE',
    elevation: 5,
  },
  mainImage: { width: 120, height: 120 },
  nameTag: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: -10,
  },
  nameText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  socialBtn: {
    backgroundColor: '#28AAFD', padding: 10, borderRadius: 8, flex: 1, marginRight: 5, alignItems: 'center'
  },
  logBtn: { backgroundColor: '#FFCB05', marginRight: 0, marginLeft: 5 },
  socialText: { fontWeight: 'bold', fontSize: 12, color: '#000' },
  greenScreen: {
    flex: 1,
    backgroundColor: '#98CB98',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#555',
    padding: 15,
  },
  flavorText: { fontStyle: 'italic', marginBottom: 15, color: '#000', fontSize: 12 },
  section: { marginBottom: 15 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 5 },
  typeText: { color: '#FFF', fontWeight: 'bold', fontSize: 10 },
  evoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: 10,
  },
  evoItem: { alignItems: 'center' },
  evoImage: { width: 40, height: 40 },
  evoName: { fontSize: 8, fontWeight: 'bold', color: '#333', marginTop: 2, textTransform: 'uppercase' },
  arrow: { fontSize: 16, color: '#333', fontWeight: 'bold', marginHorizontal: 5 },
});