import type { WeatherPresetConfig } from './WeatherTypes';
import { SnowConfig } from './SnowConfig';

export const WeatherPresets = {
    snow: SnowConfig,
} as const satisfies Record<string, WeatherPresetConfig>;

export type WeatherPresetId = keyof typeof WeatherPresets;
