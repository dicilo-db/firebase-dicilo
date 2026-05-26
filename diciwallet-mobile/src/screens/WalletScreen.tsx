import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Wallet } from 'lucide-react-native';

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <Wallet color="#D4AF37" size={48} />
      <Text style={styles.title}>Mi Wallet Circular</Text>
      <Text style={styles.text}>
        Accede a la versión Web de DiciWallet para realizar conversiones de DP a DC y auditar tus movimientos en tiempo real.
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
