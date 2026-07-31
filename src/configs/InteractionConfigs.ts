export type InteractionId = 'finger';

export interface InteractionConfig {
    id: InteractionId;
    label: string;
    description?: string;
}

export const InteractionConfigs: Record<InteractionId, InteractionConfig> = {
    finger: {
        id: 'finger',
        label: 'Dedo',
        description: 'Use o cursor para aplicar força física e empurrar o modelo 3D.'
    },
};
