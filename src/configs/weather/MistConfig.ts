import type { WeatherPresetConfig } from './WeatherTypes';

export const MistConfig: WeatherPresetConfig = {
    label: 'Neblina',
    description: 'Uma neblina densa branca toma a cena',

    fog: {
        color: { r: 0.8, g: 0.8, b: 0.8 },
        density: .5,
        maxOpacity: 0.9,
        start: 3,
        falloffCurve: 4,
    },

};
