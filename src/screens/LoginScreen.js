import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Alert 
} from "react-native";
import LottieView from "lottie-react-native";
import { StatusBar } from "expo-status-bar";
import useTypingEffect from "../../hooks/useTypingEffect";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const typingText = useTypingEffect(
    [
      "Welcome!",       // English
      "स्वागत है!",     // Hindi
      "¡Bienvenido!",   // Spanish
      "Bienvenue!",     // French
      "Willkommen!",    // German
      "ようこそ!",       // Japanese
      "欢迎!",           // Chinese
      "Добро пожаловать!", // Russian
      "Bem-vindo!",     // Portuguese
    ],
    200, // typing speed
    1500 // pause before deleting
  );

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Login Success!", "You are now logged in.");
      navigation.navigate("Welcome");
    } catch (err) {
      Alert.alert("Login failed", err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hide/transparent status bar */}
      <StatusBar hidden />

      {/* Fullscreen Lottie Background */}
      <LottieView
              source={require("../../assets/animations/earthbg.json")}
              autoPlay
              loop
              resizeMode="cover"
               style={StyleSheet.absoluteFillObject}
            />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <Text style={styles.typingText}>{typingText}</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholderTextColor="#eee"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#eee"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.link}>Don’t have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black", // fallback if Lottie edges are transparent
  },
  background: {
    position: "absolute",
    width,
    height,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent overlay
  },
  input: { 
    backgroundColor: "#ffffff87", 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 15, 
    color: "white"
  },
  button: { 
    backgroundColor: "#52088bb0", 
    padding: 15, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  buttonText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  link: { 
    marginTop: 15, 
    textAlign: "center", 
    color: "green" 
  },
  typingText: {
    fontSize: 30,
    color: "white",
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "bold",
  },
});
