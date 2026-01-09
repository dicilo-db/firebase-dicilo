export interface Neighborhood {
    id: string;
    name: string;
    city: string;
}

export const BERLIN_NEIGHBORHOODS: Neighborhood[] = [
    { id: 'mitte', name: 'Mitte', city: 'Berlin' },
    { id: 'kreuzberg', name: 'Kreuzberg', city: 'Berlin' },
    { id: 'friedrichshain', name: 'Friedrichshain', city: 'Berlin' },
    { id: 'prenzlauer_berg', name: 'Prenzlauer Berg', city: 'Berlin' },
    { id: 'charlottenburg', name: 'Charlottenburg', city: 'Berlin' },
    { id: 'wilmersdorf', name: 'Wilmersdorf', city: 'Berlin' },
    { id: 'spandau', name: 'Spandau', city: 'Berlin' },
    { id: 'steglitz', name: 'Steglitz', city: 'Berlin' },
    { id: 'zehlendorf', name: 'Zehlendorf', city: 'Berlin' },
    { id: 'schoeneberg', name: 'Schöneberg', city: 'Berlin' },
    { id: 'neukoelln', name: 'Neukölln', city: 'Berlin' },
    { id: 'tempelhof', name: 'Tempelhof', city: 'Berlin' },
    { id: 'marzahn', name: 'Marzahn', city: 'Berlin' },
    { id: 'hellersdorf', name: 'Hellersdorf', city: 'Berlin' },
    { id: 'lichtenberg', name: 'Lichtenberg', city: 'Berlin' },
    { id: 'pankow', name: 'Pankow', city: 'Berlin' },
    { id: 'reinickendorf', name: 'Reinickendorf', city: 'Berlin' },
    { id: 'treptow', name: 'Treptow', city: 'Berlin' },
    { id: 'koepenick', name: 'Köpenick', city: 'Berlin' }
];

export const HAMBURG_NEIGHBORHOODS: Neighborhood[] = [
    { id: 'altona', name: 'Altona', city: 'Hamburg' },
    { id: 'bergedorf', name: 'Bergedorf', city: 'Hamburg' },
    { id: 'eimsbuettel', name: 'Eimsbüttel', city: 'Hamburg' },
    { id: 'hamburg_mitte', name: 'Hamburg-Mitte', city: 'Hamburg' },
    { id: 'hamburg_nord', name: 'Hamburg-Nord', city: 'Hamburg' },
    { id: 'harburg', name: 'Harburg', city: 'Hamburg' },
    { id: 'wandsbek', name: 'Wandsbek', city: 'Hamburg' },
    { id: 'sternschanze', name: 'Sternschanze', city: 'Hamburg' },
    { id: 'st_pauli', name: 'St. Pauli', city: 'Hamburg' },
    { id: 'hafencity', name: 'HafenCity', city: 'Hamburg' }
];

export const ALL_NEIGHBORHOODS = [...BERLIN_NEIGHBORHOODS, ...HAMBURG_NEIGHBORHOODS];

export const getNeighborhoodName = (id: string) => {
    return ALL_NEIGHBORHOODS.find(n => n.id === id)?.name || id;
};
