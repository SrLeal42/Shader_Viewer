export type LightModeId = 'hemi' | 'point' | 'both';
export type PointAnimationType = 'none' | 'orbit' | 'pulse';

export const LightConfigs = {
    defaultMode: 'hemi' as LightModeId,

    hemi: {
        direction: { x: 0, y: 1, z: 0 },
        color: { r: 1, g: 1, b: 1 },
        intensity: 1.0
    },

    point: {
        position: { x: 0, y: 2, z: 3 },
        color: { r: 1, g: 1, b: 1 },
        intensity: 1.0,
        showHelper: true,

        // Controle de Animação
        animationType: 'none' as PointAnimationType,
        orbitSpeed: 1.0,
        pulseFrequency: 3.0
    }
};
