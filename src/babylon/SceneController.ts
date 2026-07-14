import * as B from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';

import { CameraManager } from './managers/CameraManager';
import { UIManager } from './managers/UIManager';
import { ModelManager } from './managers/ModelManager';
import { ShaderManager } from './managers/ShaderManager';

import { ModelConfigs, type ModelConfig, type ModelId } from '../configs/ModelConfigs';
import { EnvironmentConfigs } from '../configs/EnviromentConfigs';
import { PhysicsConfigs } from '../configs/PhysicsConfigs';

import { MaterialShaders, type MaterialShaderId, type PostProcessShaderId } from '../shaders/Registry';

export class SceneController {
    private engine: B.Engine;
    public scene: B.Scene;

    private light: B.HemisphericLight;

    private cameraManager: CameraManager;
    private uiManager: UIManager;

    private modelManager: ModelManager;
    private currentParams: Record<string, unknown> = {};

    private shaderManager: ShaderManager;
    private shaderParams: Record<string, unknown> = {};

    private switchGeneration = 0;

    // ─── Construtor privado (use SceneController.create) ───

    private constructor(canvas: HTMLCanvasElement, tweakpaneContainer: HTMLElement) {
        this.engine = new B.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        this.scene = new B.Scene(this.engine);
        this.scene.clearColor = new B.Color4(0.1, 0.1, 0.12, 1);

        this.cameraManager = new CameraManager(this.scene, canvas);
        this.uiManager = new UIManager(tweakpaneContainer);
        this.modelManager = new ModelManager(this.scene);

        this.light = new B.HemisphericLight('light1', EnvironmentConfigs.light.direction, this.scene);
        this.shaderManager = new ShaderManager(this.scene, this.cameraManager.camera, this.light);

        this.uiManager.setupGlobalControls((id) => {
            this.switchModel(id);
        });

        this.uiManager.setupShaderControls(
            (shaderId) => this.switchMaterialShader(shaderId),
            (shaderId, enabled) => this.togglePostProcess(shaderId, enabled)
        );

        // Render loop (roda mesmo antes da física estar pronta)
        const startTime = performance.now();
        this.engine.runRenderLoop(() => {
            const elapsed = (performance.now() - startTime) / 1000;
            this.shaderManager.updateTime(elapsed);
            this.scene.render();
        });

        window.addEventListener('resize', this.onResize);
    }

    // ─── Factory assíncrona ───

    public static async create(
        canvas: HTMLCanvasElement,
        tweakpaneContainer: HTMLElement
    ): Promise<SceneController> {
        const controller = new SceneController(canvas, tweakpaneContainer);

        await controller.initPhysics();
        await controller.switchModel('sphere');

        return controller;
    }

    private async initPhysics(): Promise<void> {
        const havokInstance = await HavokPhysics();
        const havokPlugin = new B.HavokPlugin(true, havokInstance);
        this.scene.enablePhysics(B.Vector3.Zero(), havokPlugin);

        this.createBoundariesWalls();
        this.setupInteraction();
    }

    // ─── Paredes invisíveis ───

    private createBoundariesWalls(): void {

        for (const wall of EnvironmentConfigs.boundaries) {
            const mesh = B.MeshBuilder.CreateBox(wall.name, {
                width: wall.size.w,
                height: wall.size.h,
                depth: wall.size.d
            }, this.scene);
            mesh.position = wall.pos;
            mesh.visibility = 0;
            mesh.isPickable = false;


            new B.PhysicsAggregate(mesh, B.PhysicsShapeType.BOX, {
                mass: 0,
                restitution: 0.5
            }, this.scene);
        }
    }

    // ─── Interação "Dedo" ───

    private setupInteraction(): void {
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type !== B.PointerEventTypes.POINTERDOWN) return;

            const pickInfo = pointerInfo.pickInfo;
            if (!pickInfo?.hit || !pickInfo.pickedPoint || !pickInfo.pickedMesh) return;

            const entity = this.modelManager.currentEntity;
            if (!entity || !entity.containsMesh(pickInfo.pickedMesh)) return;

            const direction = pickInfo.pickedPoint
                .subtract(this.cameraManager.camera.position)
                .normalize();

            entity.applyImpulse(
                direction.scale(PhysicsConfigs.interaction.impulseForce),
                pickInfo.pickedPoint
            );
        });
    }

    // ─── Troca de modelo ───

    private async switchModel(modelId: ModelId) {
        const gen = ++this.switchGeneration;

        const config: ModelConfig = ModelConfigs[modelId];

        if (!config) return;

        // Captura velocidades do modelo atual
        let prevLinVel = B.Vector3.Zero();
        let prevAngVel = B.Vector3.Zero();
        let prevPosition: B.Vector3 | null = null;
        let prevRotationQuat: B.Quaternion | null = null;

        if (this.modelManager.currentEntity) {

            const currentMesh = this.modelManager.currentEntity.mesh;

            prevLinVel = this.modelManager.currentEntity.getLinearVelocity();
            prevAngVel = this.modelManager.currentEntity.getAngularVelocity();
            prevPosition = currentMesh.position.clone();
            if (currentMesh.rotationQuaternion) {
                prevRotationQuat = currentMesh.rotationQuaternion.clone();
            }

            this.modelManager.currentEntity.restoreOriginalMaterials();
        }

        // Painel de parâmetros do modelo
        this.currentParams = {};
        this.uiManager.buildDynamicPanel(config, this.currentParams, (param, value) => {
            const entity = this.modelManager.currentEntity;
            if (param.onApply && entity) {
                param.onApply(entity.mesh, value as never);
                if (entity.hasPhysics) {
                    entity.rebuildPhysics();
                }
            }
        });

        const entity = await this.modelManager.loadModel(modelId);

        if (gen !== this.switchGeneration) {
            entity.setEnabled(false);
            return;
        }

        // Aplica defaults do modelo
        config.parameters.forEach(param => {
            if (param.onApply) {
                param.onApply(entity.mesh, this.currentParams[param.property] as never);
            }
        });

        // Centraliza o modelo na origem
        entity.mesh.position = B.Vector3.Zero();
        // const boundingInfo = entity.mesh.getHierarchyBoundingVectors();
        // const center = boundingInfo.max.add(boundingInfo.min).scale(0.5);
        // entity.mesh.position.subtractInPlace(center);

        if (prevPosition) {
            entity.mesh.position.addInPlace(prevPosition);
        }

        // 3. CALCULA E APLICA A ROTAÇÃO (Herança + Offset do Modelo)
        let finalRotation = B.Quaternion.Identity();

        // 3a. Se o modelo pede uma correção inicial (como a Suzanne)
        if (config.initialRotation) {
            const offsetQuat = B.Quaternion.FromEulerVector(config.initialRotation);
            finalRotation.multiplyInPlace(offsetQuat);
        }
        // 3b. Se existe uma rotação herdada do modelo antigo, multiplicamos as duas
        if (prevRotationQuat) {
            // A ordem aqui importa: aplicamos a correção local primeiro, depois a rotação do mundo
            finalRotation = prevRotationQuat.multiply(finalRotation);
        }
        // 3c. Aplica na malha (o Havok lida perfeitamente com Quaternions)
        entity.mesh.rotationQuaternion = finalRotation;


        // Habilita física (após posicionamento)
        entity.enablePhysics();

        // Transfere velocidade reduzida do modelo anterior
        entity.setLinearVelocity(prevLinVel.scale(PhysicsConfigs.model.velocityTransferFactor));
        entity.setAngularVelocity(prevAngVel.scale(PhysicsConfigs.model.velocityTransferFactor));

        // Re-aplica o shader ativo
        if (this.shaderManager.activeMaterialId) {
            this.shaderManager.applyMaterial(this.shaderManager.activeMaterialId, entity.mesh);
        }
    }

    // ─── Shaders ───

    private switchMaterialShader(shaderId: MaterialShaderId | 'none') {
        const entity = this.modelManager.currentEntity;
        if (!entity) return;

        entity.restoreOriginalMaterials();

        this.shaderParams = {};
        if (shaderId === 'none') {
            this.shaderManager.clearActiveMaterial();
            this.uiManager.clearShaderPanel();
            return;
        }

        this.shaderManager.applyMaterial(shaderId, entity.mesh);

        const config = MaterialShaders[shaderId];
        this.uiManager.buildShaderPanel(
            config.title,
            config.uniforms,
            this.shaderParams,
            (uniform, value) => {
                this.shaderManager.setMaterialUniform(uniform, value);
            }
        );
    }

    private togglePostProcess(shaderId: PostProcessShaderId, enabled: boolean) {
        if (enabled) {
            this.shaderManager.enablePostProcess(shaderId);
        } else {
            this.shaderManager.disablePostProcess(shaderId);
        }
    }

    // ─── Lifecycle ───

    private onResize = () => { this.engine.resize(); };

    public dispose() {
        this.uiManager.dispose();
        this.modelManager.dispose();
        this.shaderManager.dispose();

        window.removeEventListener('resize', this.onResize);

        this.scene.dispose();
        this.engine.dispose();
    }

}
