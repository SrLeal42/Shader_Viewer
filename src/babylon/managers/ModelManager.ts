import * as B from '@babylonjs/core';
import '@babylonjs/loaders'; // Essencial para o Babylon entender .gltf e .glb futuramente
import { ModelConfigs, type ModelId } from '../../configs/ModelConfigs';

export class ModelManager {
    private scene: B.Scene;

    private cache = new Map<ModelId, B.AbstractMesh>();

    public currentMesh: B.AbstractMesh | null = null;

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
            cached.setEnabled(true);
            this.currentMesh = cached;
            return cached;
        }

        // 3. Cache miss → cria via config.loader
        const config = ModelConfigs[modelId];
        const mesh = await config.loader(this.scene);

        // Garante material padrão
        if (!mesh.material) {
            mesh.material = new B.StandardMaterial(`${modelId}_mat`, this.scene);
        }

        this.cache.set(modelId, mesh);
        this.currentMesh = mesh;

        return mesh;
    }

    public dispose() {

        for (const mesh of this.cache.values()) {
            mesh.dispose();
        }

        this.cache.clear();
        this.currentMesh = null;
    }
}
