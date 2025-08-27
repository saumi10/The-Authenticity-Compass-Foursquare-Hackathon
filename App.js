import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppContextProvider } from './src/contexts/AppContext';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import PlaceDetailsScreen from './src/screens/PlaceDetailsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignUpScreen';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);

        // Check if this user has already completed onboarding
        const flag = await AsyncStorage.getItem(`onboardingDone_${u.uid}`);
        setHasSeenWelcome(!!flag);
      } else {
        setUser(null);
        setHasSeenWelcome(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return null; // Or show a splash/loading screen

  return (
    <AppContextProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#667eea" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          {user ? (
            hasSeenWelcome ? (
              // User already onboarded → skip Welcome initially but keep it available
              <>
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen}
                  options={{
                    title: 'Authenticity Compass',
                    headerLeft: null,
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen 
                  name="Welcome" 
                  component={WelcomeScreen}
                  options={{ 
                    title: 'Update Preferences',
                    headerShown: true
                  }}
                />
                <Stack.Screen 
                  name="Results" 
                  component={ResultsScreen}
                  options={{ title: 'Search Results' }}
                />
                <Stack.Screen 
                  name="PlaceDetails" 
                  component={PlaceDetailsScreen}
                  options={{ title: 'Place Details' }}
                />
              </>
            ) : (
              // User logged in but not onboarded → show Welcome first
              <>
                <Stack.Screen 
                  name="Welcome" 
                  component={WelcomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen}
                  options={{
                    title: 'Authenticity Compass',
                    headerLeft: null,
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen 
                  name="Results" 
                  component={ResultsScreen}
                  options={{ title: 'Search Results' }}
                />
                <Stack.Screen 
                  name="PlaceDetails" 
                  component={PlaceDetailsScreen}
                  options={{ title: 'Place Details' }}
                />
              </>
            )
          ) : (
            // Not logged in → show Auth screens
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Signup" 
                component={SignupScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppContextProvider>
  );
}