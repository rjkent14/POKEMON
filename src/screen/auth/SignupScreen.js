import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebase';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async () => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User signed up successfully:", userCredential.user.uid);
    } catch (e) {
      // FIX: Changed console.error to console.log to stop the popup overlay
      console.log("Signup failed:", e.message);
      setError("Registration Failed. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Pokedex Top Header */}
      <View style={styles.header}>
        {/* Removed blue light and status lights */}
      </View>

      <Text style={styles.headerTitle}>REGISTRATION</Text>

      {/* The "Screen" Area */}
      <View style={styles.screenContainer}>
        <View style={styles.innerScreen}>
          <Text style={styles.screenTitle}>NEW ENTRY</Text>

          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="Misty@gym.water"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>SET PASSWORD</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Text style={styles.eyeText}>{isPasswordVisible ? "HIDE" : "SHOW"}</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>

      {/* Control Pad Area */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
          <Text style={styles.primaryButtonText}>REGISTER</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryLink}>EXISTING TRAINER? LOGIN</Text>
        </TouchableOpacity>

        {/* Decorative Vent Lines */}
        <View style={styles.ventContainer}>
           <View style={styles.ventLine} />
           <View style={styles.ventLine} />
           <View style={styles.ventLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#581c87',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  blueLightContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  blueLight: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E90FF',
    borderWidth: 2,
    borderColor: '#191970',
  },
  blueLightReflection: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  statusLights: {
    flexDirection: 'row',
    marginLeft: 20,
    gap: 10,
  },
  smallLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  screenContainer: {
    backgroundColor: '#DEDEDE',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    borderBottomRightRadius: 40,
  },
  innerScreen: {
    backgroundColor: '#98CB98',
    borderWidth: 4,
    borderColor: '#555',
    borderRadius: 5,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  input: {
    backgroundColor: '#FFF',
    height: 40,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
    paddingHorizontal: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: 40,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000',
    height: '100%',
  },
  eyeButton: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#ddd',
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  eyeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  errorText: {
    color: '#CC0000',
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B4CCA', // Classic Blue
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1C2C80',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  secondaryLink: {
    color: '#FFCB05',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  ventContainer: {
    marginTop: 30,
    alignItems: 'flex-end',
    width: '100%',
    paddingRight: 20
  },
  ventLine: {
    width: 60,
    height: 6,
    backgroundColor: '#8B0000',
    marginBottom: 4,
    borderRadius: 3,
  }
});