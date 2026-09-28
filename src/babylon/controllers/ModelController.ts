import * as B from '../BabylonAdapter';

import type { ModelManager } from '../managers/ModelManager';
import type { PhysicsManager } from '../managers/PhysicsManager';
import type { DepthNormalManager } from '../managers/DepthNormalManager';
import type { UIManager } from '../managers/ui/UIManager';
import type { EventBus } from '../core/EventBus';
import type { FrustumLimits } from '../../types/Camera';

import { ModelConfigs, type ModelConfig, type ModelId } from '../../configs/ModelConfigs';
import { PhysicsConfigs } from '../../configs/PhysicsConfigs';
import type { ModelEntity } from '../entities/ModelEntity';

export class ModelController {

    private modelManager: ModelManager;
    private physicsManager: PhysicsManager;
    private depthNormalManager: DepthNormalManager;
    private uiManager: UIManager;

    // ─── Estado de Transformação ───

    private transformState = {
        pos: { x: 0, y: 0, z: 0 },
        rot: { x: 0, y: 0, z: 0 },
        physics: true
    };
    private transformUI: ReturnType<UIManager['setupTransformControls']> | null = null;

    private switchGeneration = 0;
    private currentParams: Record<string, unknown> = {};
    private _tempEuler = new B.Vector3();


    constructor(
        modelManager: ModelManager,
        physicsManager: PhysicsManager,
        depthNormalManager: DepthNormalManager,
        uiManager: UIManager,
        eventBus: EventBus
    ) {
        this.modelManager = modelManager;
        this.physicsManager = physicsManager;
        this.depthNormalManager = depthNormalManager;
        this.uiManager = uiManager;

        eventBus.on('UI_PHYSICS_TOGGLED', (enabled) => this.handlePhysicsChange(enabled));
        eventBus.on('UI_TRANSFORM_CHANGED', () => this.handleTransformChange());
    }


    // ─── Getters Públicos ───

    public get currentEntity(): ModelEntity | null {
        return this.modelManager.currentEntity;
    }

    public get currentModelId(): ModelId | null {
        return this.modelManager.currentModelId;
    }

    public get physicsEnabled(): boolean {
        return this.transformState.physics;
    }


    // ─── Setup da UI de Transformação ───

    public setupTransformUI(limits: FrustumLimits): void {
        this.transformUI = this.uiManager.setupTransformControls(
            this.transformState,
            limits
        );
    }


    // ─── Aplicação de Preset (chamado pelo SceneController.create) ───

    public applyPresetTransform(preset: {
        position?: { x: number, y: number, z: number },
        rotation?: { x: number, y: number, z: number },
        physics?: boolean
    }): void {

        if (preset.position) {
            this.transformState.pos = { ...preset.position };
        }
        if (preset.rotation) {
            this.transformState.rot = { ...preset.rotation };
        }
        if (preset.physics !== undefined) {
            this.transformState.physics = preset.physics;
        }

        this.handlePhysicsChange(this.transformState.physics);
        this.handleTransformChange();

        if (this.transformUI) this.transformUI.refresh();
    }


    // ─── Troca de Modelo ───
    // Retorna a entity carregada para que o SceneController possa
    // coordenar a re-aplicação do shader ativo.

    public async switchModel(modelId: ModelId, initialParams?: Record<string, unknown>): Promise<ModelEntity | null> {
        const gen = ++this.switchGeneration;
        const config: ModelConfig = ModelConfigs[modelId];

        if (!config) return null;

        const prevState = this.capturePreviousModelState();

        if (this.modelManager.currentEntity) {
            this.modelManager.currentEntity.restoreOriginalMaterials();
        }

        // Painel de parâmetros do modelo
        this.currentParams = initialParams ? { ...initialParams } : {};

        this.uiManager.buildDynamicPanel(config, this.currentParams, (param, value) => {
            const entity = this.modelManager.currentEntity;
            if (param.onApply && entity) {
                param.onApply(entity.mesh, value as never);
                if (entity.hasPhysics) {
                    entity.rebuildPhysics();
                }
            }
        });

        let entity: ModelEntity;

        try {
            entity = await this.modelManager.loadModel(modelId);
        } catch (err) {
            console.error(`[ModelController] Falha ao carregar modelo '${modelId}':`, err);

            if (this.modelManager.currentEntity) {
                this.modelManager.currentEntity.setEnabled(true);
                if (this.transformState.physics) {
                    this.modelManager.currentEntity.enablePhysics();
                }
            }

            return null;
        }

        if (gen !== this.switchGeneration) {
            entity.setEnabled(false);
            return null;
        }

        this.depthNormalManager.setTargetMesh(entity.mesh);

        // Aplica defaults do modelo
        config.parameters.forEach(param => {
            if (param.onApply) {
                param.onApply(entity.mesh, this.currentParams[param.property] as never);
            }
        });

        this.applyInitialModelTransform(entity, config, prevState.position, prevState.rotationQuat);
        this.transferPhysicsState(entity, prevState.linVel, prevState.angVel);

        return entity;
    }


    // ─── Tick de Física (chamado pelo render loop) ───

    public updatePhysicsTick(): void {
        if (!this.transformState.physics || !this.modelManager.currentEntity) return;

        this.physicsManager.applySpring(this.modelManager.currentEntity.mesh);

        this.updateTransformUI();
    }


    // ─── Handlers Internos ───

    public handlePhysicsChange(enabled: boolean): void {
        this.transformState.physics = enabled;

        const entity = this.modelManager.currentEntity;

        if (!entity) return;

        if (enabled) {
            entity.enablePhysics();
        } else {
            entity.disposePhysics();
        }

    }

    public handleTransformChange(): void {
        const entity = this.modelManager.currentEntity;

        if (!entity || this.transformState.physics) return;

        entity.mesh.position.set(this.transformState.pos.x, this.transformState.pos.y, this.transformState.pos.z);

        entity.mesh.rotationQuaternion = B.Quaternion.FromEulerAngles(
            B.Tools.ToRadians(this.transformState.rot.x),
            B.Tools.ToRadians(this.transformState.rot.y),
            B.Tools.ToRadians(this.transformState.rot.z)
        );

    }


    // ─── Helpers Privados ───

    private updateTransformUI(): void {
        if (!this.transformState.physics || !this.modelManager.currentEntity) return;

        const mesh = this.modelManager.currentEntity.mesh;

        this.transformState.pos.x = mesh.position.x;
        this.transformState.pos.y = mesh.position.y;
        this.transformState.pos.z = mesh.position.z;

        if (mesh.rotationQuaternion) {
            mesh.rotationQuaternion.toEulerAnglesToRef(this._tempEuler);

            this.transformState.rot.x = B.Tools.ToDegrees(this._tempEuler.x);
            this.transformState.rot.y = B.Tools.ToDegrees(this._tempEuler.y);
            this.transformState.rot.z = B.Tools.ToDegrees(this._tempEuler.z);
        }

        if (this.transformUI) this.transformUI.refresh();
    }

    private capturePreviousModelState() {
        let linVel = B.Vector3.Zero();
        let angVel = B.Vector3.Zero();
        let position: B.Vector3 | null = null;
        let rotationQuat: B.Quaternion | null = null;

        if (this.modelManager.currentEntity) {
            const currentMesh = this.modelManager.currentEntity.mesh;
            linVel = this.modelManager.currentEntity.getLinearVelocity();
            angVel = this.modelManager.currentEntity.getAngularVelocity();
            position = currentMesh.position.clone();
            if (currentMesh.rotationQuaternion) {
                rotationQuat = currentMesh.rotationQuaternion.clone();
            }
        }

        return { linVel, angVel, position, rotationQuat };
    }

    private applyInitialModelTransform(entity: ModelEntity, config: ModelConfig, prevPosition: B.Vector3 | null, prevRotationQuat: B.Quaternion | null) {
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
            finalRotation = prevRotationQuat.multiply(finalRotation);
        }

        entity.mesh.rotationQuaternion = finalRotation;
    }

    private transferPhysicsState(entity: ModelEntity, prevLinVel: B.Vector3, prevAngVel: B.Vector3) {

        if (this.transformState.physics) {
            entity.enablePhysics();
        } else {
            if (!entity.mesh.rotationQuaternion) {
                entity.mesh.rotationQuaternion = B.Quaternion.FromEulerVector(entity.mesh.rotation);
            }
        }

        entity.setLinearVelocity(prevLinVel.scale(PhysicsConfigs.model.velocityTransferFactor));
        entity.setAngularVelocity(prevAngVel.scale(PhysicsConfigs.model.velocityTransferFactor));
    }


    // ─── Dispose ───

    public dispose(): void {
        this.modelManager.dispose();
    }

}
