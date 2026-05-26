import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Coins } from 'lucide-react-native';

export default function ReservationScreen() {
  return (
    <View style={styles.container}>
      <Coins color="#00E5FF" size={48} />
      <Text style={styles.title}>Reservar DiciCoin</Text>
      <Text style={styles.text}>
        El catálogo de monedas y el plan de pagos de tus reservas activas se gestionan de forma segura desde la aplicación web.
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
