const fs = require('fs');
const path = 'src/app/admin/locations/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getPendingSuggestions')) {
    // Add imports
    content = content.replace(
        "import {\n    getLocations",
        "import {\n    getPendingSuggestions,\n    deleteSuggestion,\n    LocationSuggestion\n} from '@/app/actions/location-suggestions';\nimport {\n    getLocations"
    );

    // Add state
    content = content.replace(
        "const [newDistrictName, setNewDistrictName] = useState('');",
        "const [newDistrictName, setNewDistrictName] = useState('');\n    const [pendingSuggestions, setPendingSuggestions] = useState<LocationSuggestion[]>([]);"
    );

    // Add to fetchData
    content = content.replace(
        "const res = await getLocations();",
        "const [res, suggRes] = await Promise.all([getLocations(), getPendingSuggestions()]);\n            if (suggRes.success && suggRes.data) {\n                setPendingSuggestions(suggRes.data);\n            }\n            "
    );

    // Add UI before filteredLocations map
    const uiAddition = `
                    {pendingSuggestions.length > 0 && (
                        <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <h2 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5" /> Sugerencias Pendientes ({pendingSuggestions.length})
                            </h2>
                            <div className="space-y-2">
                                {pendingSuggestions.map(s => (
                                    <div key={s.id} className="bg-white p-3 rounded shadow-sm border flex items-center justify-between">
                                        <div>
                                            <Badge variant="outline" className="mb-1 bg-slate-100">{s.type === 'city' ? 'Nueva Ciudad' : 'Nuevo Barrio'}</Badge>
                                            <p className="font-bold text-slate-800">
                                                {s.type === 'city' ? s.cityName : \`\${s.districtName} (en \${s.cityName})\`}
                                            </p>
                                            <p className="text-sm text-slate-500">País: {s.countryName}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                                                if(confirm('¿Rechazar esta sugerencia?')) {
                                                    await deleteSuggestion(s.id);
                                                    fetchData();
                                                }
                                            }}>Rechazar</Button>
                                            <Button size="sm" onClick={async () => {
                                                if (s.type === 'city') {
                                                    await addCity(s.countryId, s.cityName);
                                                } else {
                                                    await addDistrict(s.countryId, s.cityName, s.districtName!);
                                                }
                                                await deleteSuggestion(s.id);
                                                fetchData();
                                            }}>Aprobar e Insertar</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
    `;

    content = content.replace(
        "<div className=\"mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4\">",
        uiAddition + "\n                    <div className=\"mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4\">"
    );

    fs.writeFileSync(path, content);
    console.log('Patched locations page successfully');
} else {
    console.log('Already patched');
}
