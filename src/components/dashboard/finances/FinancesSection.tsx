import React, { useState } from 'react';
import Image from 'next/image';
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
      <div className="flex flex-col lg:flex-row shadow-sm border border-emerald-100 rounded-3xl overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 max-w-5xl mx-auto my-4 p-8 lg:p-12 gap-8 lg:gap-12 items-center lg:items-start">
        {/* Columna de la Imagen */}
        <div className="lg:w-1/3 flex flex-col items-center sticky top-8">
            <div className="relative w-64 h-72 md:w-80 md:h-96 lg:w-full lg:h-[420px] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                <Image 
                    src="/laura-freelancer.jpg"
                    alt="Laura - Freelancer DICILO"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    priority
                />
            </div>
            <div className="mt-8 bg-emerald-100 p-4 rounded-full text-emerald-600 shadow-sm hidden lg:flex">
              <Lock className="h-8 w-8" />
            </div>
        </div>

        {/* Columna de Contenido */}
        <div className="lg:w-2/3 flex flex-col justify-center items-start text-left w-full">
            <div className="bg-emerald-100 p-3 rounded-full mb-6 text-emerald-600 flex lg:hidden">
              <Lock className="h-6 w-6" />
            </div>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-800 mb-4 leading-tight">{t('finances.locked.title')}</h2>
            <h3 className="text-lg md:text-xl font-semibold text-emerald-700 mb-6">{t('finances.locked.subtitle')}</h3>
            <p className="text-slate-600 mb-8 text-base md:text-lg leading-relaxed">{t('finances.locked.p1')}</p>
            
            <div className="space-y-6 mb-8 w-full bg-white/60 p-6 rounded-2xl border border-emerald-50">
                <div>
                    <h4 className="font-bold text-slate-800 text-lg mb-2">{t('finances.locked.h1')}</h4>
                    <p className="text-slate-600 mb-3">{t('finances.locked.p2')}</p>
                    <ul className="list-none space-y-2 pl-0">
                        <li className="text-emerald-800 font-medium flex items-center bg-emerald-100/50 px-4 py-2.5 rounded-lg border border-emerald-100">{t('finances.locked.b1')}</li>
                        <li className="text-emerald-800 font-medium flex items-center bg-emerald-100/50 px-4 py-2.5 rounded-lg border border-emerald-100">{t('finances.locked.b2')}</li>
                    </ul>
                </div>
                
                <div className="pt-2">
                    <h4 className="font-bold text-slate-800 text-lg mb-2">{t('finances.locked.h2')}</h4>
                    <p className="text-slate-600 font-medium">{t('finances.locked.p3')}</p>
                </div>

                <div className="pt-2">
                    <h4 className="font-bold text-slate-800 text-lg mb-3">{t('finances.locked.h3')}</h4>
                    <ul className="list-none flex flex-wrap gap-2 pl-0">
                        <li className="bg-white border border-slate-200 px-4 py-2 rounded-full text-slate-700 text-sm font-semibold shadow-sm">{t('finances.locked.b3')}</li>
                        <li className="bg-white border border-slate-200 px-4 py-2 rounded-full text-slate-700 text-sm font-semibold shadow-sm">{t('finances.locked.b4')}</li>
                        <li className="bg-white border border-slate-200 px-4 py-2 rounded-full text-slate-700 text-sm font-semibold shadow-sm">{t('finances.locked.b5')}</li>
                    </ul>
                </div>
            </div>

            <div className="w-full bg-slate-900 px-6 py-5 rounded-xl text-center shadow-lg border border-slate-800">
                <p className="text-emerald-400 font-semibold text-sm md:text-base leading-snug">
                    {t('finances.locked.footer')}
                </p>
            </div>
        </div>
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
