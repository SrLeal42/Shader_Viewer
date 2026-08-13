import * as B from '@babylonjs/core';

import fogFragmentSource from '../../shaders/weather/FogOverlay.fragment.glsl?raw';

import { WeatherPresets, type WeatherPresetId } from '../../configs/weather/WeatherRegistry';
import type { WeatherPresetConfig, ParticleLayerConfig, FogConfig } from '../../configs/weather/WeatherTypes';

export class WeatherManager {
    private scene: B.Scene;
    private camera: B.Camera;

    private _activePresetId: WeatherPresetId | null = null;

    // Sub-sistemas ativos
    private fogPostProcess: B.PostProcess | null = null;
    private particleSystems: B.ParticleSystem[] = [];
    private cameraPostProcess: B.PostProcess | null = null;
    private cameraTextures: Map<string, B.Texture> = new Map();

    private currentTime = 0;

    constructor(scene: B.Scene, camera: B.Camera) {
        this.scene = scene;
        this.camera = camera;
    }

    // ─── Getters ───

    public get activePresetId(): WeatherPresetId | null {
        return this._activePresetId;
    }

    // ─── Controle Principal ───

    public enable(presetId: WeatherPresetId): void {
        // Se já está ativo o mesmo, não faz nada
        if (this._activePresetId === presetId) return;

        // Desliga o anterior (se houver)
        this.disable();

        const config = WeatherPresets[presetId];

        // Partículas
        if (config.particles) {
            for (const layer of config.particles) {
                this.createParticleLayer(layer, presetId);
            }
        }

        // Fog
        if (config.fog) {
            this.enableFog(config.fog);
        }

        // Efeito de Câmera (Post-Process)
        if (config.cameraEffect) {
            this.enableCameraEffect(config);
        }

        this._activePresetId = presetId;
    }

    public disable(): void {
        // Partículas
        for (const ps of this.particleSystems) {
            ps.stop();
            ps.dispose();
        }
        this.particleSystems = [];

        // Câmera PP
        if (this.cameraPostProcess) {
            this.cameraPostProcess.dispose();
            this.cameraPostProcess = null;
        }

        if (this.fogPostProcess) {
            this.fogPostProcess.dispose();
            this.fogPostProcess = null;
        }

        for (const tex of this.cameraTextures.values()) {
            tex.dispose();
        }
        this.cameraTextures.clear();

        this._activePresetId = null;
    }

    /** Chamado no render loop para atualizar u_time dos efeitos de câmera */
    public update(time: number): void {
        this.currentTime = time;
    }

    // ─── Partículas ───

    private createParticleLayer(layer: ParticleLayerConfig, presetId: string): void {
        const ps = new B.ParticleSystem(
            `weather_${presetId}_particles`,
            layer.capacity,
            this.scene
        );

        // Textura (se existir)
        if (layer.texturePath) {
            ps.particleTexture = new B.Texture(layer.texturePath, this.scene);
        }

        if (layer.spriteSheet) {
            ps.isAnimationSheetEnabled = true;
            ps.spriteCellWidth = layer.spriteSheet.cellWidth;
            ps.spriteCellHeight = layer.spriteSheet.cellHeight;
            ps.startSpriteCellID = 0;
            ps.endSpriteCellID = layer.spriteSheet.totalCells - 1;
            ps.spriteCellChangeSpeed = 0; // 0 = escolhe uma célula e mantém (não anima)
            ps.spriteRandomStartCell = true;
        }

        // Emissor: caixa grande acima da câmera
        ps.emitter = new B.Vector3(0, layer.emitterSize.y / 2 + 2, 0);

        ps.createBoxEmitter(
            new B.Vector3(
                layer.direction.x - 0.1,
                layer.direction.y,
                layer.direction.z - 0.1
            ),
            new B.Vector3(
                layer.direction.x + 0.1,
                layer.direction.y,
                layer.direction.z + 0.1
            ),
            new B.Vector3(
                -layer.emitterSize.x / 2,
                0,
                -layer.emitterSize.z / 2
            ),
            new B.Vector3(
                layer.emitterSize.x / 2,
                0,
                layer.emitterSize.z / 2
            )
        );

        // Tempo de vida
        ps.minLifeTime = layer.lifetime.min;
        ps.maxLifeTime = layer.lifetime.max;

        // Tamanho
        ps.minSize = layer.size.min;
        ps.maxSize = layer.size.max;

        // Velocidade
        ps.minEmitPower = layer.speed.min;
        ps.maxEmitPower = layer.speed.max;

        // Taxa de emissão
        ps.emitRate = layer.emitRate;

        // Gravidade (inclui vento)
        ps.gravity = new B.Vector3(
            layer.gravity.x,
            layer.gravity.y,
            layer.gravity.z
        );

        // Cores (gradiente ao longo da vida)
        ps.color1 = new B.Color4(
            layer.color.start.r, layer.color.start.g,
            layer.color.start.b, layer.color.start.a
        );
        ps.color2 = new B.Color4(
            layer.color.start.r, layer.color.start.g,
            layer.color.start.b, layer.color.start.a
        );
        ps.colorDead = new B.Color4(
            layer.color.end.r, layer.color.end.g,
            layer.color.end.b, layer.color.end.a
        );

        // Blend mode
        if (layer.blendMode === 'add') {
            ps.blendMode = B.ParticleSystem.BLENDMODE_ADD;
        } else {
            ps.blendMode = B.ParticleSystem.BLENDMODE_STANDARD;
        }

        ps.start();
        this.particleSystems.push(ps);
    }

    // ─── Fog ───


    private enableFog(fogConfig: FogConfig): void {

        const shaderName = 'weatherFogPostProcess';

        B.Effect.ShadersStore[`${shaderName}FragmentShader`] = fogFragmentSource;

        const depthRenderer = this.scene.enableDepthRenderer(this.camera, false);
        this.fogPostProcess = new B.PostProcess(
            'weatherFog',
            shaderName,
            {
                uniforms: ['u_fogColor', 'u_fogDensity', 'u_maxOpacity', 'u_fogStart', 'u_fogCurve', 'u_cameraMinZ', 'u_cameraMaxZ'],
                samplers: ['depthSampler'],
                size: 1.0,
                camera: this.camera,
                samplingMode: B.Texture.BILINEAR_SAMPLINGMODE,
                engine: this.scene.getEngine(),
                reusable: false,
            }
        );

        this.fogPostProcess.onApplyObservable.add((effect) => {
            effect.setColor3('u_fogColor', new B.Color3(fogConfig.color.r, fogConfig.color.g, fogConfig.color.b));
            effect.setFloat('u_fogDensity', fogConfig.density);
            effect.setFloat('u_maxOpacity', fogConfig.maxOpacity);
            effect.setFloat('u_fogStart', fogConfig.start);
            effect.setFloat('u_fogCurve', fogConfig.falloffCurve);
            effect.setFloat('u_cameraMinZ', this.camera.minZ);
            effect.setFloat('u_cameraMaxZ', this.camera.maxZ);

            effect.setTexture('depthSampler', depthRenderer.getDepthMap());
        });
    }

    // ─── Efeito de Câmera (Post-Process) ───

    private enableCameraEffect(config: WeatherPresetConfig): void {
        const effect = config.cameraEffect!;

        const shaderName = `weatherCamera_${this._activePresetId ?? 'default'}`;

        B.Effect.ShadersStore[`${shaderName}FragmentShader`] = effect.fragmentSource;

        // Coleta os samplers extras (ex: frostSampler)
        const samplerNames = effect.textures?.map(t => t.sampler) ?? [];
        const pp = new B.PostProcess(
            'weatherCameraEffect',
            shaderName,
            {
                uniforms: effect.uniforms,
                samplers: samplerNames,
                size: 1.0,
                camera: this.camera,
                samplingMode: B.Texture.BILINEAR_SAMPLINGMODE,
                engine: this.scene.getEngine(),
                reusable: false,
            }
        );

        // Carrega texturas extras (genérico, baseado no config)
        if (effect.textures) {
            for (const tex of effect.textures) {
                const texture = new B.Texture(tex.path, this.scene, false, false);
                this.cameraTextures.set(tex.sampler, texture);
            }
        }

        pp.onApplyObservable.add((ppEffect) => {
            ppEffect.setFloat('u_time', this.currentTime);

            // Overlay params (via config, com fallbacks seguros)
            const ov = effect.overlay;
            ppEffect.setFloat('u_intensity', ov?.intensity ?? 1.0);
            ppEffect.setFloat('u_vignetteInner', ov?.vignetteInner ?? 0.3);
            ppEffect.setFloat('u_vignetteOuter', ov?.vignetteOuter ?? 0.8);
            ppEffect.setFloat('u_pulseSpeed', ov?.pulseSpeed ?? 0.5);
            ppEffect.setFloat('u_pulseAmplitude', ov?.pulseAmplitude ?? 0.15);

            // Texturas dinâmicas
            for (const [samplerName, texture] of this.cameraTextures) {
                if (texture.isReady()) {
                    ppEffect.setTexture(samplerName, texture);
                }
            }

        });

        this.cameraPostProcess = pp;
    }

    // ─── Cleanup ───

    public dispose(): void {
        this.disable();
    }
}
