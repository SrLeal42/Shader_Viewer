import * as B from '@babylonjs/core';
import '@babylonjs/loaders';
import { ModelConfigs, type ModelId } from '../../configs/ModelConfigs';
import { ModelEntity } from '../entities/ModelEntity';

export class ModelManager {
    private scene: B.Scene;
    private cache = new Map<ModelId, ModelEntity>();

    public currentEntity: ModelEntity | null = null;
    public currentModelId: ModelId | null = null;

    constructor(scene: B.Scene) {
        this.scene = scene;
    }

    public async loadModel(modelId: ModelId): Promise<ModelEntity> {
        // 1. Desativa a entity atual (dispõe physics, mantém no cache)
        if (this.currentEntity) {
            this.currentEntity.disposePhysics();
            this.currentEntity.setEnabled(false);
        }

        // 2. Cache hit → reativa
        if (this.cache.has(modelId)) {
            const entity = this.cache.get(modelId)!;
            entity.setEnabled(true);

            this.currentEntity = entity;
            this.currentModelId = modelId;
            return entity;
        }

        // 3. Cache miss → cria via config.loader
        const config = ModelConfigs[modelId];
        const mesh = await config.loader(this.scene);

        // Garante material padrão
        if (!mesh.material) {
            mesh.material = new B.StandardMaterial(`${modelId}_mat`, this.scene);
        }

        // Snapshot dos materiais originais
        const originalMaterials = new Map<B.AbstractMesh, B.Material | null>();
        originalMaterials.set(mesh, mesh.material);
        for (const child of mesh.getChildMeshes()) {
            originalMaterials.set(child, child.material);
        }

        const entity = new ModelEntity(
            mesh,
            modelId,
            originalMaterials,
            config.colliderType,
            this.scene
        );

        this.cache.set(modelId, entity);
        this.currentEntity = entity;
        this.currentModelId = modelId;

        return entity;
    }

    /** Delega para ModelEntity */
    public restoreOriginalMaterials(modelId: ModelId): void {
        this.cache.get(modelId)?.restoreOriginalMaterials();
    }

    public dispose(): void {

        for (const entity of this.cache.values()) {
            entity.dispose();
        }

        this.cache.clear();

        this.currentEntity = null;
    }

}
