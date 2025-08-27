import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions,Alert} from "react-native";
import LottieView from "lottie-react-native";
import useTypingEffect from "../../hooks/useTypingEffect";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

const { width, height } = Dimensions.get("window");
export default function SignupScreen({ navigation }) {
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
    const handleSignup = async () => {
        try {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Signup Success!", "You can now log in.");
        navigation.navigate("Login");
        } catch (err) {
        Alert.alert("Signup failed", err.message);
        }
    };

  return (

    <View style={styles.container}>
         {/* Background Animation */}
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
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
          
                <TouchableOpacity style={styles.button} onPress={handleSignup}>
                <Text style={styles.buttonText}>Create Account</Text>
                </TouchableOpacity>
          
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.link}>Already have an account? Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      
      const styles = StyleSheet.create({
        container: {
        flex: 1,
        backgroundColor: "black", // fallback if animation has transparent edges
        },
        background: { position: "absolute", width, height },
        overlay: {
          flex: 1,
          justifyContent: "center",
          padding: 20,
          backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent overlay
        },
        title: { fontSize: 28, fontWeight: "bold", color: "white", textAlign: "center", marginBottom: 30 },
        input: { backgroundColor: "#ffffff87", padding: 12, borderRadius: 8, marginBottom: 15 },
        button: { backgroundColor: "#52088bb0", padding: 15, borderRadius: 8, alignItems: "center" },
        buttonText: { color: "white", fontSize: 16, fontWeight: "bold"},
        link: { marginTop: 15, textAlign: "center", color: "green" },
        typingText: {
            fontSize: 30,
            color: "white",
            textAlign: "center",
            marginBottom: 30,
            fontWeight: "bold",
        },
      });
