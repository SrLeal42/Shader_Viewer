import * as B from '@babylonjs/core';

export const EnvironmentConfigs = {
    camera: {
        initialPosition: new B.Vector3(0, 0.5, -4),
        targetPosition: new B.Vector3(0, 0.5, 0),
    },
    light: {
        direction: new B.Vector3(0, 1, -0.8),
        intensity: 1.0, // Caso queira usar futuramente
    },
    // Fronteiras do mundo
    boundaries: [
        { name: 'floor', size: { w: 10, h: 2.0, d: 12 }, pos: new B.Vector3(0, -3.5, 0) },
        { name: 'ceiling', size: { w: 10, h: 2.0, d: 12 }, pos: new B.Vector3(0, 5.0, 0) },

        { name: 'left', size: { w: 2.0, h: 10, d: 12 }, pos: new B.Vector3(-5.5, 0, 0) },
        { name: 'right', size: { w: 2.0, h: 10, d: 12 }, pos: new B.Vector3(5.5, 0, 0) },

        { name: 'front', size: { w: 10, h: 10, d: 2.0 }, pos: new B.Vector3(0, 0, -2.5) },
        { name: 'back', size: { w: 10, h: 10, d: 2.0 }, pos: new B.Vector3(0, 0, 7.5) },
    ]
};
