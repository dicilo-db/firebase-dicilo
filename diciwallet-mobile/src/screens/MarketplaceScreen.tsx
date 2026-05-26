import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

export default function MarketplaceScreen() {
  return (
    <View style={styles.container}>
      <ShoppingBag color="#D4AF37" size={48} />
      <Text style={styles.title}>Marketplace Interno</Text>
      <Text style={styles.text}>
        El mercado interno para comprar y vender participaciones de DiciCoins en curso de pago está disponible en la versión web de DiciWallet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  text: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  }
});
