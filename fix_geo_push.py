import json

def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for k, v in data_to_merge.items():
        parts = k.split('.') # e.g. geo.title -> ['geo', 'title']
        mod = parts[0]
        sub = parts[1]
        
        if mod not in data["business"]:
            data["business"][mod] = {}
        data["business"][mod][sub] = v
        
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_add = {
"geo.pushDefault": "Hi! You're near our store. Come in today and get a 10% discount."
}

de_add = {
"geo.pushDefault": "Hallo! Sie sind in der Nähe unseres Geschäfts. Kommen Sie heute herein und erhalten Sie 10% Rabatt."
}

es_add = {
"geo.pushDefault": "¡Hola! Estás cerca de nuestra tienda. Entra hoy y recibe un 10% de descuento."
}

update_file('src/locales/de/common.json', de_add)
update_file('src/locales/en/common.json', en_add)
update_file('src/locales/es/common.json', es_add)

