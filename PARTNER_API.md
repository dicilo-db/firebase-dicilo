# Dicilo Partner API — Ayuda Venezuela

Connect your organization with the global Dicilo relief network for the June 2026 Venezuela earthquake response.

**Campaign page:** https://dicilo.net/la-comunidad/apoyo-vzla  
**Contact:** info@dicilo.net

---

## Getting an API Key

Send an email to **info@dicilo.net** with:
- Organization name
- Type (NGO, Red Cross, government, volunteer group, etc.)
- Geographic zone you operate in
- Brief description of your activities

You will receive your `X-Dicilo-Key` within 24 hours.

---

## Endpoints

### GET /api/apoyo-vzla — Campaign data (public, no auth)

Returns campaign metadata, donation info, and approved field reports.

```
GET https://dicilo.net/api/apoyo-vzla
```

**Response:**
```json
{
  "campaign": {
    "title": "Ayuda Venezuela · Terremoto 24 junio 2026",
    "status": "active",
    "startDate": "2026-06-24",
    "url": "https://dicilo.net/la-comunidad/apoyo-vzla",
    "description": "...",
    "donate": {
      "revolut": "https://revolut.me/mileniummv",
      "bank": {
        "beneficiary": "MILENIUM HOLDING & CONSULTING UG",
        "iban": "DE57200400600528459800",
        "bic": "COBADEFFXXX",
        "bank": "Commerzbank",
        "reference": "Ayuda Humanitaria Venezuela"
      },
      "usdt_trc20": "TNDSBiuZPXgfDKJLMnWxYrugMrMmBFqxh6"
    }
  },
  "fieldReports": [
    {
      "id": "abc123",
      "org": "Cruz Roja Local",
      "orgType": "redcross",
      "zone": "Cumaná, Sucre",
      "message": "Distribuidas 500 raciones de alimentos en el sector Las Piedras.",
      "category": "food",
      "peopleHelped": 500,
      "createdAt": "2026-06-25T14:30:00.000Z"
    }
  ],
  "api": {
    "version": "1.0",
    "submitReport": "https://dicilo.net/api/apoyo-vzla/report",
    "contact": "info@dicilo.net"
  },
  "lastUpdated": "2026-06-28T10:00:00.000Z"
}
```

---

### POST /api/apoyo-vzla/report — Submit a field report (requires API key)

Send updates from your team on the ground. Reports appear on the public campaign page within seconds.

```
POST https://dicilo.net/api/apoyo-vzla/report
Content-Type: application/json
X-Dicilo-Key: your_api_key_here
```

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `org` | string | ✅ | Your organization name (2–120 chars) |
| `orgType` | string | ✅ | See org types below |
| `zone` | string | ✅ | Geographic zone / city / sector (2–200 chars) |
| `message` | string | ✅ | Report content (10–2000 chars) |
| `category` | string | ✅ | See categories below |
| `peopleHelped` | number | ❌ | Number of people directly assisted |
| `contact` | string | ❌ | Contact info to publish (email, phone, website) |
| `lang` | string | ❌ | Language code (default: `"es"`) |

**Org types (`orgType`):**
- `ngo` — Non-governmental organization
- `redcross` — Red Cross / Red Crescent
- `government` — Government agency
- `volunteer` — Volunteer group
- `church` — Religious organization
- `company` — Private company
- `media` — Media / journalism
- `other` — Other

**Categories (`category`):**
- `delivery` — Aid delivery / distribution
- `rescue` — Search and rescue
- `medical` — Medical assistance
- `shelter` — Shelter / temporary housing
- `food` — Food distribution
- `water` — Water supply
- `missing` — Missing persons
- `update` — General situation update
- `general` — Other

**Example:**
```json
{
  "org": "Médicos Sin Fronteras Venezuela",
  "orgType": "ngo",
  "zone": "Maturín, Monagas",
  "message": "Equipo médico de 12 personas desplegado. Atendidos 87 heridos en el Hospital Manuel Núñez Tovar. Necesitamos suministros de ortopedia urgente.",
  "category": "medical",
  "peopleHelped": 87,
  "contact": "vzla-emergency@msf.org",
  "lang": "es"
}
```

**Success response (201):**
```json
{
  "success": true,
  "id": "Kx8mT2pNq4vR...",
  "message": "Report received. It will appear on dicilo.net/la-comunidad/apoyo-vzla shortly.",
  "viewAt": "https://dicilo.net/la-comunidad/apoyo-vzla"
}
```

**Error responses:**

| Code | Reason |
|------|--------|
| 401 | Invalid or missing `X-Dicilo-Key` |
| 422 | Validation error — check `details` array |
| 500 | Server error — try again or contact info@dicilo.net |

---

## Example: curl

```bash
curl -X POST https://dicilo.net/api/apoyo-vzla/report \
  -H "Content-Type: application/json" \
  -H "X-Dicilo-Key: YOUR_KEY" \
  -d '{
    "org": "My Organization",
    "orgType": "ngo",
    "zone": "Caracas, Miranda",
    "message": "Delivered 200 emergency kits to families in El Valle neighborhood.",
    "category": "delivery",
    "peopleHelped": 200,
    "lang": "en"
  }'
```

## Example: Python

```python
import requests

DICILO_KEY = "your_api_key_here"

response = requests.post(
    "https://dicilo.net/api/apoyo-vzla/report",
    headers={
        "Content-Type": "application/json",
        "X-Dicilo-Key": DICILO_KEY,
    },
    json={
        "org": "My Organization",
        "orgType": "ngo",
        "zone": "Caracas, Miranda",
        "message": "Delivered 200 emergency kits to families in El Valle.",
        "category": "delivery",
        "peopleHelped": 200,
        "lang": "en",
    }
)
print(response.json())
```

## Example: JavaScript / Node.js

```js
const response = await fetch('https://dicilo.net/api/apoyo-vzla/report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Dicilo-Key': 'your_api_key_here',
  },
  body: JSON.stringify({
    org: 'My Organization',
    orgType: 'volunteer',
    zone: 'Cumaná, Sucre',
    message: 'Water purification station operational. Serving 400 families daily.',
    category: 'water',
    peopleHelped: 1600,
    lang: 'en',
  }),
});

const result = await response.json();
console.log(result);
```

---

## Notes

- Reports appear on the public campaign page immediately after submission.
- API keys are per-organization and non-transferable.
- Do not share your key publicly. If compromised, contact info@dicilo.net to rotate it.
- The API uses CORS `*` on GET — you can call it from any frontend or mobile app without credentials.
- Rate limits: 60 POST requests per hour per key.

---

*Dicilo / MILENIUM HOLDING & CONSULTING UG — Berlin, Germany*  
*Together we can reach further. Juntos llegamos más lejos.*
