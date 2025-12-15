import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Keyboard // Import Keyboard to dismiss it
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setError(null);
    Keyboard.dismiss(); // Hide keyboard on press
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in successfully:", userCredential.user.uid);
    } catch (e) {
      console.log("Login failed:", e.message);
      setError("Invalid Trainer ID or Password");
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    Keyboard.dismiss(); // Hide keyboard so user sees the Alert

    if (!email) {
      setError("Please enter your EMAIL address in the box above first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Transmission Sent", "Check your email inbox for a password reset link!");
    } catch (e) {
      console.log("Reset failed:", e.code);

      // Better Error Handling
      if (e.code === 'auth/user-not-found') {
        setError("No Trainer account found with this email.");
      } else if (e.code === 'auth/invalid-email') {
        setError("That is not a valid email address.");
      } else {
        setError("Could not send reset link. Try again later.");
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Removed blue light and status lights */}
      </View>

      <Text style={styles.headerTitle}>POKÉ-EXPLORE</Text>

      {/* Screen */}
      <View style={styles.screenContainer}>
        <View style={styles.innerScreen}>
          <Text style={styles.screenTitle}>TRAINER LOGIN</Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="Ash@pallet.town"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PASSWORD</Text>
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

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>FORGOT PASSWORD?</Text>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.secondaryLink}>NEW TRAINER? REGISTER</Text>
        </TouchableOpacity>

        <View style={styles.dpadContainer}>
           <View style={styles.dpadVertical} />
           <View style={styles.dpadHorizontal} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6d28d9',
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
  },
  screenContainer: {
    backgroundColor: '#DEDEDE',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    borderBottomLeftRadius: 40,
  },
  innerScreen: {
    backgroundColor: '#98CB98',
    borderWidth: 4,
    borderColor: '#555',
    borderRadius: 5,
    padding: 15,
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
  forgotPasswordText: {
    color: '#8B0000',
    fontSize: 11,
    textAlign: 'right',
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#5b21b6',
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
    color: '#a855f7',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  dpadContainer: {
    width: 80,
    height: 80,
    marginTop: 20,
    position: 'relative',
  },
  dpadVertical: {
    position: 'absolute',
    left: 27,
    top: 0,
    width: 26,
    height: 80,
    backgroundColor: '#222',
    borderRadius: 3,
  },
  dpadHorizontal: {
    position: 'absolute',
    top: 27,
    left: 0,
    width: 80,
    height: 26,
    backgroundColor: '#222',
    borderRadius: 3,
  }
});