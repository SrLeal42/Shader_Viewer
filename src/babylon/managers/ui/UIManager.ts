import { Pane } from 'tweakpane';

import type { UIConfig, UIParameter } from '../../../types/UI';
import type { ShaderUniform } from '../../../shaders/Types';
import type { FrustumLimits } from '../../../types/Camera';

import type { ModelId } from '../../../configs/ModelConfigs';
import type { InteractionId } from '../../../configs/InteractionConfigs';
import type { SkyboxId } from '../../../configs/SkyboxConfigs';
import type { SkyboxEffectId } from '../../../configs/SkyboxEffectsConfigs';
import type { LightModeId, PointAnimationType } from '../../../configs/LightConfigs';
import type { MaterialShaderId, PostProcessShaderId } from '../../../shaders/Registry';

import { ModelSection } from './sections/ModelSection';
import { TransformSection } from './sections/TransformSection';
import { ShaderSection } from './sections/ShaderSection';
import { EnvironmentSection } from './sections/EnvironmentSection';
import { LightSection } from './sections/LightSection';
import { InteractionSection } from './sections/InteractionSection';


export class UIManager {
    private paneRight: Pane;
    private paneLeft: Pane;

    private modelSection: ModelSection;
    private transformSection: TransformSection;
    private shaderSection: ShaderSection;
    private environmentSection: EnvironmentSection;
    private lightSection: LightSection;
    private interactionSection: InteractionSection;

    constructor(tweakpaneRightContainer: HTMLElement, tweakpaneLeftContainer: HTMLElement) {
        this.paneRight = new Pane({ container: tweakpaneRightContainer });
        this.paneLeft = new Pane({ container: tweakpaneLeftContainer });

        this.modelSection = new ModelSection(this.paneRight);
        this.transformSection = new TransformSection(this.paneRight);
        this.shaderSection = new ShaderSection(this.paneRight);
        this.environmentSection = new EnvironmentSection(this.paneLeft);
        this.lightSection = new LightSection(this.paneLeft);
        this.interactionSection = new InteractionSection(this.paneLeft);
    }


    // ─── Delegações para o painel Direito ───

    public setupGlobalControls(onModelSelect: (id: ModelId) => void): void {
        this.modelSection.setup(onModelSelect);
    }

    public setupTransformControls(
        state: { pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number }, physics: boolean },
        onPhysicsChange: (enabled: boolean) => void,
        onTransformChange: () => void,
        limits: FrustumLimits
    ) {
        return this.transformSection.setup(state, onPhysicsChange, onTransformChange, limits);
    }

    public setupShaderControls(
        onMaterialSelect: (id: MaterialShaderId | 'none') => void,
        onPostProcessToggle: (id: PostProcessShaderId, enabled: boolean) => void // ← Volta pra void
    ): void {
        this.shaderSection.setup(onMaterialSelect, onPostProcessToggle);
    }

    public forceUncheckPostProcess(id: string): void {
        this.shaderSection.forceUncheckPostProcess(id);
    }

    public buildDynamicPanel(
        config: UIConfig,
        targetProxy: Record<string, unknown>,
        onChange: (param: UIParameter, value: unknown) => void
    ): void {
        this.modelSection.buildDynamicPanel(config, targetProxy, onChange);
    }

    public buildShaderPanel(
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {
        this.shaderSection.buildPanel(title, uniforms, targetProxy, onChange);
    }

    public buildPostProcessPanel(
        id: string,
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {
        this.shaderSection.buildPostProcessPanel(id, title, uniforms, targetProxy, onChange);
    }

    public clearPostProcessPanel(id: string): void {
        this.shaderSection.clearPostProcessPanel(id);
    }

    public clearShaderPanel(): void {
        this.shaderSection.clearPanel();
    }


    // ─── Delegações para o painel Esquerdo ───

    public setupInteractionControls(
        initialInteraction: InteractionId,
        onChange: (id: InteractionId) => void
    ): void {
        this.interactionSection.setup(initialInteraction, onChange);
    }

    public setupSkyboxControls(
        onSkyboxChange: (id: SkyboxId | 'color') => void,
        onColorChange: (color: { r: number; g: number; b: number }) => void
    ): void {
        this.environmentSection.setupSkybox(onSkyboxChange, onColorChange);
    }

    public setupSkyboxEffectsControls(
        onEffectToggle: (id: SkyboxEffectId, enabled: boolean) => void,
        registerForceOffCallback: (callback: (id: SkyboxEffectId) => void) => void
    ): void {
        this.environmentSection.setupEffects(onEffectToggle, registerForceOffCallback);
    }

    public setupLightControls(
        initialMode: LightModeId,
        onModeChange: (mode: LightModeId) => void,
        onHemiChange: (dir: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number) => void,
        onPointChange: (pos: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number, anim: PointAnimationType, speed: number, freq: number, showHelper: boolean) => void
    ): void {
        this.lightSection.setup(initialMode, onModeChange, onHemiChange, onPointChange);
    }


    // ─── Lifecycle ───

    public dispose(): void {
        this.modelSection.dispose();
        this.transformSection.dispose();
        this.shaderSection.dispose();
        this.environmentSection.dispose();
        this.lightSection.dispose();
        this.interactionSection.dispose();

        this.paneRight.dispose();
        this.paneLeft.dispose();
    }
}
