import * as B from '@babylonjs/core';
import type { ModelEntity } from '../entities/ModelEntity';

// Dados que a interação recebe para saber o que está acontecendo no mundo
export interface InteractionContext {
    scene: B.Scene;
    camera: B.Camera;
    currentEntity: ModelEntity | null;
}

export interface IInteraction {
    readonly id: string;
    readonly name: string; // Para exibir no Tweakpane futuramente

    // Ciclo de vida
    onEnable?(context: InteractionContext): void;
    onDisable?(context: InteractionContext): void;

    // Tratamento de cliques, arrastos e solturas (Mouse/Touch)
    onPointerEvent?(pointerInfo: B.PointerInfo, context: InteractionContext): void;

    // Tratamento contínuo (roda a cada frame da tela) - Essencial para Buraco Negro e Mangueira
    onBeforeRender?(context: InteractionContext): void;
}
