export const PhysicsConfigs = {
    interaction: {
        impulseForce: 1.5,
    },
    model: {
        defaultMass: 1.0,
        restitution: 0.5,
        linearDamping: 0.4,
        angularDamping: 0.4,
        velocityTransferFactor: 0.2, // Quanto de embalo passa de um modelo pro outro na troca
    },
    boundary: {
        mass: 0, // Paredes são estáticas
        restitution: 0.5
    }
};
