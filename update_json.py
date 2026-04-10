import json

def update_locales():
    locales = {
        'es': {
            'dicipointsTitle': 'DICIPOINTS WALLET',
            'dpLegend': 'DP = DiciPoint puntos de pago en dicilo',
            'prepaidLegend': 'Prepaid: Tarjeta Prepago con bonos en efectivo'
        },
        'en': {
            'dicipointsTitle': 'DICIPOINTS WALLET',
            'dpLegend': 'DP = DiciPoint dicilo payment points',
            'prepaidLegend': 'Prepaid: Prepaid card with cash bonuses'
        },
        'de': {
            'dicipointsTitle': 'DICIPOINTS WALLET',
            'dpLegend': 'DP = DiciPoint dicilo Zahlungspunkte',
            'prepaidLegend': 'Prepaid: Prepaid-Karte mit Bargeldboni'
        }
    }
    
    for lang, translations in locales.items():
        with open(f'src/locales/{lang}/common.json', 'r+', encoding='utf-8') as f:
            data = json.load(f)
            if 'dashboard' not in data:
                data['dashboard'] = {}
            if 'wallet' not in data['dashboard']:
                data['dashboard']['wallet'] = {}
                
            data['dashboard']['wallet']['dicipointsTitle'] = translations['dicipointsTitle']
            data['dashboard']['wallet']['dpLegend'] = translations['dpLegend']
            data['dashboard']['wallet']['prepaidLegend'] = translations['prepaidLegend']
            
            f.seek(0)
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.truncate()

    for lang, translations in locales.items():
        try:
            with open(f'public/locales/{lang}/common.json', 'r+', encoding='utf-8') as f:
                data = json.load(f)
                if 'dashboard' not in data:
                    data['dashboard'] = {}
                if 'wallet' not in data['dashboard']:
                    data['dashboard']['wallet'] = {}
                    
                data['dashboard']['wallet']['dicipointsTitle'] = translations['dicipointsTitle']
                data['dashboard']['wallet']['dpLegend'] = translations['dpLegend']
                data['dashboard']['wallet']['prepaidLegend'] = translations['prepaidLegend']
                
                f.seek(0)
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.truncate()
        except FileNotFoundError:
            pass
            
if __name__ == '__main__':
    update_locales()
