import * as B from '@babylonjs/core';

import { LightConfigs, type LightModeId, type PointAnimationType } from '../../configs/LightConfigs';

export class LightManager {
    private scene: B.Scene;

    private hemiLight: B.HemisphericLight;
    private pointLight: B.PointLight;

    public currentMode: LightModeId = LightConfigs.defaultMode;
    public isDirty: boolean = true;

    // Guarda as intensidades "verdadeiras" para quando a luz for ligada/desligada pela UI
    private hemiTrueIntensity = LightConfigs.hemi.intensity;
    private pointTrueIntensity = LightConfigs.point.intensity;

    // Animação
    private animObserver: B.Observer<B.Scene> | null = null;
    public animationType: PointAnimationType = LightConfigs.point.animationType;
    public orbitSpeed = LightConfigs.point.orbitSpeed;
    public pulseFrequency = LightConfigs.point.pulseFrequency;

    private orbitPhase = 0;
    private pulsePhase = 0;
    private lastTime = performance.now() / 1000;

    // Posição base do PointLight para a órbita matemática não bagunçar tudo
    private pointBasePosition = new B.Vector3(LightConfigs.point.position.x, LightConfigs.point.position.y, LightConfigs.point.position.z);

    private helperRoot: B.AbstractMesh | null = null;
    private helperSphereMat: B.StandardMaterial | null = null;
    private showHelper = LightConfigs.point.showHelper;

    private _tempHemiColor = new B.Color3();
    private _tempPointColor = new B.Color3();
    private _isDisposed = false;


    constructor(scene: B.Scene) {
        this.scene = scene;

        // Cria as luzes permanentemente na cena (Performance)
        const hConfig = LightConfigs.hemi;
        this.hemiLight = new B.HemisphericLight('HemiLight', new B.Vector3(hConfig.direction.x, hConfig.direction.y, hConfig.direction.z), this.scene);
        this.hemiLight.diffuse = new B.Color3(hConfig.color.r, hConfig.color.g, hConfig.color.b);

        const pConfig = LightConfigs.point;
        this.pointLight = new B.PointLight('PointLight', this.pointBasePosition, this.scene);
        this.pointLight.diffuse = new B.Color3(pConfig.color.r, pConfig.color.g, pConfig.color.b);

        this.setMode(this.currentMode);
        this.startAnimationLoop();

        this.loadHelperModel();
    }

    // ─── Controle de Estado ───

    public setMode(mode: LightModeId) {
        this.currentMode = mode;
        this.isDirty = true;

        // Truque de performance: Zera a intensidade em vez de dar dispose
        this.hemiLight.intensity = (mode === 'hemi' || mode === 'both') ? this.hemiTrueIntensity : 0;
        this.pointLight.intensity = (mode === 'point' || mode === 'both') ? this.pointTrueIntensity : 0;

        this.toggleHelper(this.showHelper);
    }

    public updateHemiLight(direction: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number) {
        this.hemiLight.direction.set(direction.x, direction.y, direction.z);
        this.hemiLight.diffuse.set(color.r, color.g, color.b);
        this.hemiTrueIntensity = intensity;
        this.isDirty = true;
        this.setMode(this.currentMode); // Atualiza imediatamente a intensidade visível
    }

    public updatePointLight(position: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number) {

        this.pointBasePosition.set(position.x, position.y, position.z);

        // Se não estiver orbitando no momento, atualiza a posição 3D instantaneamente
        if (this.animationType !== 'orbit') {
            this.pointLight.position.copyFrom(this.pointBasePosition);
        }

        this.pointLight.diffuse.set(color.r, color.g, color.b);
        this.pointTrueIntensity = intensity;

        if (this.animationType !== 'pulse') {
            this.setMode(this.currentMode);
        }

        this.isDirty = true;
    }

    // ─── Contrato com os Shaders Customizados ───

    public injectLightUniforms(material: B.ShaderMaterial) {
        // Hemi (Calcula usando a mesma variável sempre, economizando RAM)
        this.hemiLight.diffuse.scaleToRef(this.hemiLight.intensity, this._tempHemiColor);
        material.setVector3('u_hemiDir', this.hemiLight.direction);
        material.setColor3('u_hemiColor', this._tempHemiColor);

        // Point
        this.pointLight.diffuse.scaleToRef(this.pointLight.intensity, this._tempPointColor);
        material.setVector3('u_pointPos', this.pointLight.position);
        material.setColor3('u_pointColor', this._tempPointColor);

        this.isDirty = false;
    }


    // ─── Animações ───
    private startAnimationLoop() {

        this.animObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.currentMode === 'hemi') return;

            // ─── CÁLCULO DO DELTA TIME ───
            const time = performance.now() / 1000;
            const deltaTime = time - this.lastTime;
            this.lastTime = time;

            if (this.animationType === 'orbit') {
                this.isDirty = true;
                this.orbitPhase += deltaTime * this.orbitSpeed;

                const radius = Math.sqrt(this.pointBasePosition.x ** 2 + this.pointBasePosition.z ** 2) || 5;
                this.pointLight.position.x = Math.cos(this.orbitPhase) * radius;
                this.pointLight.position.z = Math.sin(this.orbitPhase) * radius;
                this.pointLight.position.y = this.pointBasePosition.y;
            }

            if (this.animationType === 'pulse') {
                this.isDirty = true;
                this.pulsePhase += deltaTime * this.pulseFrequency;

                const sine = (Math.sin(this.pulsePhase) + 1) / 2; // normaliza de 0 a 1
                const factor = 0.2 + (sine * 0.8);
                this.pointLight.intensity = this.pointTrueIntensity * factor;

            } else if (this.currentMode === 'point' || this.currentMode === 'both') {
                this.pointLight.intensity = this.pointTrueIntensity;
            }

            if (this.helperSphereMat) {
                this.pointLight.diffuse.scaleToRef(this.pointLight.intensity, this.helperSphereMat.emissiveColor);
            }

        });

    }

    // ─── HELPER ───

    public toggleHelper(visible: boolean) {
        this.showHelper = visible;
        if (this.helperRoot) {
            // Oculta se 'visible' for false OU se a luz de ponto estiver desativada no momento
            const isPointActive = (this.currentMode === 'point' || this.currentMode === 'both');
            this.helperRoot.setEnabled(visible && isPointActive);
        }
    }

    private async loadHelperModel() {
        try {
            const result = await B.SceneLoader.ImportMeshAsync('', '/models/', 'axis.glb', this.scene);

            if (this._isDisposed) {
                result.meshes.forEach(m => m.dispose(false, true));
                return;
            }

            // O loader de .glb ativa ToneMapping sozinho. Nós forçamos o desligamento para não quebrar nosso pipeline.
            this.scene.imageProcessingConfiguration.toneMappingEnabled = false;

            // O nó raiz gerencia toda a peça junta
            this.helperRoot = result.meshes[0];
            this.helperRoot.parent = this.pointLight;

            this.helperRoot.scaling = new B.Vector3(0.3, 0.3, 0.3);

            result.meshes.forEach(mesh => {
                if (mesh.name === 'Esfera') {

                    // A Esfera Central continua com o material dinâmico que muda de cor
                    this.helperSphereMat = new B.StandardMaterial('sphereHelperMat', this.scene);
                    this.helperSphereMat.disableLighting = true;
                    this.helperSphereMat.emissiveColor = new B.Color3();
                    mesh.material = this.helperSphereMat;

                } else if (mesh.name !== '__root__') {
                    // PRESERVAÇÃO DO MATERIAL ORIGINAL DAS SETAS
                    if (mesh.material) {
                        (mesh.material as B.PBRMaterial).unlit = true;
                    }
                }
            });

            this.toggleHelper(this.showHelper);

        } catch (error) {
            console.error("Erro ao carregar o Helper de Luz:", error);
        }

    }

    // ─── Cleanup ───

    public dispose() {
        this._isDisposed = true;

        if (this.animObserver) {
            this.scene.onBeforeRenderObservable.remove(this.animObserver);
        }

        if (this.helperRoot) {
            this.helperRoot.dispose(false, true);
        }

        if (this.helperSphereMat) {
            this.helperSphereMat.dispose();
        }

        this.hemiLight.dispose();
        this.pointLight.dispose();
    }
}
