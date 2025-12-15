// src/screen/CaptureScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
} from "react-native";
import ARCamera from "../components/ARCamera";
import Voice from "@react-native-voice/voice";
import Share from "react-native-share";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";

/*
  CaptureScreen (Vision Camera version)

  - Uses ARCamera component (vision-camera) for live camera feed inside the UI box
  - capturePhoto will call cameraRef.current.takePhoto() when available
  - Keeps your voice, gallery (in-memory), share & delete logic
*/

const CaptureScreen = ({ navigation }) => {
  // voice state
  const [isListening, setIsListening] = useState(false);
  const [recognized, setRecognized] = useState("");
  const [error, setError] = useState("");

  // gallery state
  const [capturedPhotos, setCapturedPhotos] = useState([
    { id: 1, emoji: "🌿", name: "BULBASAUR", timestamp: "Today 10:30 AM", type: "GRASS" },
    { id: 2, emoji: "🔥", name: "CHARMANDER", timestamp: "Today 09:15 AM", type: "FIRE" },
    { id: 3, emoji: "💧", name: "SQUIRTLE", timestamp: "Yesterday 3:45 PM", type: "WATER" },
  ]);

  const cameraRef = useRef(null);

  useEffect(() => {
    setupVoiceRecognition();
    return () => {
      Voice.destroy().catch((e) => console.error(e));
    };
  }, []);

  // ---------- Voice setup (kept from your original logic) ----------
  const setupVoiceRecognition = () => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
  };

  const onSpeechStart = () => {
    setIsListening(true);
    setError("");
  };
  const onSpeechEnd = () => {
    setIsListening(false);
  };
  const onSpeechResults = (results) => {
    const text = (results && (results.value?.[0] || results[0])) || results?.[0] || "";
    if (text) searchPokemonByVoice(text);
  };
  const onSpeechPartialResults = () => {};
  const onSpeechError = (err) => {
    console.error("voice error", err);
    setError("Voice error");
    setIsListening(false);
  };

  const startVoiceSearch = async () => {
    try {
      const perm = Platform.OS === "ios" ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
      const r = await request(perm);
      if (r !== RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "Microphone access is required");
        return;
      }
      await Voice.start("en-US");
      setIsListening(true);
    } catch (e) {
      console.error("Voice start error:", e);
      setError("Failed to start voice recognition");
    }
  };

  const stopVoiceSearch = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.warn(e);
    }
  };

  const searchPokemonByVoice = (voiceInput) => {
    const pokemonDatabase = [
      "BULBASAUR",
      "CHARMANDER",
      "SQUIRTLE",
      "PIKACHU",
      "PSYDUCK",
      "GROWLITHE",
      "PIDGEOT",
    ];
    const inputLower = voiceInput.toLowerCase();
    const match = pokemonDatabase.find(
      (n) => n.toLowerCase() === inputLower || n.toLowerCase().includes(inputLower)
    );
    if (match) {
      setRecognized(match);
      Alert.alert("🎤 Voice Recognized", `You said: ${match}`, [
        { text: "Add to Gallery", onPress: () => addPhotoToGallery(match) },
        { text: "Close", style: "cancel" },
      ]);
    } else {
      Alert.alert("❌ Not Found", `Couldn't recognize: "${voiceInput}". Try PIKACHU, BULBASAUR, etc.`);
    }
  };

  // ---------- Capture using vision-camera ----------
  const capturePhoto = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert("Camera not ready");
        return;
      }

      // takePhoto is provided by react-native-vision-camera if `photo={true}` was set
      if (cameraRef.current.takePhoto) {
        const photo = await cameraRef.current.takePhoto({
          flash: "off",
        });

        // photo.path or photo.uri may vary by version; vision-camera returns { path: '...' }
        const uri = photo?.path || photo?.uri || null;

const newPhoto = {
  id: capturedPhotos.length + 1,
  uri,
  emoji: "⚡",   // ⭐ added
  name: "CAPTURED",
  timestamp: "Just now",
};

        setCapturedPhotos([newPhoto, ...capturedPhotos]);
        Alert.alert("✅ Photo Captured", "Saved to gallery (in-memory).");
      } else {
        Alert.alert(
          "Not supported",
          "takePhoto() not available in this vision-camera version. You can update the library or we'll implement view-capture fallback."
        );
      }
    } catch (e) {
      console.error("capture error", e);
      Alert.alert("Capture failed", String(e));
    }
  };

  const addPhotoToGallery = (pokemonName) => {
    const newPhoto = {
      id: capturedPhotos.length + 1,
      emoji: "⭐",
      name: pokemonName,
      timestamp: "Just now",
    };
    setCapturedPhotos([newPhoto, ...capturedPhotos]);
  };

  const sharePhoto = async (photo) => {
    try {
      const opts = photo.uri ? { url: photo.uri, message: `Check my capture: ${photo.name || ""}` } : { message: `Caught ${photo.name}` };
      await Share.open(opts);
    } catch (e) {
      console.warn(e);
    }
  };

  const deletePhoto = (id) => {
    Alert.alert("Delete Photo", "Remove this photo from gallery?", [
      { text: "Delete", style: "destructive", onPress: () => setCapturedPhotos(capturedPhotos.filter((p) => p.id !== id)) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ---------- UI ----------
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* AR Camera Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>📷 AR CAMERA</Text>

        {/* Real camera feed (ARCamera) */}
        <ARCamera ref={cameraRef} />

        <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
          <Text style={styles.captureText}>🎥 CAPTURE PHOTO</Text>
        </TouchableOpacity>

        <View style={styles.arInfo}>
          <Text style={styles.arLabel}>AR OVERLAY INFO</Text>
          <Text style={styles.arDetail}>✓ Camera permission: Enabled</Text>
          <Text style={styles.arDetail}>✓ Sprite overlay: 2D Pokémon</Text>
          <Text style={styles.arDetail}>✓ Gyro detection: Optional (add later)</Text>
        </View>
      </View>

      {/* Voice Search Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>🎤 VOICE SEARCH</Text>

        <TouchableOpacity style={[styles.voiceButton, isListening && styles.voiceButtonActive]} onPress={isListening ? stopVoiceSearch : startVoiceSearch}>
          <Text style={styles.voiceText}>{isListening ? "⏺ LISTENING..." : "🎤 SPEAK POKÉMON NAME"}</Text>
        </TouchableOpacity>

        {recognized ? (
          <View style={styles.recognizedBox}>
            <Text style={styles.recognizedLabel}>✓ RECOGNIZED</Text>
            <Text style={styles.recognizedName}>{recognized}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorLabel}>⚠ {error}</Text>
          </View>
        ) : null}

        <Text style={styles.voiceHint}>Try saying: PIKACHU, BULBASAUR, CHARMANDER, SQUIRTLE</Text>
      </View>

      {/* Gallery Section */}
      <View style={styles.section}>
        <View style={styles.galleryHeader}>
          <Text style={styles.sectionHeader}>📸 GALLERY</Text>
          <Text style={styles.galleryCount}>{capturedPhotos.length}</Text>
        </View>

        <View style={styles.gallery}>
          {capturedPhotos.length > 0 ? (
            capturedPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoCardWrapper}>
                <TouchableOpacity style={styles.photoCard} onLongPress={() => deletePhoto(photo.id)}>
                  {photo.uri ? (
                    <View style={{ width: 80, height: 60, marginBottom: 6 }}>
                      <Image
                        source={{ uri: photo.uri }}
                        style={{ width: 80, height: 60, borderRadius: 4 }}
                      />

                      {/* ⭐ EMOJI BADGE OVERLAY */}
                      <Text
                        style={{
                          position: "absolute",
                          top: 15,
                          right: 20,
                          fontSize: 30,
                          backgroundColor: "#111827",
                          borderRadius: 12,
                          paddingHorizontal: 4,
                        }}
                      >
                        {photo.emoji}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.photoEmoji}>{photo.emoji || "⭐"}</Text>
                  )}

                  <Text style={styles.photoName}>{photo.name}</Text>
                  <Text style={styles.photoType}>{photo.type || ""}</Text>
                  <Text style={styles.photoTime}>{photo.timestamp}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareIconBtn} onPress={() => sharePhoto(photo)}>
                  <Text style={styles.shareIcon}>📤</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyGallery}>
              <Text style={styles.emptyGalleryText}>📸 No photos yet. Capture or recognize a Pokémon!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ℹ️ FEATURES</Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>
            🎥 <Text style={styles.featureText}>Camera Capture: Take photos with AR overlays</Text>
          </Text>
          <Text style={styles.featureItem}>
            🎤 <Text style={styles.featureText}>Voice Search: Speak Pokémon names</Text>
          </Text>
          <Text style={styles.featureItem}>
            📤 <Text style={styles.featureText}>Share: Post to social media</Text>
          </Text>
          <Text style={styles.featureItem}>
            🗑️ <Text style={styles.featureText}>Delete: Long-press photos to remove</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#065f46", paddingBottom: 20 },
  section: { padding: 12, marginBottom: 8, backgroundColor: "#065f46" },
  sectionHeader: {
    color: "#fbbf24",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    fontFamily: "monospace",
    borderBottomWidth: 2,
    borderBottomColor: "#fbbf24",
    paddingBottom: 8,
  },
  captureButton: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  captureText: { color: "#fff", fontWeight: "bold", fontSize: 14, fontFamily: "monospace" },

  arInfo: {
    backgroundColor: "#111827",
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  arLabel: { color: "#60a5fa", fontSize: 12, fontWeight: "bold", marginBottom: 6, fontFamily: "monospace" },
  arDetail: { color: "#d1d5db", fontSize: 11, marginBottom: 4, fontFamily: "monospace" },

  voiceButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fbbf24",
    marginBottom: 12,
  },
  voiceButtonActive: { backgroundColor: "#8b5cf6" },
  voiceText: { color: "#fff", fontWeight: "bold", fontSize: 14, fontFamily: "monospace" },

  recognizedBox: { backgroundColor: "#065f46", borderWidth: 2, borderColor: "#10b981", padding: 12, borderRadius: 6, marginBottom: 12 },
  recognizedLabel: { color: "#10b981", fontSize: 11, fontWeight: "bold", marginBottom: 4, fontFamily: "monospace" },
  recognizedName: { color: "#fff", fontSize: 18, fontWeight: "bold", fontFamily: "monospace" },

  errorBox: { backgroundColor: "#7f1d1d", borderWidth: 2, borderColor: "#dc2626", padding: 12, borderRadius: 6, marginBottom: 12 },
  errorLabel: { color: "#fca5a5", fontSize: 12, fontWeight: "bold", fontFamily: "monospace" },

  galleryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  galleryCount: { color: "#fbbf24", fontSize: 14, fontWeight: "bold", backgroundColor: "#111827", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontFamily: "monospace" },

  gallery: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  photoCardWrapper: { width: "30%", marginBottom: 12, position: "relative" },
  photoCard: { backgroundColor: "#111827", borderWidth: 2, borderColor: "#fbbf24", borderRadius: 8, paddingVertical: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  photoEmoji: { fontSize: 40, marginBottom: 4 },
  photoName: { color: "#fbbf24", fontSize: 10, fontWeight: "bold", fontFamily: "monospace" },
  photoType: { color: "#d1d5db", fontSize: 8, marginTop: 2, fontFamily: "monospace" },
  photoTime: { color: "#6b7280", fontSize: 7, marginTop: 2 },

  shareIconBtn: { position: "absolute", top: -8, right: -8, width: 32, height: 32, borderRadius: 16, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  shareIcon: { fontSize: 16 },

  emptyGallery: { backgroundColor: "#111827", borderWidth: 2, borderColor: "#fbbf24", borderStyle: "dashed", borderRadius: 8, paddingVertical: 30, alignItems: "center" },
  emptyGalleryText: { color: "#9ca3af", fontSize: 12, textAlign: "center", fontFamily: "monospace" },

  featureList: { backgroundColor: "#111827", borderLeftWidth: 3, borderLeftColor: "#fbbf24", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 4 },
  featureItem: { color: "#fbbf24", fontSize: 12, marginBottom: 8, fontFamily: "monospace" },
  featureText: { color: "#d1d5db" },
});

export default CaptureScreen;