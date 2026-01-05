export interface Prospect {
    id?: string;
    businessName: string; // The scanned name
    address?: string; // OCR Address
    phone?: string; // OCR Phone
    email?: string; // OCR Email
    website?: string; // OCR Website

    // Categorization
    category?: string;
    subcategory?: string; // SQL: subcategoria

    // Status & Logic
    isActive: boolean; // SQL: business_active (0=Pending, 1=Active)

    // Geolocation
    coordinates?: {
        lat: number;
        lng: number;
    }; // SQL: coordenadas

    // Recruiter / Agent Info
    recruiterId: string; // SQL: id_reclutador
    recruiterName?: string; // SQL: nombre_reclutador

    // B2B Logic
    leadDestination: 'DICILO' | 'CLIENTE' | 'AMBOS'; // SQL: destino_lead
    clientCompanyId?: string; // SQL: id_empresa_cliente (The company paying for the lead)
    clientCompanyName?: string; // SQL: nombre_empresa_cliente

    // Metadata
    createdAt: string; // ISO String
    updatedAt: string; // ISO String

    // Reporting
    reportGeneratedAt?: string | null; // SQL: fecha_reporte_generado

    // OCR Metadata (Optional)
    ocrRawData?: string;
    photoUrl?: string; // Card image
    interest?: 'Basic' | 'Starter' | 'Minorista' | 'Premium';
}
