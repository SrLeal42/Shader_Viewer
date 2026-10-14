import type { WeatherPresetConfig } from './WeatherTypes';

import { SnowConfig } from './SnowConfig';
import { RainConfig } from './RainConfig';
import { MistConfig } from './MistConfig';
import { SandstormConfig } from './SandstormConfig';
import { AshesConfig } from './AshesConfig';

export const WeatherPresets = {
    mist: MistConfig,
    rain: RainConfig,
    snow: SnowConfig,
    sandstorm: SandstormConfig,
    ashes: AshesConfig,
} as const satisfies Record<string, WeatherPresetConfig>;

export type WeatherPresetId = keyof typeof WeatherPresets;
