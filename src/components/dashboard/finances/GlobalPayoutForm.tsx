import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Save, Loader2, RefreshCw, Globe } from 'lucide-react';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { LEGAL_TERMS } from './FinancesSection';

const INFO_TEXT: Record<string, string[]> = {
  es: [
    "Configure una cuenta bancaria internacional para recibir pagos desde Dicilo directamente a su país.",
    "Países donde podemos enviar sus bonos/provisiones:",
    "América: Estados Unidos, México, Brasil, Chile, Colombia, Canadá.",
    "Asia y Oceanía: Australia, Nueva Zelanda, Singapur, Japón, India, China, Tailandia, Emiratos Árabes Unidos."
  ],
  en: [
    "Configure an international bank account to receive payouts from Dicilo directly to your country.",
    "Countries where we can send your bonuses/commissions:",
    "Americas: United States, Mexico, Brazil, Chile, Colombia, Canada.",
    "Asia & Oceania: Australia, New Zealand, Singapore, Japan, India, China, Thailand, United Arab Emirates."
  ],
  de: [
    "Richten Sie ein internationales Bankkonto ein, um Zahlungen von Dicilo direkt in Ihrem Land zu erhalten.",
    "Länder, in die wir Ihre Boni/Provisionen senden können:",
    "Amerika: USA, Mexiko, Brasilien, Chile, Kolumbien, Kanada.",
    "Asien & Ozeanien: Australien, Neuseeland, Singapur, Japan, Indien, China, Thailand, Vereinigte Arabische Emirate."
  ]
};

const PAYOUT_CONFIG = {
  languages: ["es", "en", "de"],
  groups: {
    EURO_SEPA: {
      countries: ["AT", "BE", "BG", "CY", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "CH"],
      labels: {
        es: "Europa (SEPA) & Suiza",
        en: "Europe (SEPA) & Switzerland",
        de: "Europa (SEPA) & Schweiz"
      },
      fields: [
        { id: "bank_name", label: { es: "Nombre del Banco", en: "Bank Name", de: "Name der Bank" }, placeholder: "Ej: Revolut, Santander, Deutsche Bank" },
        { id: "account_holder", label: { es: "Titular de la cuenta", en: "Account Holder", de: "Kontoinhaber" }, placeholder: "Nombre completo / Full Name" },
        { id: "iban", label: { es: "IBAN", en: "IBAN", de: "IBAN" }, placeholder: "ES21 XXXX..." },
        { id: "bic_swift", label: { es: "Código BIC/SWIFT", en: "BIC/SWIFT Code", de: "BIC/SWIFT-Code" }, placeholder: "8-11 caracteres" }
      ]
    },
    UNITED_KINGDOM: {
      countries: ["GB"],
      labels: {
        es: "Reino Unido",
        en: "United Kingdom",
        de: "Vereinigtes Königreich"
      },
      fields: [
        { id: "bank_name", label: { es: "Nombre del Banco", en: "Bank Name", de: "Name der Bank" } },
        { id: "account_holder", label: { es: "Titular de la cuenta", en: "Account Holder", de: "Kontoinhaber" } },
        { id: "sort_code", label: { es: "Sort Code", en: "Sort Code", de: "Sort Code" }, placeholder: "XX-XX-XX" },
        { id: "account_number", label: { es: "Número de Cuenta", en: "Account Number", de: "Kontonummer" }, placeholder: "8 dígitos" }
      ]
    },
    GLOBAL_MARKETS: {
      countries: ["US", "AU", "BR", "JP", "SG", "NZ", "OTHER"],
      labels: {
        es: "Internacional (USA, Australia, Brasil, etc.)",
        en: "International (USA, Australia, Brazil, etc.)",
        de: "International (USA, Australien, Brasilien, etc.)"
      },
      fields: [
        { id: "bank_name", label: { es: "Nombre del Banco", en: "Bank Name", de: "Name der Bank" } },
        { id: "account_holder", label: { es: "Titular de la cuenta", en: "Account Holder", de: "Kontoinhaber" } },
        { id: "global_id", label: { es: "Número de Cuenta / CLABE / ABA / Routing", en: "Account Number / CLABE / ABA / Routing", de: "Kontonummer / CLABE / ABA / Routing" } },
        { id: "bic_swift", label: { es: "Código BIC/SWIFT (Obligatorio)", en: "BIC/SWIFT Code (Required)", de: "BIC/SWIFT-Code (Erforderlich)" } },
        { id: "full_address", label: { es: "Dirección física del titular", en: "Account holder's physical address", de: "Physische Adresse des Inhabers" }, placeholder: "Calle, Ciudad, Código Postal, País" },
        { id: "currency", label: { es: "Moneda de la cuenta", en: "Account Currency", de: "Kontowährung" }, placeholder: "USD, MXN, BRL, etc." }
      ]
    },
    PAYPAL: {
      labels: {
        es: "PayPal (Global)",
        en: "PayPal (Global)",
        de: "PayPal (Global)"
      },
      fields: [
        {
          id: "paypal_email",
          label: { es: "Correo electrónico de PayPal", en: "PayPal Email Address", de: "PayPal E-Mail-Adresse" },
          placeholder: "email@example.com",
          type: "email"
        },
        {
          id: "account_holder",
          label: { es: "Nombre completo del titular", en: "Full Name of Holder", de: "Vollständiger Name des Inhabers" }
        }
      ]
    },
    ZELLE: {
      labels: {
        es: "Zelle (Solo USA)",
        en: "Zelle (USA Only)",
        de: "Zelle (Nur USA)"
      },
      fields: [
        {
          id: "zelle_id",
          label: { es: "Correo o Teléfono vinculado a Zelle", en: "Email or Phone linked to Zelle", de: "E-Mail oder Telefon mit Zelle verknüpft" },
          placeholder: "email@example.com / +1...",
          type: "text"
        },
        {
          id: "account_holder",
          label: { es: "Nombre completo del titular", en: "Full Name of Holder", de: "Vollständiger Name des Inhabers" }
        }
      ]
    }
  }
};

interface GlobalPayoutFormProps {
  user: any;
  onSwitchMode: () => void;
}

export function GlobalPayoutForm({ user, onSwitchMode }: GlobalPayoutFormProps) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const db = getFirestore(app);
  
  const [isSaving, setIsSaving] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});

  const rawLang = (i18n.language || 'es').substring(0, 2);
  const lang = ['es', 'en', 'de'].includes(rawLang) ? (rawLang as 'es' | 'en' | 'de') : 'es';

  // Load existing data if available
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      const ref = doc(db, 'user_payout_methods', user.uid);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.group) setSelectedGroup(data.group);
        if (data.details) setFormData(data.details);
      }
    };
    fetchData();
  }, [user, db]);

  const handleGroupChange = (groupKey: string) => {
    setSelectedGroup(groupKey);
    // Reset form data when switching groups
    setFormData({});
  };

  const handleChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const onSave = async () => {
    if (!user?.uid || !selectedGroup) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'user_payout_methods', user.uid), {
        uid: user.uid,
        email: user.email,
        group: selectedGroup,
        details: formData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: lang === 'es' ? 'Datos guardados' : lang === 'de' ? 'Daten gespeichert' : 'Data saved',
        description: lang === 'es' ? 'Sus datos de cobro internacional han sido guardados exitosamente.' :
                     lang === 'de' ? 'Ihre internationalen Zahlungsdaten wurden erfolgreich gespeichert.' :
                     'Your international payout data has been saved successfully.',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: String(e),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeGroup = selectedGroup ? PAYOUT_CONFIG.groups[selectedGroup as keyof typeof PAYOUT_CONFIG.groups] : null;

  return (
    <Card className="border-indigo-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <CardHeader className="bg-indigo-50/30 border-b relative pb-4 pt-6 flex flex-col md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            International Global Payout
          </CardTitle>
          <CardDescription className="mt-1 space-y-1">
            <span className="block text-slate-600 font-medium">
              {(INFO_TEXT[lang] || INFO_TEXT['es'])[0]}
            </span>
            <span className="block text-slate-500 text-xs mt-2 font-semibold">
              {(INFO_TEXT[lang] || INFO_TEXT['es'])[1]}
            </span>
            <span className="block text-slate-500 text-xs text-balance">
              <span className="font-medium mr-1">•</span>{(INFO_TEXT[lang] || INFO_TEXT['es'])[2]}
            </span>
            <span className="block text-slate-500 text-xs text-balance">
              <span className="font-medium mr-1">•</span>{(INFO_TEXT[lang] || INFO_TEXT['es'])[3]}
            </span>
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onSwitchMode} className="mt-4 md:mt-0 flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-9">
          <RefreshCw className="h-4 w-4" />
          {lang === 'es' ? 'Cambiar a Venezuela' : lang === 'de' ? 'Zu Venezuela wechseln' : 'Switch to Venezuela'}
        </Button>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-slate-700">
            {lang === 'es' ? 'Seleccione su región o bloque económico' : lang === 'de' ? 'Wählen Sie Ihre Region oder Ihren Wirtschaftsblock' : 'Select your region or economic bloc'}
          </Label>
          <Select value={selectedGroup} onValueChange={handleGroupChange}>
            <SelectTrigger className="w-full md:w-2/3 border-indigo-100 bg-white">
              <SelectValue placeholder={lang === 'es' ? 'Seleccione' : lang === 'de' ? 'Auswählen' : 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYOUT_CONFIG.groups).map(([key, groupData]) => (
                <SelectItem key={key} value={key} className="cursor-pointer">
                  {groupData.labels[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeGroup && (
          <div className="pt-6 border-t border-slate-100 animate-in fade-in duration-300">
            <h3 className="font-medium text-slate-800 mb-4 pb-2 border-b border-indigo-50">
              Datos requeridos para: {activeGroup.labels[lang]}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
              {activeGroup.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-slate-600 font-medium">{field.label[lang]}</Label>
                  <Input
                    id={field.id}
                    type={(field as any).type || 'text'}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={(field as any).placeholder || ''}
                    className="border-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            <div className="border-t pt-6 space-y-6 mt-8">
              {(() => {
                const legalText = LEGAL_TERMS[lang] || LEGAL_TERMS['es'];
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">{legalText.title}</h3>
                    <div className="text-xs text-slate-600 space-y-2 mb-5 max-h-48 overflow-y-auto pr-2">
                      {legalText.paras.map((p: string, idx: number) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                    <div className="flex items-start space-x-3 pt-4 border-t border-slate-200">
                      <Checkbox 
                        id="global-legal-terms" 
                        checked={legalAccepted} 
                        onCheckedChange={(checked) => setLegalAccepted(checked as boolean)} 
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="global-legal-terms"
                          className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {lang === 'es' ? 'He leído y acepto la Declaración legal y condiciones' : 
                           lang === 'de' ? 'Ich habe die rechtliche Erklärung und Bedingungen gelesen und akzeptiere sie' : 
                           'I have read and accept the Legal Declaration and terms'}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end pt-4">
                <Button onClick={onSave} disabled={isSaving || !legalAccepted} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {lang === 'es' ? 'Guardar Método Payout' : lang === 'de' ? 'Auszahlungsmethode Speichern' : 'Save Payout Method'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
