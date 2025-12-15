import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Image,
  Modal
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import PushNotification from 'react-native-push-notification'; // 1. Import PushNotification
import { useFocusEffect } from '@react-navigation/native';

import { fetchPokemonList, fetchPokemonDetails } from '../api/pokeapi';

const CAPTURE_RADIUS_METERS = 40;

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
];

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getTypeEmoji = (type) => {
  switch (type) {
    case 'grass': return '🌿';
    case 'water': return '💧';
    case 'fire': return '🔥';
    case 'bug': return '🐛';
    case 'electric': return '⚡';
    case 'rock': return '🪨';
    case 'ground': return '🏜️';
    case 'psychic': return '🔮';
    case 'ghost': return '👻';
    case 'dragon': return '🐉';
    case 'poison': return '☠️';
    case 'flying': return '🦅';
    case 'ice': return '❄️';
    case 'fighting': return '🥊';
    case 'normal': return '🐾';
    default: return '❓';
  }
};

const HuntScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [nearbyPokemon, setNearbyPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [biomeType, setBiomeType] = useState('SCANNING...');
  const [locationWatcherId, setLocationWatcherId] = useState(null);
  const [allPokemon, setAllPokemon] = useState([]);

  // Custom Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [targetPokemon, setTargetPokemon] = useState(null);
  const [targetDistance, setTargetDistance] = useState(0);

  const scannerAnim = useRef(new Animated.Value(0)).current;
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
    // 2. Configure Notification Channel (Required for Android)
    PushNotification.createChannel(
      {
        channelId: "pokedex-alerts",
        channelName: "Pokemon Alerts",
        channelDescription: "Notifications for nearby Pokemon",
        playSound: true,
        soundName: "default",
        importance: 4, // High importance
        vibrate: true,
      },
      (created) => console.log(`Notification Channel created: '${created}'`)
    );

    Animated.loop(
      Animated.sequence([
        Animated.timing(scannerAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scannerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();

    let isMounted = true;

    const loadGen1 = async () => {
        const list = await fetchPokemonList();
        if (isMounted) setAllPokemon(list);
    };
    loadGen1();

    const initPermission = async () => {
      try {
        const permission = Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

        const result = await request(permission);

        if (isMounted) {
          if (result === RESULTS.GRANTED) {
            watchLocation();
          } else {
            console.log('Location permission denied by user.');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Permission error:', error);
        if (isMounted) setLoading(false);
      }
    };

    initPermission();

    return () => {
      isMounted = false;
      if (locationWatcherId !== null) {
        Geolocation.clearWatch(locationWatcherId);
      }
    };
  }, []);

  const watchLocation = () => {
    if (locationWatcherId !== null) Geolocation.clearWatch(locationWatcherId);

    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        if (!location) {
             setLocation({ latitude, longitude });
             spawnPokemon(latitude, longitude);
        } else {
            setLocation({ latitude, longitude });
        }
        setLoading(false);
      },
      error => {
        console.log('Location watch error:', error);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        distanceFilter: 5
      },
    );
    setLocationWatcherId(watchId);
  };

  const spawnPokemon = async (lat, lon) => {
    const latInt = Math.floor(lat * 1000);
    let zoneName = 'URBAN';
    if ((latInt % 3) === 0) zoneName = 'WATER';
    else if ((latInt % 3) === 1) zoneName = 'GRASS';
    setBiomeType(zoneName);

    let pool = allPokemon;
    if (pool.length === 0) {
        pool = await fetchPokemonList();
        setAllPokemon(pool);
    }

    if (pool.length === 0) return;

    const randomPicks = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        randomPicks.push(pool[randomIndex]);
    }

    const enrichedSpawns = await Promise.all(randomPicks.map(async (p) => {
        const details = await fetchPokemonDetails(p.id);
        const mainType = details && details.types ? details.types[0] : 'normal';

        return {
            ...p,
            type: mainType,
            emoji: getTypeEmoji(mainType),
            distance: Math.floor(Math.random() * 150) + 50,
            latitude: lat + (Math.random() - 0.5) * 0.002,
            longitude: lon + (Math.random() - 0.5) * 0.002,
        };
    }));

    setNearbyPokemon(enrichedSpawns);

    // 3. Trigger Local Notification only if within range
    const catchableSpawns = enrichedSpawns.filter(p => {
        const dist = getDistance(lat, lon, p.latitude, p.longitude);
        return dist < CAPTURE_RADIUS_METERS;
    });

    if (catchableSpawns.length > 0) {
      PushNotification.localNotification({
        channelId: "pokedex-alerts", // Must match channel created in useEffect
        title: "⚠️ Proximity Alert!",
        message: `${catchableSpawns.length} Pokémon within capture range!`,
        playSound: true,
        soundName: "default",
      });
    }
  };

  const handleEncounter = pokemon => {
    if (!location) return;

    const distance = getDistance(
        location.latitude,
        location.longitude,
        pokemon.latitude,
        pokemon.longitude
    );

    if (distance > CAPTURE_RADIUS_METERS) {
        Alert.alert(
            "Target Out of Range",
            `Signal weak. Target is ${Math.round(distance)}m away.\n\nMove closer to engage. (Req: ${CAPTURE_RADIUS_METERS}m)`
        );
        return;
    }

    // Use Custom Modal instead of Alert
    setTargetPokemon(pokemon);
    setTargetDistance(Math.round(distance));
    setModalVisible(true);
  };

  const handleStartCapture = () => {
    setModalVisible(false);
    navigation.navigate('Encounter', { pokemon: targetPokemon });
  };

  const handleRefresh = () => {
    if (location) {
        setLoading(true);
        spawnPokemon(location.latitude, location.longitude);
        setTimeout(() => setLoading(false), 1000);
    }
  };

  const scannerTranslateY = scannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <StatusBar barStyle="light-content" backgroundColor="#8b5cf6" />

      {/* 1. 3D HEADER */}
      <View style={styles.header}>
        {/* Removed blue light and status lights */}
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>POKE - HUNT</Text>
      </View>

      {/* 2. THE SCREEN UNIT */}
      <View style={styles.screenBezel}>
        <View style={styles.innerScreen}>

          {/* MAP VIEW */}
          {location ? (
            <View style={styles.mapContainer}>
                <MapView
                provider={PROVIDER_GOOGLE}
                customMapStyle={darkMapStyle}
                style={styles.map}
                region={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                }}
                showsUserLocation={true}
                followsUserLocation={true}
                >
                <Circle
                    center={location}
                    radius={CAPTURE_RADIUS_METERS}
                    strokeWidth={1}
                    strokeColor="rgba(0, 255, 0, 0.3)"
                    fillColor="rgba(0, 255, 0, 0.05)"
                />
                {nearbyPokemon.map((poke, index) => (
                    <Marker
                    key={`${poke.id}-${index}`}
                    coordinate={{ latitude: poke.latitude, longitude: poke.longitude }}
                    onPress={() => handleEncounter(poke)}
                    >
                        <View style={styles.customMarker}>
                            <Image source={{ uri: poke.image }} style={styles.markerImage} />
                        </View>
                    </Marker>
                ))}
                </MapView>

                <Animated.View
                    style={[
                        styles.scannerLine,
                        { transform: [{ translateY: scannerTranslateY }] }
                    ]}
                />

                <View style={styles.screenGlare} />
            </View>
          ) : (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#333" />
                <Text style={styles.loadingText}>ACQUIRING GPS SIGNAL...</Text>
            </View>
          )}

          <View style={styles.biomeBadge}>
             <Text style={styles.biomeText}>📍 {biomeType} ZONE</Text>
          </View>

          {/* RADAR SIGNALS ON THE RIGHT */}
          <View style={styles.radarContainer}>
            <View style={styles.radarHeader}>
                <Text style={styles.panelLabel}>RADAR SIGNALS</Text>
                <View style={styles.blinkingDot} />
            </View>

            {nearbyPokemon.length > 0 ? (
            <FlatList
                data={nearbyPokemon}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={{ paddingVertical: 5 }}
                renderItem={({ item }) => {
                    const dist = location ? Math.round(getDistance(location.latitude, location.longitude, item.latitude, item.longitude)) : '???';
                    return (
                    <TouchableOpacity style={styles.trackerCard} onPress={() => handleEncounter(item)}>
                        <Text style={styles.pokeLabel}>POKÉMON</Text>
                        <Image source={{ uri: item.image }} style={styles.trackerImage} />
                        <Text style={styles.trackerName}>{item.name.substring(0, 8)}</Text>
                        <View style={[styles.distBadge, dist <= CAPTURE_RADIUS_METERS ? {backgroundColor:'#4ade80'} : {backgroundColor:'#fbbf24'}]}>
                            <Text style={styles.distText}>{dist}m</Text>
                        </View>
                    </TouchableOpacity>
                    )
                }}
            />
            ) : (
                <Text style={styles.emptyText}>NO SIGNALS DETECTED</Text>
            )}
          </View>

        </View>
      </View>

      {/* 3. CONTROL PANEL */}
      <View style={styles.controlsContainer}>

        <TouchableOpacity style={styles.scanButton} onPress={handleRefresh}>
            <View style={styles.scanButtonInner}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.scanButtonText}>RE-SCAN AREA</Text>}
            </View>
        </TouchableOpacity>

      </View>

      {/* CUSTOM ENCOUNTER MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.modalTitle}>SIGNAL LOCKED</Text>
              <Text style={styles.alertIcon}>⚠️</Text>
            </View>

            <View style={styles.modalContent}>
              <Image
                source={{ uri: targetPokemon?.image }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <Text style={styles.modalPokemonName}>{targetPokemon?.name.toUpperCase()}</Text>
              <Text style={styles.modalInfoText}>
                TYPE: {targetPokemon?.type?.toUpperCase()} | DIST: {targetDistance}m
              </Text>
              <Text style={styles.modalPrompt}>Engage Capture Sequence?</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>IGNORE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.catchBtn]}
                onPress={handleStartCapture}
              >
                <Text style={[styles.modalBtnText, {color: '#000'}]}>THROW BALL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  blueLightContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    elevation: 5,
  },
  blueLight: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#28AAFD',
    borderWidth: 2,
    borderColor: '#191970',
  },
  blueLightReflection: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  statusLights: {
    flexDirection: 'row',
    marginLeft: 15,
    gap: 8,
  },
  smallLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000',
    elevation: 2,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  titleContainer: {
    backgroundColor: '#5b21b6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  screenBezel: {
    flex: 1,
    backgroundColor: '#DEDEDE',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    borderBottomRightRadius: 45,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  innerScreen: {
    flex: 1,
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: '#555',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  radarContainer: {
    width: 140,
    backgroundColor: '#222',
    borderLeftWidth: 2,
    borderLeftColor: '#555',
    padding: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  scannerLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    opacity: 0.7,
    position: 'absolute',
    top: 0,
  },
  screenGlare: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#98CB98',
  },
  loadingText: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  biomeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  biomeText: {
    color: '#00FF00',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  radarPanel: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#555',
    height: 110,
    elevation: 3,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  panelLabel: {
    color: '#00FF00',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  blinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  trackerCard: {
    backgroundColor: '#1a1a1a',
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00FF00',
    padding: 2,
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  trackerImage: {
    width: 60,
    height: 60,
    marginBottom: 2,
  },
  pokeLabel: {
    color: '#00FF00',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  trackerName: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  distBadge: {
    marginTop: 2,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  distText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  scanButton: {
    backgroundColor: '#5b21b6',
    borderRadius: 8,
    paddingBottom: 4,
  },
  scanButtonInner: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5b21b6',
  },
  scanButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  customMarker: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#222',
    borderWidth: 4,
    borderColor: '#DEDEDE',
    borderRadius: 10,
    padding: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#CC0000',
    padding: 10,
    alignItems: 'center',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  modalTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  alertIcon: {
    fontSize: 20,
    color: '#FFF',
  },
  modalContent: {
    backgroundColor: '#98CB98',
    borderWidth: 3,
    borderColor: '#555',
    margin: 10,
    alignItems: 'center',
    padding: 20,
    borderRadius: 5,
  },
  modalImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  modalPokemonName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 5,
  },
  modalInfoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
  },
  modalPrompt: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 2,
    marginHorizontal: 5,
    elevation: 3,
  },
  cancelBtn: {
    backgroundColor: '#6b46c1',
    borderColor: '#4c1d95',
  },
  catchBtn: {
    backgroundColor: '#a855f7',
    borderColor: '#7c3aed',
  },
  modalBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
});

export default HuntScreen;