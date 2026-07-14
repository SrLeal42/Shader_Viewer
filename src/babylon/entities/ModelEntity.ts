import * as B from '@babylonjs/core';

import type { ModelId } from '../../configs/ModelConfigs';
import { PhysicsConfigs } from '../../configs/PhysicsConfigs';

export class ModelEntity {
    public readonly mesh: B.AbstractMesh;
    public readonly modelId: ModelId;

    private originalMaterials: Map<B.AbstractMesh, B.Material | null>;
    private physicsAggregate: B.PhysicsAggregate | null = null;
    private colliderType: number;
    private mass: number = PhysicsConfigs.model.defaultMass;

    private scene: B.Scene;

    private linearDamping = PhysicsConfigs.model.linearDamping;
    private angularDamping = PhysicsConfigs.model.angularDamping;

    constructor(
        mesh: B.AbstractMesh,
        modelId: ModelId,
        originalMaterials: Map<B.AbstractMesh, B.Material | null>,
        colliderType: number,
        scene: B.Scene,
        mass: number = 1.0
    ) {
        this.mesh = mesh;
        this.modelId = modelId;
        this.originalMaterials = originalMaterials;
        this.colliderType = colliderType;
        this.scene = scene;
        this.mass = mass;
    }

    // ─── Física ───

    public get hasPhysics(): boolean {
        return this.physicsAggregate !== null;
    }

    public enablePhysics(linearDamping?: number, angularDamping?: number): void {
        if (this.physicsAggregate) return;

        if (linearDamping !== undefined) this.linearDamping = linearDamping;
        if (angularDamping !== undefined) this.angularDamping = angularDamping;

        this.physicsAggregate = new B.PhysicsAggregate(
            this.mesh,
            this.colliderType,
            { mass: this.mass, restitution: 0.5 },
            this.scene
        );

        this.physicsAggregate.body.setLinearDamping(this.linearDamping);
        this.physicsAggregate.body.setAngularDamping(this.angularDamping);
    }

    public disposePhysics(): void {
        if (!this.physicsAggregate) return;
        this.physicsAggregate.dispose();
        this.physicsAggregate = null;
    }

    /** Reconstrói o collider preservando velocidade (usado ao mudar escala) */
    public rebuildPhysics(): void {
        const linVel = this.getLinearVelocity();
        const angVel = this.getAngularVelocity();

        this.disposePhysics();
        this.enablePhysics();

        this.setLinearVelocity(linVel);
        this.setAngularVelocity(angVel);
    }

    // ─── Velocidade ───

    public getLinearVelocity(): B.Vector3 {
        if (!this.physicsAggregate) return B.Vector3.Zero();
        return this.physicsAggregate.body.getLinearVelocity();
    }

    public getAngularVelocity(): B.Vector3 {
        if (!this.physicsAggregate) return B.Vector3.Zero();
        return this.physicsAggregate.body.getAngularVelocity();
    }

    public setLinearVelocity(v: B.Vector3): void {
        this.physicsAggregate?.body.setLinearVelocity(v);
    }

    public setAngularVelocity(v: B.Vector3): void {
        this.physicsAggregate?.body.setAngularVelocity(v);
    }

    // ─── Interação ───

    /** Aplica impulso num ponto de contato (gera torque natural) */
    public applyImpulse(force: B.Vector3, contactPoint: B.Vector3): void {
        this.physicsAggregate?.body.applyImpulse(force, contactPoint);
    }

    /** Verifica se um mesh pertence a esta entity (root ou filhos) */
    public containsMesh(mesh: B.AbstractMesh): boolean {
        return mesh === this.mesh || this.mesh.getChildMeshes().includes(mesh);
    }

    // ─── Materiais ───

    public restoreOriginalMaterials(): void {
        for (const [meshNode, originalMat] of this.originalMaterials) {
            meshNode.material = originalMat;
        }
    }

    // ─── Visibilidade ───

    public setEnabled(enabled: boolean): void {
        this.mesh.setEnabled(enabled);
    }

    // ─── Cleanup ───

    public dispose(): void {
        this.disposePhysics();
        this.mesh.dispose();
    }
}
