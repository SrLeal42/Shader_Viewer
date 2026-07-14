import * as B from '@babylonjs/core';
import type { IInteraction, InteractionContext } from './IInteraction';
import { InteractionConfigs } from '../../configs/InteractionConfigs'; // Importando o novo config

export class FingerInteraction implements IInteraction {
    public readonly id = 'finger';
    public readonly name = InteractionConfigs.finger.label;

    public onPointerEvent(pointerInfo: B.PointerInfo, context: InteractionContext): void {
        if (pointerInfo.type !== B.PointerEventTypes.POINTERDOWN) return;

        const pickInfo = pointerInfo.pickInfo;
        if (!pickInfo?.hit || !pickInfo.pickedPoint || !pickInfo.pickedMesh) return;

        const entity = context.currentEntity;
        if (!entity || !entity.containsMesh(pickInfo.pickedMesh)) return;

        const direction = pickInfo.pickedPoint
            .subtract(context.camera.position)
            .normalize();

        // Lendo do novo config!
        const force = InteractionConfigs.finger.impulseForce || 1.5;

        entity.applyImpulse(
            direction.scale(force),
            pickInfo.pickedPoint
        );
    }

}
