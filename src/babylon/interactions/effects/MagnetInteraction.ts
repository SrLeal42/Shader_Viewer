import * as B from '@babylonjs/core';
import type { IInteraction, InteractionContext } from '../IInteraction';
import { InteractionConfigs } from '../../../configs/InteractionConfigs';

export class MagnetInteraction implements IInteraction {
    public readonly id = 'magnet';
    public readonly name = InteractionConfigs.magnet.label;

    private isAttracting = false;
    private isRepelling = false;

    private baseForce = 1.0;

    public onPointerEvent(pointerInfo: B.PointerInfo, _context: InteractionContext): void {
        const type = pointerInfo.type;
        const button = pointerInfo.event.button;

        if (type === B.PointerEventTypes.POINTERDOWN) {

            if (button === 0) {
                this.isAttracting = true;
                window.dispatchEvent(new CustomEvent('cursor_action', { detail: 'magnet_attract' }));
            }

            if (button === 2) {
                this.isRepelling = true;
                window.dispatchEvent(new CustomEvent('cursor_action', { detail: 'magnet_repel' }));
            }

        }
        else if (type === B.PointerEventTypes.POINTERUP) {

            if (button === 0) this.isAttracting = false;
            if (button === 2) this.isRepelling = false;

            window.dispatchEvent(new CustomEvent('cursor_action', { detail: 'idle' }));
        }

    }

    public onBeforeRender(context: InteractionContext): void {
        if (!this.isAttracting && !this.isRepelling) return;

        const entity = context.currentEntity;

        if (!entity || !entity.hasPhysics) return;

        const scene = context.scene;
        const camera = context.camera;
        const meshPos = entity.mesh.position;
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, B.Matrix.Identity(), camera);

        // Distância atual do modelo até a câmera
        const currentDistance = B.Vector3.Distance(ray.origin, meshPos);

        // O Imã sempre paira no raio do mouse, 1 metro à frente do modelo (mais perto da câmera)
        const targetDistance = Math.max(0.1, currentDistance - 1.0);
        const magnetTargetPos = ray.origin.add(ray.direction.scale(targetDistance));

        // Vetor de direção: do Modelo apontando para o nosso Imã
        const dir = magnetTargetPos.subtract(meshPos);
        const distance = dir.length();

        // Fórmula real do magnetismo (Inverso do Quadrado da Distância)
        const safeDistance = Math.max(distance, 1.0);
        let forceMagnitude = this.baseForce / (safeDistance * safeDistance);

        // Se for repulsão, invertemos a força para ele fugir do imã (fundo da cena)
        if (this.isRepelling) forceMagnitude *= -1;

        // Aplica o impulso físico
        dir.normalize();
        entity.applyImpulse(dir.scale(forceMagnitude), meshPos);

    }

}
