import type { WeatherPresetConfig } from './WeatherTypes';

import { SnowConfig } from './SnowConfig';
import { MistConfig } from './MistConfig';

export const WeatherPresets = {
    mist: MistConfig,
    snow: SnowConfig,
} as const satisfies Record<string, WeatherPresetConfig>;

export type WeatherPresetId = keyof typeof WeatherPresets;
