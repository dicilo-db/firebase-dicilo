import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, LogBox } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

// Screens placeholder structure for Expo
import DashboardScreen from './src/screens/DashboardScreen';
import WalletScreen from './src/screens/WalletScreen';
import ReservationScreen from './src/screens/ReservationScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';

import { LayoutDashboard, Wallet, Coins, ShoppingBag, QrCode } from 'lucide-react-native';

// Ignore log warnings in dev
LogBox.ignoreLogs(['Setting a timer']);

const firebaseConfig = {
  projectId: 'geosearch-fq4i9',
  appId: '1:382703499489:web:88d6bf76f4cffe84d15fa0',
  storageBucket: 'geosearch-fq4i9.firebasestorage.app',
  apiKey: 'AIzaSyCCGBqtGt-sefut4RHfwaTs4bDGCfPjp9E', // Clave compartida de Dicilo.net
  authDomain: 'geosearch-fq4i9.firebaseapp.com',
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // Si no está autenticado, mostramos un Login Placeholder premium en React Native
  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.logoText}>DICIWALLET</Text>
        <Text style={styles.subtext}>Inicia sesión en Dicilo.net para acceder</Text>
        <View style={styles.loginSimulationBox}>
          <Text style={styles.simulationNotice}>
            Inicia sesión en la versión Web o en Dicilo.net.
            La aplicación móvil se conectará de inmediato a tu perfil y billetera circular compartida.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Dashboard') {
              return <LayoutDashboard color={color} size={size} />;
            } else if (route.name === 'Wallet') {
              return <Wallet color={color} size={size} />;
            } else if (route.name === 'Reservas') {
              return <Coins color={color} size={size} />;
            } else if (route.name === 'Market') {
              return <ShoppingBag color={color} size={size} />;
            } else if (route.name === 'Scan QR') {
              return <QrCode color={color} size={size} />;
            }
          },
          tabBarActiveTintColor: '#D4AF37',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#141416',
            borderTopColor: 'rgba(255,255,255,0.06)',
            paddingBottom: 5,
            height: 60
          },
          headerStyle: {
            backgroundColor: '#0B0B0C',
            borderBottomColor: 'rgba(255,255,255,0.06)'
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
            letterSpacing: 1
          }
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Wallet" component={WalletScreen} />
        <Tab.Screen name="Reservas" component={ReservationScreen} />
        <Tab.Screen name="Market" component={MarketplaceScreen} />
        <Tab.Screen name="Scan QR" component={QRScannerScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0B0C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#0B0B0C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 40,
  },
  loginSimulationBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 20,
  },
  simulationNotice: {
    color: '#E0E0E0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  }
});
