import { FingerInteraction } from './effects/FingerInteraction';
import { MagnetInteraction } from './effects/MagnetInteraction';
import type { IInteraction } from './IInteraction';

export const AvailableInteractions: IInteraction[] = [
    new FingerInteraction(),
    new MagnetInteraction()
];
