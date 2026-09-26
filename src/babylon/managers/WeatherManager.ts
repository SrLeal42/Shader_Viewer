import * as B from '@babylonjs/core';

import fogFragmentSource from '../../shaders/weather/FogOverlay.fragment.glsl?raw';

import { WeatherPresets, type WeatherPresetId } from '../../configs/weather/WeatherRegistry';
import type { ParticleLayerConfig, FogConfig, CameraEffectConfig } from '../../configs/weather/WeatherTypes';
import { DepthNormalManager } from './DepthNormalManager';

interface WeatherCacheItem {
    particleSystems: B.ParticleSystem[];
    fogPostProcess: B.PostProcess | null;
    cameraPostProcess: B.PostProcess | null;
    cameraTextures: Map<string, B.Texture>;
}

export class WeatherManager {
    private scene: B.Scene;
    private camera: B.Camera;
    private depthNormalManager: DepthNormalManager;

    private _activePresetId: WeatherPresetId | null = null;

    // ─── Cache LRU ───
    private readonly MAX_CACHED_PRESETS = 3;
    private presetCache = new Map<WeatherPresetId, WeatherCacheItem>();
    private usageOrder: WeatherPresetId[] = []; // O último item é o mais recentemente usado

    private currentTime = 0;

    constructor(scene: B.Scene, camera: B.Camera, depthNormalManager: DepthNormalManager) {
        this.scene = scene;
        this.camera = camera;
        this.depthNormalManager = depthNormalManager;

        // Registra o shader genérico de fog apenas uma vez
        if (!B.Effect.ShadersStore['weatherFogPostProcessFragmentShader']) {
            B.Effect.ShadersStore['weatherFogPostProcessFragmentShader'] = fogFragmentSource;
        }
    }

    public get activePresetId(): WeatherPresetId | null {
        return this._activePresetId;
    }

    // ─── Controle Principal ───

    public enable(presetId: WeatherPresetId): void {
        if (this._activePresetId === presetId) return;

        this.disable(); // Apenas pausa/desvincula, não destrói o cache

        this._activePresetId = presetId;
        this.markAsUsed(presetId);

        if (this.presetCache.has(presetId)) {
            // Reaproveita do cache (Start / Attach)
            this.startCachedEffects(presetId);
        } else {
            // Eviction LRU: se o cache está cheio, destrói o mais antigo
            if (this.presetCache.size >= this.MAX_CACHED_PRESETS) {
                this.evictOldestCache();
            }
            // Instancia novos objetos
            this.createNewEffects(presetId);
        }
    }

    public disable(): void {
        if (!this._activePresetId) return;

        const cached = this.presetCache.get(this._activePresetId);
        if (cached) {
            // Para as partículas sem destruí-las
            for (const ps of cached.particleSystems) {
                ps.stop();
            }
            // Remove o pós-processamento da câmera sem destruí-lo
            if (cached.fogPostProcess) {
                this.camera.detachPostProcess(cached.fogPostProcess);
            }
            if (cached.cameraPostProcess) {
                this.camera.detachPostProcess(cached.cameraPostProcess);
            }
        }

        this._activePresetId = null;
    }

    public update(time: number): void {
        this.currentTime = time;
    }

    // ─── Lógica de Cache LRU ───

    private markAsUsed(presetId: WeatherPresetId): void {
        this.usageOrder = this.usageOrder.filter(id => id !== presetId);
        this.usageOrder.push(presetId);
    }

    private evictOldestCache(): void {
        const oldestId = this.usageOrder[0];
        if (!oldestId) return;

        const cached = this.presetCache.get(oldestId);

        if (cached) {

            for (const ps of cached.particleSystems) ps.dispose();

            if (cached.fogPostProcess) cached.fogPostProcess.dispose();

            if (cached.cameraPostProcess) cached.cameraPostProcess.dispose();

            for (const tex of cached.cameraTextures.values()) tex.dispose();
        }

        this.presetCache.delete(oldestId);
        this.usageOrder.shift(); // Remove o ID descartado
    }

    private startCachedEffects(presetId: WeatherPresetId): void {
        const cached = this.presetCache.get(presetId);
        if (!cached) return;

        for (const ps of cached.particleSystems) ps.start();

        if (cached.fogPostProcess) this.camera.attachPostProcess(cached.fogPostProcess);
        if (cached.cameraPostProcess) this.camera.attachPostProcess(cached.cameraPostProcess);
    }

    private createNewEffects(presetId: WeatherPresetId): void {
        const config = WeatherPresets[presetId];

        const cached: WeatherCacheItem = {
            particleSystems: [],
            fogPostProcess: null,
            cameraPostProcess: null,
            cameraTextures: new Map()
        };

        if (config.particles) {
            for (const layer of config.particles) {
                cached.particleSystems.push(this.createParticleLayer(layer, presetId));
            }
        }

        if (config.fog) {
            cached.fogPostProcess = this.createFog(config.fog);
        }

        if (config.cameraEffect) {
            cached.cameraPostProcess = this.createCameraEffect(config.cameraEffect, presetId, cached.cameraTextures);
        }

        this.presetCache.set(presetId, cached);
    }

    // ─── Criação de Efeitos ───

    private createParticleLayer(layer: ParticleLayerConfig, presetId: string): B.ParticleSystem {
        const ps = new B.ParticleSystem(`weather_${presetId}_particles`, layer.capacity, this.scene);

        if (layer.texturePath) ps.particleTexture = new B.Texture(layer.texturePath, this.scene);

        if (layer.spriteSheet) {
            ps.isAnimationSheetEnabled = true;
            ps.spriteCellWidth = layer.spriteSheet.cellWidth;
            ps.spriteCellHeight = layer.spriteSheet.cellHeight;
            ps.startSpriteCellID = 0;
            ps.endSpriteCellID = layer.spriteSheet.totalCells - 1;
            ps.spriteCellChangeSpeed = 0;
            ps.spriteRandomStartCell = true;
        }

        ps.emitter = new B.Vector3(0, layer.emitterSize.y / 2 + 2, 0);

        ps.createBoxEmitter(
            new B.Vector3(layer.direction.x - 0.1, layer.direction.y, layer.direction.z - 0.1),
            new B.Vector3(layer.direction.x + 0.1, layer.direction.y, layer.direction.z + 0.1),
            new B.Vector3(-layer.emitterSize.x / 2, 0, -layer.emitterSize.z / 2),
            new B.Vector3(layer.emitterSize.x / 2, 0, layer.emitterSize.z / 2)
        );

        ps.minLifeTime = layer.lifetime.min;
        ps.maxLifeTime = layer.lifetime.max;
        ps.minSize = layer.size.min;
        ps.maxSize = layer.size.max;
        ps.minEmitPower = layer.speed.min;
        ps.maxEmitPower = layer.speed.max;
        ps.emitRate = layer.emitRate;
        ps.gravity = new B.Vector3(layer.gravity.x, layer.gravity.y, layer.gravity.z);

        ps.color1 = new B.Color4(layer.color.start.r, layer.color.start.g, layer.color.start.b, layer.color.start.a);
        ps.color2 = new B.Color4(layer.color.start.r, layer.color.start.g, layer.color.start.b, layer.color.start.a);
        ps.colorDead = new B.Color4(layer.color.end.r, layer.color.end.g, layer.color.end.b, layer.color.end.a);

        ps.blendMode = layer.blendMode === 'add' ? B.ParticleSystem.BLENDMODE_ADD : B.ParticleSystem.BLENDMODE_STANDARD;

        ps.start();

        return ps;
    }

    private createFog(fogConfig: FogConfig): B.PostProcess {

        const pp = new B.PostProcess(
            'weatherFog',
            'weatherFogPostProcess',
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

        const fogColor = new B.Color3(fogConfig.color.r, fogConfig.color.g, fogConfig.color.b);

        pp.onApplyObservable.add((effect) => {
            effect.setColor3('u_fogColor', fogColor);
            effect.setFloat('u_fogDensity', fogConfig.density);
            effect.setFloat('u_maxOpacity', fogConfig.maxOpacity);
            effect.setFloat('u_fogStart', fogConfig.start);
            effect.setFloat('u_fogCurve', fogConfig.falloffCurve);
            effect.setFloat('u_cameraMinZ', this.camera.minZ);
            effect.setFloat('u_cameraMaxZ', this.camera.maxZ);
            effect.setTexture('depthSampler', this.depthNormalManager.getDepthTexture());
        });

        return pp;
    }

    private createCameraEffect(effect: CameraEffectConfig, presetId: string, textureCache: Map<string, B.Texture>): B.PostProcess {
        const shaderName = `weatherCamera_${presetId}`;

        if (!B.Effect.ShadersStore[`${shaderName}FragmentShader`]) {
            B.Effect.ShadersStore[`${shaderName}FragmentShader`] = effect.fragmentSource;
        }

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

        if (effect.textures) {
            for (const tex of effect.textures) {
                textureCache.set(tex.sampler, new B.Texture(tex.path, this.scene, false, false));
            }
        }

        pp.onApplyObservable.add((ppEffect) => {
            ppEffect.setFloat('u_time', this.currentTime);

            const ov = effect.overlay;
            ppEffect.setFloat('u_intensity', ov?.intensity ?? 1.0);
            ppEffect.setFloat('u_vignetteInner', ov?.vignetteInner ?? 0.3);
            ppEffect.setFloat('u_vignetteOuter', ov?.vignetteOuter ?? 0.8);
            ppEffect.setFloat('u_pulseSpeed', ov?.pulseSpeed ?? 0.5);
            ppEffect.setFloat('u_pulseAmplitude', ov?.pulseAmplitude ?? 0.15);

            for (const [samplerName, texture] of textureCache) {
                if (texture.isReady()) {
                    ppEffect.setTexture(samplerName, texture);
                }
            }
        });

        return pp;
    }

    // ─── Cleanup Total ───

    public dispose(): void {
        this.disable();

        for (const presetId of this.usageOrder) {
            const cached = this.presetCache.get(presetId);

            if (cached) {
                for (const ps of cached.particleSystems) ps.dispose();

                if (cached.fogPostProcess) cached.fogPostProcess.dispose();

                if (cached.cameraPostProcess) cached.cameraPostProcess.dispose();

                for (const tex of cached.cameraTextures.values()) tex.dispose();
            }
        }

        this.presetCache.clear();

        this.usageOrder = [];
    }

}
