import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AppContextProvider } from './src/contexts/AppContext';

import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import PlaceDetailsScreen from './src/screens/PlaceDetailsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AppContextProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#667eea" />
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#667eea',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
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
        </Stack.Navigator>
      </NavigationContainer>
    </AppContextProvider>
  );
}