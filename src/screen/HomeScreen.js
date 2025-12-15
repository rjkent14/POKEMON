import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, StatusBar, Platform, Animated
} from 'react-native';
import { fetchPokemonList } from '../api/pokeapi';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [pokemon, setPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchPokemonList(151); // Gen 1
    setPokemon(data);
    setFilteredPokemon(data);
    setLoading(false);
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const newData = pokemon.filter(item => {
        const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1 || String(item.id) === text;
      });
      setFilteredPokemon(newData);
    } else {
      setFilteredPokemon(pokemon);
    }
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Detail', { pokemonId: item.id })}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <Text style={styles.cardId}>#{String(item.id).padStart(3, '0')}</Text>
      <Text style={styles.cardName}>{item.name.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <StatusBar barStyle="light-content" backgroundColor="#8b5cf6" />

      {/* 1. HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>POKÉDEX</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {/* Removed blue light */}
        </TouchableOpacity>
      </View>

      {/* 2. SEARCH BAR */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Name or ID..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* 3. MAIN POKEMON LIST */}
      <View style={styles.listWrapper}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" style={{marginTop: 50}} />
        ) : (
          <FlatList
            data={filteredPokemon}
            keyExtractor={item => item.name}
            renderItem={renderCard}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#a855f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueLight: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#28AAFD',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 2,
    borderColor: '#333',
    fontWeight: 'bold',
    color: '#000',
  },
  // Wrapper allows the list to take up space above the navbar
  listWrapper: {
    flex: 1,
    backgroundColor: '#7c3aed',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden', // Ensures content stays inside rounded corners
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFF',
    width: '48%',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    elevation: 3,
  },
  cardImage: {
    width: 80,
    height: 80,
  },
  cardId: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
  },
  cardName: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },

});