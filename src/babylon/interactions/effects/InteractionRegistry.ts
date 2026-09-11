import { FingerInteraction } from './FingerInteraction';
import { MagnetInteraction } from '../MagnetInteraction';
import type { IInteraction } from '../IInteraction';

export const AvailableInteractions: IInteraction[] = [
    new FingerInteraction(),
    new MagnetInteraction()
];
