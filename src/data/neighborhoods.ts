export interface Neighborhood {
    id: string;
    name: string;
    city: string;
    lat?: number;
    lng?: number;
    location?: { lat?: number; lng?: number; latitude?: number; longitude?: number };
    distance?: number;
}

export const BERLIN_NEIGHBORHOODS: Neighborhood[] = [
    { id: 'mitte', name: 'Mitte', city: 'Berlin', lat: 52.5192, lng: 13.4061 },
    { id: 'kreuzberg', name: 'Kreuzberg', city: 'Berlin', lat: 52.4986, lng: 13.3918 },
    { id: 'friedrichshain', name: 'Friedrichshain', city: 'Berlin', lat: 52.5117, lng: 13.4563 },
    { id: 'prenzlauer_berg', name: 'Prenzlauer Berg', city: 'Berlin', lat: 52.5404, lng: 13.4217 },
    { id: 'charlottenburg', name: 'Charlottenburg', city: 'Berlin', lat: 52.5160, lng: 13.3087 },
    { id: 'wilmersdorf', name: 'Wilmersdorf', city: 'Berlin', lat: 52.4852, lng: 13.3235 },
    { id: 'spandau', name: 'Spandau', city: 'Berlin', lat: 52.5363, lng: 13.1970 },
    { id: 'steglitz', name: 'Steglitz', city: 'Berlin', lat: 52.4491, lng: 13.3204 },
    { id: 'zehlendorf', name: 'Zehlendorf', city: 'Berlin', lat: 52.4344, lng: 13.2625 },
    { id: 'schoeneberg', name: 'Schöneberg', city: 'Berlin', lat: 52.4852, lng: 13.3556 },
    { id: 'neukoelln', name: 'Neukölln', city: 'Berlin', lat: 52.4815, lng: 13.4357 },
    { id: 'tempelhof', name: 'Tempelhof', city: 'Berlin', lat: 52.4590, lng: 13.3831 },
    { id: 'marzahn', name: 'Marzahn', city: 'Berlin', lat: 52.5447, lng: 13.5414 },
    { id: 'hellersdorf', name: 'Hellersdorf', city: 'Berlin', lat: 52.5350, lng: 13.5976 },
    { id: 'lichtenberg', name: 'Lichtenberg', city: 'Berlin', lat: 52.5323, lng: 13.4679 },
    { id: 'pankow', name: 'Pankow', city: 'Berlin', lat: 52.5714, lng: 13.4077 },
    { id: 'reinickendorf', name: 'Reinickendorf', city: 'Berlin', lat: 52.5768, lng: 13.3217 },
    { id: 'treptow', name: 'Treptow', city: 'Berlin', lat: 52.4862, lng: 13.4735 },
    { id: 'koepenick', name: 'Köpenick', city: 'Berlin', lat: 52.4542, lng: 13.5786 }
];

export const HAMBURG_NEIGHBORHOODS: Neighborhood[] = [
    { id: 'hamburg', name: 'Hamburg', city: 'Hamburg', lat: 53.5511, lng: 9.9937 },
    { id: 'altona', name: 'Altona', city: 'Hamburg', lat: 53.5574, lng: 9.9329 },
    { id: 'bergedorf', name: 'Bergedorf', city: 'Hamburg', lat: 53.4849, lng: 10.2151 },
    { id: 'eimsbuettel', name: 'Eimsbüttel', city: 'Hamburg', lat: 53.5746, lng: 9.9575 },
    { id: 'hamburg_mitte', name: 'Hamburg-Mitte', city: 'Hamburg', lat: 53.5427, lng: 10.0205 },
    { id: 'hamburg_nord', name: 'Hamburg-Nord', city: 'Hamburg', lat: 53.6067, lng: 10.0135 },
    { id: 'harburg', name: 'Harburg', city: 'Hamburg', lat: 53.4623, lng: 9.9702 },
    { id: 'wandsbek', name: 'Wandsbek', city: 'Hamburg', lat: 53.5753, lng: 10.0718 },
    { id: 'sternschanze', name: 'Sternschanze', city: 'Hamburg', lat: 53.5634, lng: 9.9639 },
    { id: 'st_pauli', name: 'St. Pauli', city: 'Hamburg', lat: 53.5501, lng: 9.9626 },
    { id: 'hafencity', name: 'HafenCity', city: 'Hamburg', lat: 53.5414, lng: 9.9996 }
];

export const ALL_NEIGHBORHOODS = [...BERLIN_NEIGHBORHOODS, ...HAMBURG_NEIGHBORHOODS];

export const getNeighborhoodName = (id: string) => {
    return ALL_NEIGHBORHOODS.find(n => n.id === id)?.name || id;
};
