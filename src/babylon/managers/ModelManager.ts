import * as B from '@babylonjs/core';
import '@babylonjs/loaders'; // Essencial para o Babylon entender .gltf e .glb futuramente
import { ModelConfigs, type ModelId } from '../../configs/ModelConfigs';

export class ModelManager {
    private scene: B.Scene;

    private cache = new Map<ModelId, {
        mesh: B.AbstractMesh;
        originalMaterials: Map<B.AbstractMesh, B.Material | null>;
    }>();

    public currentMesh: B.AbstractMesh | null = null;

    public currentModelId: ModelId | null = null;

    constructor(scene: B.Scene) {
        this.scene = scene;
    }

    public async loadModel(modelId: ModelId): Promise<B.AbstractMesh> {
        // 1. Esconde o atual (não destrói)
        if (this.currentMesh) {
            this.currentMesh.setEnabled(false);
        }

        // 2. Cache hit → reativa
        if (this.cache.has(modelId)) {
            const cached = this.cache.get(modelId)!;

            cached.mesh.setEnabled(true);

            this.currentMesh = cached.mesh;
            this.currentModelId = modelId;

            return cached.mesh;
        }

        // 3. Cache miss → cria via config.loader
        const config = ModelConfigs[modelId];
        const mesh = await config.loader(this.scene);

        // Garante material padrão
        if (!mesh.material) {
            mesh.material = new B.StandardMaterial(`${modelId}_mat`, this.scene);
        }

        // 4. Snapshot dos materiais originais
        const originalMaterials = new Map<B.AbstractMesh, B.Material | null>();
        originalMaterials.set(mesh, mesh.material);

        for (const child of mesh.getChildMeshes()) {
            originalMaterials.set(child, child.material);
        }

        this.cache.set(modelId, { mesh, originalMaterials });
        this.currentMesh = mesh;
        this.currentModelId = modelId;

        return mesh;
    }

    /** Restaura os materiais originais de um modelo (desfaz qualquer shader aplicado) */
    public restoreOriginalMaterials(modelId: ModelId): void {
        const entry = this.cache.get(modelId);
        if (!entry) return;
        for (const [meshNode, originalMat] of entry.originalMaterials) {
            meshNode.material = originalMat;
        }
    }


    public dispose() {
        for (const entry of this.cache.values()) {
            entry.mesh.dispose();
        }
        this.cache.clear();
        this.currentMesh = null;
    }

}
