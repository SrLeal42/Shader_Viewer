import * as B from '@babylonjs/core';
import '@babylonjs/loaders'; // Essencial para o Babylon entender .gltf e .glb futuramente

export class ModelManager {
    private scene: B.Scene;
    public currentMesh: B.Mesh | null = null;

    constructor(scene: B.Scene) {
        this.scene = scene;
    }

    // Agora retorna uma Promise, preparando o terreno para os assets externos
    public async loadModel(modelId: string): Promise<B.Mesh> {
        if (this.currentMesh) {
            this.currentMesh.dispose();
        }

        let mesh: B.Mesh;

        switch (modelId) {
            case 'sphere':
                mesh = B.MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 32 }, this.scene);
                break;
            case 'box':
                mesh = B.MeshBuilder.CreateBox('box', { size: 1 }, this.scene);
                break;
            case 'suzanne':
                // FUTURO: É aqui que faremos o carregamento real do arquivo!
                // const result = await B.SceneLoader.ImportMeshAsync('', '/assets/', 'suzanne.glb', this.scene);
                // mesh = result.meshes[0] as B.Mesh;

                // Placeholder temporário enquanto não baixamos o modelo 3D
                mesh = B.MeshBuilder.CreateTorus('suzanne_temp', { diameter: 1.5, thickness: 0.4 }, this.scene);
                break;
            default:
                throw new Error(`Modelo não reconhecido: ${modelId}`);
        }

        // Se for um modelo gerado via código, garante que tem um material
        if (!mesh.material) {
            mesh.material = new B.StandardMaterial(`${modelId}Mat`, this.scene);
        }

        this.currentMesh = mesh;
        return mesh;
    }
}
