import * as B from '@babylonjs/core';
import { VertexEffects, type VertexEffectId } from '../../shaders/Registry';
import { flattenUniforms } from '../../shaders/Types';

/**
 * Plugin de Material que injeta efeitos de vértice (wave, twist, inflate)
 * nos materiais nativos do BabylonJS (PBRMaterial, StandardMaterial).
 *
 * Usa os hooks CUSTOM_VERTEX_DEFINITIONS e CUSTOM_VERTEX_UPDATE_POSITION
 * para deformar a geometria sem perder as propriedades PBR.
 */
export class VertexEffectPlugin extends B.MaterialPluginBase {

    private _isEnabled = false;
    private _effectId: VertexEffectId = 'none';
    private _time = 0;
    private _uniformValues: Record<string, number> = {};

    constructor(material: B.Material) {
        super(material, 'VertexEffect', 200, {
            VERTEX_EFFECT: false,
            VFX_WAVE: false,
            VFX_TWIST: false,
            VFX_INFLATE: false,
        });
        this._enable(true);
    }

    // ─── API Pública ───

    public get effectId(): VertexEffectId {
        return this._effectId;
    }

    public setEffect(effectId: VertexEffectId): void {
        const wasEnabled = this._isEnabled;
        this._effectId = effectId;
        this._isEnabled = effectId !== 'none';

        // Reseta uniforms com os defaults do novo efeito
        this._uniformValues = {};
        const config = VertexEffects[effectId];
        flattenUniforms(config.uniforms).forEach(u => {
            this._uniformValues[u.uniform] = u.defaultValue as number;
        });

        // Força recompilação se o estado mudou
        if (wasEnabled !== this._isEnabled || this._isEnabled) {
            this.markAllDefinesAsDirty();
        }
    }

    public setTime(time: number): void {
        this._time = time;
    }

    public setUniformValue(name: string, value: number): void {
        this._uniformValues[name] = value;
    }

    public injectUniforms(proxy: Record<string, unknown>): void {
        const config = VertexEffects[this._effectId];
        flattenUniforms(config.uniforms).forEach(u => {
            if (proxy[u.uniform] !== undefined) {
                this._uniformValues[u.uniform] = proxy[u.uniform] as number;
            }
        });
    }

    // ─── Lifecycle do Plugin ───

    override prepareDefines(defines: B.MaterialDefines): void {
        (defines as any)['VERTEX_EFFECT'] = this._isEnabled;
        (defines as any)['VFX_WAVE'] = this._effectId === 'wave';
        (defines as any)['VFX_TWIST'] = this._effectId === 'twist';
        (defines as any)['VFX_INFLATE'] = this._effectId === 'inflate';
    }

    override getUniforms(): {
        ubo: { name: string; size: number; type: string }[];
        vertex: string;
    } {
        const ubo: { name: string; size: number; type: string }[] = [
            { name: 'vertexEffectTime', size: 1, type: 'float' },
        ];
        let vertexDecl = `
            uniform float vertexEffectTime;
        `;
        // Adiciona uniforms de todos os efeitos
        const seen = new Set<string>();
        for (const [, config] of Object.entries(VertexEffects)) {
            for (const uName of config.extraUniforms) {
                if (!seen.has(uName)) {
                    seen.add(uName);
                    ubo.push({ name: uName, size: 1, type: 'float' });
                    vertexDecl += `uniform float ${uName};\n`;
                }
            }
        }
        return { ubo, vertex: vertexDecl };
    }


    override getCustomCode(shaderType: string): Record<string, string> | null {
        if (shaderType !== 'vertex') return null;

        return {
            'CUSTOM_VERTEX_UPDATE_POSITION': `
                #ifdef VERTEX_EFFECT

                    #ifdef VFX_WAVE
                        float vfxWave = sin(positionUpdated.y * u_waveFrequency + vertexEffectTime * u_waveSpeed) * u_waveAmplitude;
                        positionUpdated += normalUpdated * vfxWave;
                    #endif

                    #ifdef VFX_TWIST
                        float vfxAngle = positionUpdated.y * u_twistStrength + vertexEffectTime * u_twistSpeed;
                        float vfxS = sin(vfxAngle);
                        float vfxC = cos(vfxAngle);
                        float vfxOldX = positionUpdated.x;
                        positionUpdated.x = vfxOldX * vfxC - positionUpdated.z * vfxS;
                        positionUpdated.z = vfxOldX * vfxS + positionUpdated.z * vfxC;
                    #endif

                    #ifdef VFX_INFLATE
                        float vfxPulse = sin(vertexEffectTime * u_inflateSpeed) * 0.5 + 0.5;
                        positionUpdated += normalUpdated * vfxPulse * u_inflateAmount;
                    #endif

                #endif
            `
        };
    }

    override bindForSubMesh(uniformBuffer: B.UniformBuffer): void {
        if (!this._isEnabled) return;

        uniformBuffer.updateFloat('vertexEffectTime', this._time);

        // Bind de todos os uniforms do efeito ativo
        const config = VertexEffects[this._effectId];
        for (const uName of config.extraUniforms) {
            uniformBuffer.updateFloat(uName, this._uniformValues[uName] ?? 0);
        }
    }




}
