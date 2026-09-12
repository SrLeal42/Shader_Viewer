import * as B from '@babylonjs/core';
import type { IInteraction, InteractionContext } from '../IInteraction';
import { InteractionConfigs } from '../../../configs/InteractionConfigs';

export class FingerInteraction implements IInteraction {
    public readonly id = 'finger';
    public readonly name = InteractionConfigs.finger.label;

    /** Força do impulso aplicada no clique */
    private readonly impulseForce = 1.5;

    public onPointerEvent(pointerInfo: B.PointerInfo, context: InteractionContext): void {
        if (pointerInfo.type === B.PointerEventTypes.POINTERUP) {
            window.dispatchEvent(new CustomEvent('cursor_action', { detail: 'idle' }));
            return;
        }

        if (pointerInfo.type !== B.PointerEventTypes.POINTERDOWN) return;

        window.dispatchEvent(new CustomEvent('cursor_action', { detail: 'finger_down' }));

        const pickInfo = pointerInfo.pickInfo;
        if (!pickInfo?.hit || !pickInfo.pickedPoint || !pickInfo.pickedMesh) return;

        const entity = context.currentEntity;
        if (!entity || !entity.containsMesh(pickInfo.pickedMesh)) return;

        const direction = pickInfo.pickedPoint
            .subtract(context.camera.position)
            .normalize();

        entity.applyImpulse(
            direction.scale(this.impulseForce),
            pickInfo.pickedPoint
        );
    }

}
