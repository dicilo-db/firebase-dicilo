import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Award, Gem, Coins, AlertCircle } from 'lucide-react-native';

interface UserWallet {
  balance: number;
  balanceDC: number;
  totalPaidEur: number;
}

interface Reservation {
  id: string;
  coinId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  status: string;
}

export default function DashboardScreen() {
  const auth = getAuth();
  const db = getFirestore();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Escuchar la wallet
    const walletRef = doc(db, 'wallets', user.uid);
    const unsubscribeWallet = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWallet({
          balance: data.balance || 0,
          balanceDC: data.balanceDC || 0,
          totalPaidEur: data.totalPaidEur || 0
        });
      }
    });

    // Escuchar reservas
    const q = query(
      collection(db, 'coin_reservations'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
    const unsubscribeRes = onSnapshot(q, (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Reservation);
      });
      setReservations(list);
      setLoading(false);
    });

    return () => {
      unsubscribeWallet();
      unsubscribeRes();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcomeText}>Hola, de nuevo</Text>
      <Text style={styles.subtext}>Tu resumen financiero circular</Text>

      {/* Balance Grid */}
      <View style={styles.balanceGrid}>
        {/* DP Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Puntos DP</Text>
            <Award color="#00E5FF" size={20} />
          </View>
          <Text style={styles.cardValue}>{wallet?.balance?.toLocaleString() || '0'}</Text>
          <Text style={styles.cardFooter}>Actividad Dicilo.net</Text>
        </View>

        {/* DC Card */}
        <View style={[styles.card, styles.goldBorder]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>DiciCoins</Text>
            <Gem color="#D4AF37" size={20} />
          </View>
          <Text style={[styles.cardValue, styles.goldText]}>{wallet?.balanceDC?.toLocaleString() || '0'}</Text>
          <Text style={styles.cardFooter}>1 DC = 1 EUR interno</Text>
        </View>

        {/* EUR Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Euros Pagados</Text>
            <Text style={styles.eurIcon}>€</Text>
          </View>
          <Text style={styles.cardValue}>{wallet?.totalPaidEur?.toLocaleString() || '0'} €</Text>
          <Text style={styles.cardFooter}>En monedas físicas</Text>
        </View>
      </View>

      {/* Plan de pagos */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Planes de Pago Activos</Text>
      </View>

      {reservations.length === 0 ? (
        <View style={styles.emptyBox}>
          <Coins color="#4E4E54" size={32} />
          <Text style={styles.emptyText}>No tienes reservas activas de monedas.</Text>
        </View>
      ) : (
        reservations.map((res) => (
          <View key={res.id} style={styles.reservationBox}>
            <View style={styles.resHeader}>
              <Text style={styles.resTitle}>{res.coinId}</Text>
              <Text style={styles.resMeta}>{res.paidAmount} € / {res.totalAmount} €</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${res.progressPercentage}%` }]} />
            </View>
            <Text style={styles.resFooter}>Faltan {res.remainingAmount} € para propiedad definitiva</Text>
          </View>
        ))
      )}

      {/* Legal Notice */}
      <View style={styles.legalBox}>
        <AlertCircle color="#D4AF37" size={20} style={styles.legalIcon} />
        <View style={styles.legalContent}>
          <Text style={styles.legalTitle}>EXENCIÓN DE RESPONSABILIDAD</Text>
          <Text style={styles.legalText}>
            DiciCoin es un activo de colección de economía circular interna. No garantiza rentabilidad ni reventa. No constituye inversión regulada.
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0B0C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceGrid: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 20,
  },
  goldBorder: {
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  goldText: {
    color: '#D4AF37',
  },
  cardFooter: {
    fontSize: 12,
    color: '#4E4E54',
  },
  eurIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyBox: {
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  reservationBox: {
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  resHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resMeta: {
    color: '#8E8E93',
    fontSize: 13,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
    borderRadius: 3,
  },
  resFooter: {
    fontSize: 11,
    color: '#4E4E54',
  },
  legalBox: {
    backgroundColor: 'rgba(212,175,55,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  legalIcon: {
    marginTop: 2,
  },
  legalContent: {
    flex: 1,
  },
  legalTitle: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  legalText: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 16,
  }
});
