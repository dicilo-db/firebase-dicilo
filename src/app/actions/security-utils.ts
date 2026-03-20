'use server';

/**
 * VirusTotal URL Analysis Action
 * Used to check the safety of external links before redirecting users.
 */
export async function checkUrlSafety(url: string) {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    
    if (!apiKey) {
        console.error("VIRUSTOTAL_API_KEY is not defined in environment variables.");
        return { success: false, error: "Servicio de seguridad no configurado." };
    }

    try {
        // VirusTotal uses a Base64 ID for URLs (without padding)
        const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
        
        const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
            headers: {
                'x-apikey': apiKey,
                'accept': 'application/json'
            }
        });

        if (response.status === 404) {
            // URL not found in VT database, we should probably submit it or just warn
            return { 
                success: true, 
                data: {
                    status: 'not_found',
                    message: 'Este enlace no ha sido analizado previamente por VirusTotal.'
                }
            };
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `VT API Error: ${response.status}`);
        }

        const result = await response.json();
        const stats = result.data.attributes.last_analysis_stats;
        
        // malicious, suspicious, harmless, undetected, timeout
        const isMalicious = stats.malicious > 0 || stats.suspicious > 0;
        
        return {
            success: true,
            data: {
                status: isMalicious ? 'dangerous' : 'safe',
                stats: stats,
                total_engines: Object.values(stats).reduce((a: any, b: any) => a + b, 0)
            }
        };

    } catch (error: any) {
        console.error("VirusTotal Check Error:", error);
        return { success: false, error: "Error al verificar la seguridad del enlace." };
    }
}
