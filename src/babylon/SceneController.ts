import * as B from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';

import { CameraManager } from './managers/CameraManager';
import { UIManager } from './managers/UIManager';
import { ModelManager } from './managers/ModelManager';
import { ShaderManager } from './managers/ShaderManager';
import { EnvironmentManager } from './managers/EnvironmentManager';
import { InteractionManager } from './managers/InteractionManager';

import { ModelConfigs, type ModelConfig, type ModelId } from '../configs/ModelConfigs';
import { EnvironmentConfigs } from '../configs/EnviromentConfigs';
import { PhysicsConfigs } from '../configs/PhysicsConfigs';

import { MaterialShaders, type MaterialShaderId, type PostProcessShaderId } from '../shaders/Registry';

import { FingerInteraction } from './interactions/FingerInteraction';


export class SceneController {
    private engine: B.Engine;
    public scene: B.Scene;

    public cameraManager: CameraManager;
    private uiManager: UIManager;

    private environmentManager: EnvironmentManager;

    private modelManager: ModelManager;
    private currentParams: Record<string, unknown> = {};

    private shaderManager: ShaderManager;
    private shaderParams: Record<string, unknown> = {};

    private interactionManager: InteractionManager;

    private transformState = {
        pos: { x: 0, y: 0, z: 0 },
        rot: { x: 0, y: 0, z: 0 },
        physics: true
    };
    private transformUI: ReturnType<UIManager['setupTransformControls']> | null = null;

    private switchGeneration = 0;

    private outOfBoundsStartTime: number | null = null;

    // ─── Construtor privado (use SceneController.create) ───

    private constructor(
        canvas: HTMLCanvasElement,
        tweakpaneRightContainer: HTMLElement,
        tweakpaneLeftContainer: HTMLElement
    ) {
        this.engine = new B.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        this.scene = new B.Scene(this.engine);
        this.scene.clearColor = new B.Color4(0.1, 0.1, 0.12, 1);

        this.cameraManager = new CameraManager(this.scene, canvas);
        const limits = this.cameraManager.calculateFrustumLimits();
        this.uiManager = new UIManager(tweakpaneRightContainer, tweakpaneLeftContainer);
        this.modelManager = new ModelManager(this.scene);
        this.environmentManager = new EnvironmentManager(this.scene);
        this.shaderManager = new ShaderManager(this.scene, this.cameraManager.camera, this.environmentManager.light);
        this.interactionManager = new InteractionManager(
            this.scene,
            this.cameraManager.camera,
            () => this.modelManager.currentEntity
        );

        this.interactionManager.register(new FingerInteraction());
        this.interactionManager.setActive('finger');

        this.uiManager.setupGlobalControls((id) => {
            this.switchModel(id);
        });

        this.uiManager.setupShaderControls(
            (shaderId) => this.switchMaterialShader(shaderId),
            (shaderId, enabled) => this.togglePostProcess(shaderId, enabled)
        );

        this.uiManager.setupInteractionControls('finger', (id) => {
            this.interactionManager.setActive(id);
        });

        this.transformUI = this.uiManager.setupTransformControls(
            this.transformState,
            this.handlePhysicsChange,
            this.handleTransformChange,
            limits
        );

        // Render loop (roda mesmo antes da física estar pronta)
        const startTime = performance.now();
        this.engine.runRenderLoop(() => {
            const elapsed = (performance.now() - startTime) / 1000;
            this.shaderManager.updateTime(elapsed);

            if (this.transformState.physics && this.modelManager.currentEntity) {

                this.applySpringPhysics(this.modelManager.currentEntity.mesh);

                this.updateTransformUI();
            }

            // this.updateTransformUI();

            this.scene.render();
        });

        window.addEventListener('resize', this.onResize);
    }

    // ─── Factory assíncrona ───

    public static async create(
        canvas: HTMLCanvasElement,
        tweakpaneRightContainer: HTMLElement,
        tweakpaneLeftContainer: HTMLElement
    ): Promise<SceneController> {
        const controller = new SceneController(canvas, tweakpaneRightContainer, tweakpaneLeftContainer);

        await controller.initPhysics();
        const limits = controller.cameraManager.calculateFrustumLimits();
        controller.environmentManager.resizeBoundaries(limits);
        await controller.switchModel('sphere');

        return controller;
    }

    private async initPhysics(): Promise<void> {
        const havokInstance = await HavokPhysics();
        const havokPlugin = new B.HavokPlugin(true, havokInstance);
        this.scene.enablePhysics(B.Vector3.Zero(), havokPlugin);
    }

    private handlePhysicsChange = (enabled: boolean) => {
        const entity = this.modelManager.currentEntity;
        if (!entity) return;
        if (enabled) {
            entity.enablePhysics();
        } else {
            entity.disposePhysics();
        }
    };

    private handleTransformChange = () => {
        const entity = this.modelManager.currentEntity;
        if (!entity || this.transformState.physics) return;
        entity.mesh.position.set(this.transformState.pos.x, this.transformState.pos.y, this.transformState.pos.z);
        entity.mesh.rotationQuaternion = B.Quaternion.FromEulerAngles(
            B.Tools.ToRadians(this.transformState.rot.x),
            B.Tools.ToRadians(this.transformState.rot.y),
            B.Tools.ToRadians(this.transformState.rot.z)
        );
    };


    private applySpringPhysics(mesh: B.AbstractMesh) {

        if (!EnvironmentConfigs.physicsSpring.enabled) return;

        const config = EnvironmentConfigs.physicsSpring;

        const direction = B.Vector3.Zero().subtract(mesh.position);
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

    private updateTransformUI = () => {
        if (!this.transformState.physics || !this.modelManager.currentEntity) return;
        const mesh = this.modelManager.currentEntity.mesh;
        this.transformState.pos.x = mesh.position.x;
        this.transformState.pos.y = mesh.position.y;
        this.transformState.pos.z = mesh.position.z;
        if (mesh.rotationQuaternion) {
            const euler = mesh.rotationQuaternion.toEulerAngles();

            this.transformState.rot.x = B.Tools.ToDegrees(euler.x);
            this.transformState.rot.y = B.Tools.ToDegrees(euler.y);
            this.transformState.rot.z = B.Tools.ToDegrees(euler.z);

        }
        if (this.transformUI) this.transformUI.refresh();
    };


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


        if (prevPosition) {
            entity.mesh.position.addInPlace(prevPosition);
        }

        let finalRotation = B.Quaternion.Identity();

        if (config.initialRotation) {
            const offsetQuat = B.Quaternion.FromEulerVector(config.initialRotation);
            finalRotation.multiplyInPlace(offsetQuat);
        }

        if (prevRotationQuat) {
            // A ordem aqui importa: aplicamos a correção local primeiro, depois a rotação do mundo
            finalRotation = prevRotationQuat.multiply(finalRotation);
        }

        entity.mesh.rotationQuaternion = finalRotation;


        if (this.transformState.physics) {
            entity.enablePhysics();
        } else {
            // Garante que o modelo utilize Quaternions mesmo sem física,
            // para o Tweakpane não dar erro ao editar a rotação.
            if (!entity.mesh.rotationQuaternion) {
                entity.mesh.rotationQuaternion = B.Quaternion.FromEulerVector(entity.mesh.rotation);
            }
        }

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

    private onResize = () => {
        this.engine.resize();

        const limits = this.cameraManager.calculateFrustumLimits();

        this.environmentManager.resizeBoundaries(limits);

        this.transformUI = this.uiManager.setupTransformControls(
            this.transformState,
            this.handlePhysicsChange,
            this.handleTransformChange,
            limits
        );
    };

    public dispose() {
        this.uiManager.dispose();
        this.modelManager.dispose();
        this.shaderManager.dispose();
        this.environmentManager.dispose();
        this.interactionManager.dispose();

        window.removeEventListener('resize', this.onResize);

        this.scene.dispose();
        this.engine.dispose();
    }

}
