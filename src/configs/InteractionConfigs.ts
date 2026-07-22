export type InteractionId = 'finger';

export interface InteractionConfig {
    id: InteractionId;
    label: string;
}

export const InteractionConfigs: Record<InteractionId, InteractionConfig> = {
    finger: {
        id: 'finger',
        label: 'Dedo',
    },
};
