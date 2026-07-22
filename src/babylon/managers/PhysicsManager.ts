import * as B from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';

import { EnvironmentConfigs } from '../../configs/EnvironmentConfigs';

export class PhysicsManager {

    private scene: B.Scene;
    private outOfBoundsStartTime: number | null = null;

    constructor(scene: B.Scene) {
        this.scene = scene;
    }

    // ─── Inicialização do Havok ───

    public async init(): Promise<void> {
        const havokInstance = await HavokPhysics();

        const havokPlugin = new B.HavokPlugin(true, havokInstance);

        this.scene.enablePhysics(B.Vector3.Zero(), havokPlugin);
    }

    // ─── Spring Physics (puxa modelo de volta à origem) ───

    /**
     * Aplica uma força de mola para manter o mesh dentro
     * de um raio de ativação ao redor da origem.
     * Deve ser chamado a cada frame quando a física está ativa.
     */
    public applySpring(mesh: B.AbstractMesh): void {

        if (!EnvironmentConfigs.physicsSpring.enabled) return;

        const config = EnvironmentConfigs.physicsSpring;

        const direction = config.anchorPoint.subtract(mesh.position);
        const distance = direction.length();

        const body = mesh.physicsBody;
        if (!body) return;

        if (distance > config.activationDistance) {

            if (this.outOfBoundsStartTime === null) {
                this.outOfBoundsStartTime = performance.now();
            }
            const timeElapsed = performance.now() - this.outOfBoundsStartTime;

            // Depois do delay, começa a puxar de volta
            if (timeElapsed >= config.activationDelayMs) {
                const distanceOutside = distance - config.activationDistance;
                const extraVelocity = direction.normalize().scale(distanceOutside * config.stiffness);

                const currentVelocity = body.getLinearVelocity();
                body.setLinearVelocity(currentVelocity.add(extraVelocity));
            }

        } else {

            this.outOfBoundsStartTime = null;

            const currentVelocity = body.getLinearVelocity();
            body.setLinearVelocity(currentVelocity.scale(config.damping));
        }
    }

    /** Reseta o timer da mola (útil ao trocar de modelo) */
    public resetSpring(): void {
        this.outOfBoundsStartTime = null;
    }

    public dispose(): void {
        this.outOfBoundsStartTime = null;
    }
}
