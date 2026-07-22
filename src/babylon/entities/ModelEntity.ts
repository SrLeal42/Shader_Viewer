import * as B from '@babylonjs/core';

import type { ModelId } from '../../configs/ModelConfigs';
import { PhysicsConfigs } from '../../configs/PhysicsConfigs';

export class ModelEntity {
    public readonly mesh: B.AbstractMesh;
    public readonly modelId: ModelId;

    private originalMaterials: Map<B.AbstractMesh, B.Material | null>;
    private childMeshSet: Set<B.AbstractMesh>;
    private physicsBody: B.PhysicsBody | null = null;
    private physicsShape: B.PhysicsShape | null = null;
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
        this.scene = scene;

        this.mesh = mesh;
        this.modelId = modelId;
        this.originalMaterials = originalMaterials;
        this.colliderType = colliderType;

        this.mass = mass;

        this.childMeshSet = new Set(mesh.getChildMeshes());
    }

    // ─── Física ───

    public get hasPhysics(): boolean {
        return this.physicsBody !== null;
    }


    public enablePhysics(linearDamping?: number, angularDamping?: number): void {

        if (this.physicsBody) return;

        if (linearDamping !== undefined) this.linearDamping = linearDamping;

        if (angularDamping !== undefined) this.angularDamping = angularDamping;

        const isConvexHull = this.colliderType === B.PhysicsShapeType.CONVEX_HULL;

        if (isConvexHull) {
            this.enableConvexHullPhysics();
        } else {
            this.enableSimplePhysics();
        }

        this.physicsBody!.setLinearDamping(this.linearDamping);
        this.physicsBody!.setAngularDamping(this.angularDamping);
    }

    /** Primitivas: PhysicsAggregate direto no mesh */
    private enableSimplePhysics(): void {
        const aggregate = new B.PhysicsAggregate(
            this.mesh,
            this.colliderType,
            { mass: this.mass, restitution: PhysicsConfigs.model.restitution },
            this.scene
        );

        this.physicsBody = aggregate.body;
        this.physicsShape = aggregate.shape;
    }

    /** Modelos complexos: PhysicsBody no root + shape mergeada dos filhos */
    private enableConvexHullPhysics(): void {

        // 1. Filtra filhos com geometria real
        const meshesWithGeometry = this.mesh.getChildMeshes()
            .filter((m): m is B.Mesh => m instanceof B.Mesh && m.getTotalVertices() > 0);

        if (meshesWithGeometry.length === 0) {
            console.warn(`[ModelEntity] Nenhum filho com geometria para CONVEX_HULL: ${this.modelId}`);
            return;
        }

        // 2. Salva o transform atual do root
        //    MergeMeshes transforma os vértices pela worldMatrix de cada mesh.
        //    Para que a shape fique no espaço local do body, zeramos posição/rotação
        //    mas MANTEMOS o scaling (a shape precisa refletir a escala visual).
        const savedPos = this.mesh.position.clone();
        const savedRotQuat = this.mesh.rotationQuaternion?.clone() ?? null;
        this.mesh.position.setAll(0);
        this.mesh.rotationQuaternion = B.Quaternion.Identity();

        // 3. Mergeia filhos (vértices agora em espaço local do root, com scaling)
        const merged = B.Mesh.MergeMeshes(
            meshesWithGeometry,
            false,  // disposeSource = false
            true    // allow32BitsIndices
        );

        // 4. Restaura o transform original ANTES de criar o body
        this.mesh.position.copyFrom(savedPos);
        this.mesh.rotationQuaternion = savedRotQuat;
        if (!merged) {
            console.warn(`[ModelEntity] Falha ao mergear meshes para CONVEX_HULL: ${this.modelId}`);
            return;
        }

        // 5. Cria PhysicsBody no root (controla posição/rotação)
        this.physicsBody = new B.PhysicsBody(
            this.mesh,
            B.PhysicsMotionType.DYNAMIC,
            false,
            this.scene
        );

        // 6. Cria shape (vértices agora corretamente no espaço local do body)
        this.physicsShape = new B.PhysicsShapeConvexHull(merged, this.scene);
        this.physicsBody.shape = this.physicsShape;

        // 7. Configura massa
        this.physicsBody.setMassProperties({
            mass: this.mass,
        });

        // 8. Descarta mesh temporária
        merged.dispose();
    }

    public disposePhysics(): void {
        if (this.physicsShape) {
            this.physicsShape.dispose();
            this.physicsShape = null;
        }

        if (this.physicsBody) {
            this.physicsBody.dispose();
            this.physicsBody = null;
        }
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
        if (!this.physicsBody) return B.Vector3.Zero();
        return this.physicsBody.getLinearVelocity();
    }

    public getAngularVelocity(): B.Vector3 {
        if (!this.physicsBody) return B.Vector3.Zero();
        return this.physicsBody.getAngularVelocity();
    }

    public setLinearVelocity(v: B.Vector3): void {
        this.physicsBody?.setLinearVelocity(v);
    }

    public setAngularVelocity(v: B.Vector3): void {
        this.physicsBody?.setAngularVelocity(v);
    }


    // ─── Interação ───
    public applyImpulse(force: B.Vector3, contactPoint: B.Vector3): void {
        this.physicsBody?.applyImpulse(force, contactPoint);
    }


    /** Verifica se um mesh pertence a esta entity (root ou filhos) */
    public containsMesh(mesh: B.AbstractMesh): boolean {
        return mesh === this.mesh || this.childMeshSet.has(mesh);
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

        // Descarta os materiais originais (que pertencem a este modelo)
        // NÃO descarta ShaderMaterials do cache do ShaderManager
        for (const [, material] of this.originalMaterials) {
            if (material) {
                material.dispose(true, true); // forceDisposeEffect, forceDisposeTextures
            }
        }
        this.originalMaterials.clear();

        // Descarta o mesh e todos os filhos recursivamente
        // false = não pula filhos (dispõe recursivamente)
        // false = não descarta materiais (já fizemos acima, seletivamente)
        this.mesh.dispose(false, false);
    }

}
