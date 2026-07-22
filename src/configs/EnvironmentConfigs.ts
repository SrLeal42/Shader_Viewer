import * as B from '@babylonjs/core';

export const EnvironmentConfigs = {
    camera: {
        initialPosition: new B.Vector3(0, 0.5, 5),
        targetPosition: new B.Vector3(0, 0.5, 0),
    },
    light: {
        direction: new B.Vector3(0, 1, 0),
        intensity: 0.8
    },
    background: {
        color: new B.Color4(0.1, 0.1, 0.12, 1)
    },
    physicsSpring: {
        enabled: true,
        anchorPoint: new B.Vector3(0, 0, -3),
        stiffness: 0.001,
        damping: 0.98,
        activationDistance: 2.5,   // Distância livre antes da mola agir
        activationDelayMs: 5000,   // Delay em milissegundos (1 segundo) antes da mola puxar
        failsafeMargin: 1.2,
        thickness: 2.0
    }
};