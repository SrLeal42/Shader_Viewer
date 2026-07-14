import * as B from '@babylonjs/core';
import type { IInteraction, InteractionContext } from '../interactions/IInteraction';
import type { ModelEntity } from '../entities/ModelEntity';

export class InteractionManager {
    private scene: B.Scene;
    private getContext: () => InteractionContext;

    private activeInteraction: IInteraction | null = null;
    private interactions = new Map<string, IInteraction>();

    private pointerObserver: B.Observer<B.PointerInfo> | null = null;
    private renderObserver: B.Observer<B.Scene> | null = null;


    constructor(scene: B.Scene, camera: B.Camera, getEntity: () => ModelEntity | null) {
        this.scene = scene;

        // Criamos uma função getContext para sempre pegar a entidade mais atualizada
        this.getContext = () => ({
            scene,
            camera,
            currentEntity: getEntity()
        });

        // Ouve os cliques GLOBAIS UMA ÚNICA VEZ e repassa para a interação ativa
        this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
            if (this.activeInteraction?.onPointerEvent) {
                this.activeInteraction.onPointerEvent(pointerInfo, this.getContext());
            }
        });

        // Ouve o loop de renderização GLOBAL e repassa para a interação ativa
        this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.activeInteraction?.onBeforeRender) {
                this.activeInteraction.onBeforeRender(this.getContext());
            }
        });
    }

    public register(interaction: IInteraction) {
        this.interactions.set(interaction.id, interaction);
    }

    public setActive(id: string) {
        const next = this.interactions.get(id);
        if (!next) return;

        if (this.activeInteraction?.onDisable) {
            this.activeInteraction.onDisable(this.getContext());
        }

        this.activeInteraction = next;

        if (this.activeInteraction?.onEnable) {
            this.activeInteraction.onEnable(this.getContext());
        }
    }

    public dispose(): void {

        if (this.activeInteraction?.onDisable) {
            this.activeInteraction.onDisable(this.getContext());
        }

        this.activeInteraction = null;

        if (this.pointerObserver) {
            this.scene.onPointerObservable.remove(this.pointerObserver);
            this.pointerObserver = null;
        }

        if (this.renderObserver) {
            this.scene.onBeforeRenderObservable.remove(this.renderObserver);
            this.renderObserver = null;
        }

        this.interactions.clear();
    }

}
