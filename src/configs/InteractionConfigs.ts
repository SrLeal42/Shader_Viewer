export interface InteractionConfig {
    id: string;
    label: string;
    description?: string;
}

export const InteractionConfigs = {
    finger: {
        id: 'finger',
        label: 'Dedo',
        description: 'Use o cursor para aplicar força física e empurrar o modelo 3D.'
    },
    magnet: {
        id: 'magnet',
        label: 'Imã',
        description: 'Botão Esquerdo atrai. Botão Direito repele.'
    }
} as const satisfies Record<string, InteractionConfig>;

export type InteractionId = keyof typeof InteractionConfigs;
