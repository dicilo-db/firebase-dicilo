import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Camera, QrCode, ShieldCheck, AlertTriangle } from 'lucide-react-native';

interface CoinData {
  id: string;
  serial: string;
  continent: string;
  status: string;
  valueEur: number;
  paidAmount: number;
  shippingInfo?: {
    fullName: string;
    country: string;
    city: string;
    address: string;
  };
}

export default function QRScannerScreen() {
  const db = getFirestore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [coinInfo, setCoinInfo] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulación de escáner para MVP móvil sin cámara real en Expo Go a veces
  const simulateScan = async (coinId: string) => {
    setLoading(true);
    setScanned(true);
    setErrorMsg('');
    setCoinInfo(null);

    try {
      const docRef = doc(db, 'dici_coins', coinId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setCoinInfo({
          id: coinId,
          serial: data.serial || 'N/A',
          continent: data.continent || 'EU',
          status: data.status || 'available',
          valueEur: data.valueEur || 5000,
          paidAmount: data.paidAmount || 0,
          shippingInfo: data.shippingInfo || undefined
        });
      } else {
        setErrorMsg('Esta moneda no está dada de alta en el sistema de DiciCoin.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al consultar la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificador QR</Text>
      <Text style={styles.subtitle}>Escanea el código QR de una moneda física para verificar su autenticidad.</Text>

      {/* Camera box simulation */}
      {!scanned ? (
        <View style={styles.scannerBox}>
          <QrCode color="#4E4E54" size={80} />
          <Text style={styles.scannerText}>Cámara lista para escanear</Text>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={() => simulateScan('EU-DC0000001')} // Simula escanear la primera moneda del catálogo
          >
            <Text style={styles.scanButtonText}>Simular Escaneo (EU-DC0000001)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultBox}>
          {loading ? (
            <ActivityIndicator size="large" color="#D4AF37" />
          ) : errorMsg ? (
            <View style={styles.errorContainer}>
              <AlertTriangle color="#EB5757" size={48} />
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => setScanned(false)}>
                <Text style={styles.retryButtonText}>Escanear de Nuevo</Text>
              </TouchableOpacity>
            </View>
          ) : coinInfo ? (
            <View style={styles.infoContainer}>
              <ShieldCheck color="#2ECC71" size={48} style={styles.verifiedIcon} />
              <Text style={styles.verifiedText}>DiciCoin Auténtica</Text>
              
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={styles.label}>Identificador:</Text>
                  <Text style={styles.value}>{coinInfo.id}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.label}>Serial Único:</Text>
                  <Text style={styles.value}>{coinInfo.serial}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.label}>Continente:</Text>
                  <Text style={styles.value}>{(() => {
                    const continentNames: {[key: string]: string} = {
                      'EU': 'Europa',
                      'LA': 'America',
                      'AF': 'África',
                      'AS': 'Asia',
                      'OC': 'Oceanía'
                    };
                    return continentNames[coinInfo.continent] || coinInfo.continent;
                  })()}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.label}>Estado:</Text>
                  <Text style={styles.value}>{coinInfo.status.toUpperCase()}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.label}>Valor:</Text>
                  <Text style={styles.value}>{coinInfo.valueEur} €</Text>
                </View>
                {coinInfo.shippingInfo && (
                  <>
                    <View style={styles.tableRow}>
                      <Text style={styles.label}>Titular:</Text>
                      <Text style={styles.value}>{coinInfo.shippingInfo.fullName}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.label}>Destino:</Text>
                      <Text style={styles.value}>
                        {`${coinInfo.shippingInfo.address}, ${coinInfo.shippingInfo.city}, ${coinInfo.shippingInfo.country}`}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity style={styles.retryButton} onPress={() => setScanned(false)}>
                <Text style={styles.retryButtonText}>Escanear Otra Moneda</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 18,
  },
  scannerBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#141416',
    borderWidth: 2,
    borderColor: '#4E4E54',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 24,
  },
  scannerText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  scanButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  scanButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultBox: {
    width: '100%',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 24,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#EB5757',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4E4E54',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  verifiedIcon: {
    marginBottom: 8,
  },
  verifiedText: {
    color: '#2ECC71',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 24,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    color: '#8E8E93',
    fontSize: 13,
  },
  value: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  }
});
