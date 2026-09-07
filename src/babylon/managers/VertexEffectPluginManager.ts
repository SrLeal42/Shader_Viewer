import * as B from '@babylonjs/core';
import { VertexEffectPlugin } from '../plugins/VertexEffectPlugin';
import type { VertexEffectId } from '../../shaders/Registry';

/**
 * Gerencia a injeção do VertexEffectPlugin em todos os materiais nativos
 * (PBR/Standard) de um modelo, e mantém os uniforms sincronizados.
 */
export class VertexEffectPluginManager {
    private plugins: VertexEffectPlugin[] = [];
    private _activeEffectId: VertexEffectId = 'none';

    /** Acopla o plugin a todos os materiais nativos do mesh e seus filhos */
    public attachToMesh(mesh: B.AbstractMesh): void {
        this.detach();
        const materials = this.collectNativeMaterials(mesh);

        for (const mat of materials) {
            let plugin = mat.pluginManager?.getPlugin('VertexEffect') as VertexEffectPlugin | undefined;
            if (!plugin) {
                plugin = new VertexEffectPlugin(mat);
            }
            plugin.setEffect(this._activeEffectId);
            this.plugins.push(plugin);
        }

    }

    /** Remove referências aos plugins (o material os gerencia internamente) */
    public detach(): void {
        this.plugins = [];
    }

    /** Troca o efeito ativo em todos os plugins acoplados */
    public setEffect(effectId: VertexEffectId): void {
        this._activeEffectId = effectId;
        for (const plugin of this.plugins) {
            plugin.setEffect(effectId);
        }
    }

    /** Atualiza o tempo em todos os plugins (chamado no render loop) */
    public updateTime(time: number): void {
        for (const plugin of this.plugins) {
            plugin.setTime(time);
        }
    }

    /** Injeta os valores dos sliders da UI nos plugins */
    public injectUniforms(proxy: Record<string, unknown>): void {
        for (const plugin of this.plugins) {
            plugin.injectUniforms(proxy);
        }
    }

    /** Seta um uniform individual em todos os plugins */
    public setUniform(name: string, value: number): void {
        for (const plugin of this.plugins) {
            plugin.setUniformValue(name, value);
        }
    }

    public get activeEffectId(): VertexEffectId {
        return this._activeEffectId;
    }

    /** Coleta materiais PBR/Standard únicos do mesh e seus filhos */
    private collectNativeMaterials(mesh: B.AbstractMesh): B.Material[] {
        const seen = new Set<B.Material>();

        const check = (m: B.AbstractMesh) => {
            if (m.material &&
                (m.material instanceof B.PBRMaterial || m.material instanceof B.StandardMaterial)) {
                seen.add(m.material);
            }
        };

        check(mesh);
        for (const child of mesh.getChildMeshes()) {
            check(child);
        }

        return Array.from(seen);
    }

    public dispose(): void {
        this.detach();
    }
}
