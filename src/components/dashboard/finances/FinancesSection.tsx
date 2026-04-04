import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Lock, Save, Loader2, Upload } from 'lucide-react';

const BANKS = [
  "Totalbank", "Sofioccidente Banco de Inversion", "Provivienda", "Novo Banco, S.A", "Mi banco",
  "Instituto Municipal de Credito Popular", "Helm Bank de Venezuela", "Grupo Financiero Nuevo Mundo",
  "Coporacion Banacaria", "Banpro", "Banorte", "Banco Confederados", "Banco Nuevo Mundo",
  "Banco Coro", "Banfoandes", "Banco Venezolano de Credito", "Banco Universal", "Banco Unibanca",
  "Banco Plaza", "Banco Noroco", "Banco Inverbanco", "Banco Internacional de Desarrollo", 
  "Banco Guayana", "Banco do Brasil", "Banco del Pluebo Soberano", "Banco del Centro", 
  "Banco Industrial de Venezuela", "Banco de la Fuerza Armada Nacional Bolivariana, B.U.", 
  "Banco de chavez", "Banco Central de Venezuela", "Banco Caracas", "Banco Bolivar", 
  "Banco Bancrecer", "Banco Agricola de Venezuela", "Bancamiga C.A", "ABN Anro Bank", 
  "Banco 100% Banco", "Banco Citibank", "Banco Sofitasa", "Banco Exterior", "Banco del Caribe", 
  "Banco Corpbanca", "Banco Canarias", "Banco Banvalor", "Banco Bangente", "Banco Activo", 
  "Banco Bicentenario", "Banco del Sur", "Banco Occidental de Descuento", "Banco Fondo Comun", 
  "Banco Nacional de Credito", "Bancaribe", "Banco del Tesoro", "Banco Caroni", "Banplus", 
  "Banco de Venezuela", "Banco Provincial", "Banesco", "Banco Mercantil"
];

const DESTINATION_COUNTRIES = [
  "USA - (ZELLE)",
  "Venezuela - (Transferencia)",
  "PayPal - (Euros o dólares)",
  "Europa - (SEPA)",
  "Venezuela-Caracas - (Entrega de dolares en efectivo por taquilla)"
];

const DOCUMENT_TYPES = [
  { value: "V", label: "V - Venezolano" },
  { value: "E", label: "E - Extranjero" },
  { value: "J", label: "J - Juridico" },
  { value: "G", label: "G - Gubernamental" },
  { value: "P", label: "P - Pasaporte" }
];

interface FinancesSectionProps {
  user: any;
  profile: any;
  handleUpdate: (key: string, data: any) => Promise<void>;
}

export function FinancesSection({ user, profile, handleUpdate }: FinancesSectionProps) {
  const { t } = useTranslation(['common', 'admin']);
  const [isSaving, setIsSaving] = useState(false);
  const financialData = profile?.financialData || {};

  const [formData, setFormData] = useState({
    firstName: financialData.firstName || profile?.firstName || '',
    lastName: financialData.lastName || profile?.lastName || '',
    destinationCountry: financialData.destinationCountry || '',
    docType: financialData.docType || '',
    docNumber: financialData.docNumber || '',
    bank: financialData.bank || '',
    accountType: financialData.accountType || 'Ahorro',
    accountNumber: financialData.accountNumber || '',
    beneficiaryFirstName: financialData.beneficiaryFirstName || '',
    beneficiaryLastName: financialData.beneficiaryLastName || '',
    email: financialData.email || profile?.email || user?.email || '',
    fixedPhone: financialData.fixedPhone || '',
    mobilePhone: financialData.mobilePhone || profile?.phone || '',
    idDocumentUrl: financialData.idDocumentUrl || ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      await handleUpdate('financialData', { financialData: formData });
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if user has access (freelancer +)
  const isFreelancerOrSuperior = 
    ['freelancer', 'team_leader', 'manager', 'admin', 'superadmin', 'SuperAdmin'].includes(profile?.role?.toLowerCase() || '') || 
    (profile?.referrals?.length >= 10);

  if (!isFreelancerOrSuperior) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border rounded-xl shadow-sm min-h-[400px]">
        <div className="bg-slate-200 p-4 rounded-full mb-6">
          <Lock className="h-10 w-10 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">{t('finances.lockedTitle')}</h2>
        <p className="text-lg text-slate-700 max-w-2xl mb-4 font-medium">
          {t('finances.lockedSubtitle')}
        </p>
        <p className="text-slate-600 max-w-3xl leading-relaxed">
          {t('finances.lockedDesc')}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-emerald-100 shadow-sm">
      <CardHeader className="bg-emerald-50/50 border-b">
        <CardTitle className="text-xl text-emerald-800">{t('finances.formTitle')}</CardTitle>
        <CardDescription>
          {t('finances.formDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* Nombres Completos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
          <div className="space-y-2">
            <Label>{t('finances.names')}</Label>
            <Input 
              value={formData.firstName} 
              onChange={(e) => handleChange('firstName', e.target.value)} 
              placeholder={t('finances.namesPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('finances.lastnames')}</Label>
            <Input 
              value={formData.lastName} 
              onChange={(e) => handleChange('lastName', e.target.value)} 
              placeholder={t('finances.lastnamesPlaceholder')}
            />
          </div>
        </div>

        {/* Destino y Documento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('finances.countryDestLabel')}</Label>
            <Select value={formData.destinationCountry} onValueChange={(val) => handleChange('destinationCountry', val)}>
              <SelectTrigger>
                <SelectValue placeholder={t('finances.countryDestPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {DESTINATION_COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>{t('finances.docTypeLabel')}</Label>
              <Select value={formData.docType} onValueChange={(val) => handleChange('docType', val)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.docTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(doc => (
                    <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('finances.docNumberLabel')}</Label>
              <Input 
                value={formData.docNumber} 
                onChange={(e) => handleChange('docNumber', e.target.value)} 
                placeholder="Ej. 12345678"
              />
            </div>
          </div>
        </div>

        {/* Datos Bancarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
          <div className="space-y-2">
            <Label>{t('finances.bankLabel')}</Label>
            <Select value={formData.bank} onValueChange={(val) => handleChange('bank', val)}>
              <SelectTrigger>
                <SelectValue placeholder={t('finances.bankPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>{t('finances.accountTypeLabel')}</Label>
            <RadioGroup 
              value={formData.accountType} 
              onValueChange={(val) => handleChange('accountType', val)}
              className="flex items-center space-x-4 pt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Ahorro" id="Ahorro" />
                <Label htmlFor="Ahorro" className="font-normal cursor-pointer">{t('finances.savings')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Corriente" id="Corriente" />
                <Label htmlFor="Corriente" className="font-normal cursor-pointer">{t('finances.checking')}</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{t('finances.accountNumberLabel')}</Label>
            <Input 
              value={formData.accountNumber} 
              onChange={(e) => handleChange('accountNumber', e.target.value)} 
              placeholder="0000-0000-0000-0000-0000"
            />
          </div>
        </div>

        {/* Beneficiario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
          <div className="space-y-2">
            <Label>{t('finances.beneFirstLabel')}</Label>
            <Input 
              value={formData.beneficiaryFirstName} 
              onChange={(e) => handleChange('beneficiaryFirstName', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>{t('finances.beneLastLabel')}</Label>
            <Input 
              value={formData.beneficiaryLastName} 
              onChange={(e) => handleChange('beneficiaryLastName', e.target.value)} 
            />
          </div>
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('finances.emailLabel')}</Label>
            <Input 
              type="email"
              value={formData.email} 
              onChange={(e) => handleChange('email', e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>{t('finances.fixedPhoneLabel')}</Label>
              <Input 
                value={formData.fixedPhone} 
                onChange={(e) => handleChange('fixedPhone', e.target.value)} 
                placeholder="(XXXX)"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('finances.mobilePhoneLabel')}</Label>
              <Input 
                value={formData.mobilePhone} 
                onChange={(e) => handleChange('mobilePhone', e.target.value)} 
                placeholder="XXX XXX XX XX"
              />
            </div>
          </div>
        </div>

        {/* Documento subida */}
        <div className="border-t pt-6">
          <Label className="block mb-2">{t('finances.docUploadMsg')}</Label>
          <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-slate-50">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept="image/*,.pdf"
              onChange={(e) => {
                // Future integration to upload to Firebase Storage
                if (e.target.files && e.target.files[0]) {
                  alert("Seleccionado: " + e.target.files[0].name + ". La subida a almacenamiento estará disponible en la capa de Backend.");
                }
              }}
            />
            <Label htmlFor="file-upload" className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg cursor-pointer hover:bg-emerald-200 transition-colors">
              <Upload className="h-4 w-4" /> {t('finances.selectFile')}
            </Label>
            <span className="text-sm text-slate-500">{t('finances.noFileSelected')}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end pt-4">
          <Button onClick={onSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('finances.saveData')}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
