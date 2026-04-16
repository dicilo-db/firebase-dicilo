import json

def update_file(filename, data_to_merge):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "contracts" not in data:
        data["contracts"] = {}
    
    if "coupons" not in data["contracts"]:
        data["contracts"]["coupons"] = {}
        
    data["contracts"]["coupons"].update(data_to_merge)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_keys = {
    "discountType": "Discount Type",
    "select": "Select",
    "freeText": "Free Text",
    "percentage": "Percentage (%)",
    "amount": "Amount (€)",
    "discountValue": "Value",
    "saveChanges": "Save Changes",
    "createTitle": "Create New Coupon",
    "createDescription": "Register a new discount for the category: {{category}}",
    "searchPlaceholder": "Search company name...",
    "searchLabel": "Search Company",
    "manualIdInfo": "If search doesn't work, enter ID manually:",
    "manualIdLabel": "Company ID (Required)",
    "manualIdPlaceholder": "Paste client ID here",
    "companyLabel": "Company",
    "noResults": "No results found. Try entering the ID manually.",
    "titleLabel": "Title / Benefit",
    "titlePlaceholder": "e.g. 10% Off",
    "descriptionLabel": "Description",
    "descriptionPlaceholder": "Discount details...",
    "startDateLabel": "Start Date",
    "endDateLabel": "Expiration Date",
    "countryLabel": "Country",
    "cityLabel": "City",
    "cancelButton": "Cancel",
    "createButton": "Create Coupon",
    "successTitle": "Coupon created",
    "successDesc": "Code generated: {{code}}",
    "errorTitle": "Error",
    "errorDesc": "An error occurred while creating the coupon."
}

es_keys = {
      "discountType": "Tipo de Descuento",
      "select": "Seleccionar",
      "freeText": "Texto Libre",
      "percentage": "Porcentaje (%)",
      "amount": "Importe (€)",
      "discountValue": "Valor",
      "saveChanges": "Guardar Cambios"
}

update_file('src/locales/en/admin.json', en_keys)
update_file('src/locales/es/admin.json', es_keys)

