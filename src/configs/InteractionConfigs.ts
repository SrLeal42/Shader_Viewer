// Usar um type garante que não vamos digitar IDs errados em nenhum lugar do projeto
export type InteractionId = 'finger' | 'blackhole' | 'confetti';

export interface InteractionConfig {
    id: InteractionId;
    label: string;
    impulseForce?: number; // Específico do dedo
}

export const InteractionConfigs: Record<InteractionId, InteractionConfig> = {
    finger: {
        id: 'finger',
        label: 'Dedo',
        impulseForce: 1.5
    },
    blackhole: {
        id: 'blackhole',
        label: 'Buraco Negro'
    },
    confetti: {
        id: 'confetti',
        label: 'Canhão de Confetes'
    }
};
