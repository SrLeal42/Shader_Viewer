import * as B from '../babylon/BabylonAdapter';
import type { UIConfig } from '../types/UI';

// --- Model Config: unifica registry + configuração + loader ---

export interface ModelConfig extends UIConfig {
    label: string; // Label para o seletor de modelo (ex: 'Esfera')
    loader: (scene: B.Scene) => Promise<B.AbstractMesh>;
    colliderType: number; // PhysicsShapeType (número para compatibilidade com as const)
    description?: string;
    initialRotation?: B.Vector3; // Em radianos/Euler
}

// Helper robusto para carregar GLB com Bake Hierárquico completo
const createGLBLoader = (filename: string, bakeRotation?: B.Vector3) => async (scene: B.Scene) => {
    const result = await B.SceneLoader.ImportMeshAsync('', '/models/', filename, scene);
    const root = result.meshes[0];

    if (bakeRotation) {

        root.rotationQuaternion = B.Quaternion.FromEulerVector(bakeRotation);
        root.computeWorldMatrix(true);
        const childMeshes = root.getChildMeshes();

        for (const child of childMeshes) {
            if (child instanceof B.Mesh && child.getTotalVertices() > 0) {
                const worldMatrix = child.computeWorldMatrix(true).clone();

                // Grava a transformação definitiva nos vértices
                child.bakeTransformIntoVertices(worldMatrix);
                // Conecta diretamente à raiz com transform local neutro (identidade)
                child.parent = root;
                child.position.setAll(0);
                child.rotation.setAll(0);
                child.scaling.setAll(1);
                child.rotationQuaternion = null;
                child.computeWorldMatrix(true);
                child.refreshBoundingInfo();
            }
        }

        for (const node of root.getChildren().slice()) {
            if (!childMeshes.includes(node as B.AbstractMesh)) {
                node.dispose();
            }
        }

        root.rotationQuaternion = B.Quaternion.Identity();
        root.position.setAll(0);
        root.computeWorldMatrix(true);
    }

    return root;
};

const createScaleParam = (baseScale: number, maxScale: number = 3) => ({
    property: 'scale',
    label: 'Escala Global',
    type: 'float' as const,
    defaultValue: 1,
    min: 0.1, max: maxScale, step: 0.1,
    onApply: (mesh: B.AbstractMesh, value: number) => {
        mesh.scaling.setAll(baseScale * value);
    }
});

export const ModelConfigs = {
    sphere: {
        label: 'Esfera',
        title: 'Propriedades da Esfera',
        colliderType: B.PhysicsShapeType.SPHERE,
        description: 'Esfera',
        loader: async (scene: B.Scene) =>
            B.MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 32 }, scene),
        parameters: [
            {
                property: 'scale',
                label: 'Escala Global',
                type: 'float' as const,
                defaultValue: 0.5,
                min: 0.1, max: 2, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => {
                    mesh.scaling.setAll(value);
                }
            }
        ]
    },
    box: {
        label: 'Caixa',
        title: 'Propriedades da Caixa',
        colliderType: B.PhysicsShapeType.BOX,
        description: 'Caixa',
        loader: async (scene: B.Scene) =>
            B.MeshBuilder.CreateBox('box', { size: 1 }, scene),
        parameters: [
            {
                property: 'width',
                label: 'Largura (X)',
                type: 'float' as const,
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => { mesh.scaling.x = value; }
            },
            {
                property: 'height',
                label: 'Altura (Y)',
                type: 'float' as const,
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => { mesh.scaling.y = value; }
            },
            {
                property: 'deepth',
                label: 'Profundide (Z)',
                type: 'float' as const,
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => { mesh.scaling.z = value; }
            }
        ]
    },
    suzanne: {
        label: 'Suzanne',
        title: 'Propriedades da Suzanne',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        // initialRotation: new B.Vector3(-Math.PI / 2, 0, 0),
        description: 'Suzanner',
        loader: createGLBLoader('suzanne.glb', new B.Vector3(Math.PI / 2, Math.PI, 0)),
        parameters: [createScaleParam(0.01)]
    },
    candelabra: {
        label: 'Candelabro',
        title: 'Propriedades do Candelabro',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        // initialRotation: new B.Vector3(-Math.PI / 2, 0, 0),
        description: 'Candelabro',
        loader: createGLBLoader('candelabra.glb', new B.Vector3(Math.PI / 2, 0, 0)),
        parameters: [createScaleParam(0.02, 5)]
    },
    axis: {
        label: 'Eixos',
        title: 'Propriedades do Eixos',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        description: 'Eixos',
        loader: createGLBLoader('axis.glb'),
        parameters: [createScaleParam(1)]
    },
    donut: {
        label: 'Rosquinha',
        title: 'Propriedades da Rosquinha',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        description: 'Rosquinha',
        loader: createGLBLoader('donut.glb'),
        parameters: [createScaleParam(0.5)]
    },
    dragon: {
        label: 'Dragão',
        title: 'Propriedades da Dragão',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        description: 'Dragão',
        loader: createGLBLoader('dragon.glb'),
        parameters: [createScaleParam(0.05)]
    },
    car: {
        label: 'Carro',
        title: 'Propriedades da Carro',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        initialRotation: new B.Vector3(0, -Math.PI / 2, 0),
        description: 'Carro',
        loader: createGLBLoader('car.glb'),
        parameters: [createScaleParam(0.01)]
    },
} as const satisfies Record<string, ModelConfig>;

export type ModelId = keyof typeof ModelConfigs;
