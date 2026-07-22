export type InteractionId = 'finger';

export interface InteractionConfig {
    id: InteractionId;
    label: string;
    impulseForce?: number;
}

export const InteractionConfigs: Record<InteractionId, InteractionConfig> = {
    finger: {
        id: 'finger',
        label: 'Dedo',
        impulseForce: 1.5
    },
};
