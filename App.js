import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import { AppContextProvider, useAppContext } from './src/contexts/AppContext';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import PlaceDetailsScreen from './src/screens/PlaceDetailsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignUpScreen';

const Stack = createStackNavigator();

// Create a separate component for the authenticated navigation
function AuthenticatedApp() {
  const { state } = useAppContext();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#667eea' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {state.hasCompletedOnboarding ? (
        // User has completed onboarding → go to Home first
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
        // User hasn't completed onboarding → show Welcome first
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
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return null; // Or show a splash/loading screen

  return (
    <AppContextProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#667eea" />
        {user ? (
          <AuthenticatedApp />
        ) : (
          // Not logged in → show Auth screens
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#667eea' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
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
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </AppContextProvider>
  );
}