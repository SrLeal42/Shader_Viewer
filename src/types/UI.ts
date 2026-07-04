export type ControlType = 'float' | 'color' | 'boolean' | 'vector3';

export interface UIParameter {
    property: string;
    label: string;
    type: ControlType;
    defaultValue: any; // Fim do hardcoding
    min?: number;
    max?: number;
    step?: number;

    // Callback opcional: A própria configuração diz como se aplicar no Babylon
    onApply?: (target: any, value: any) => void;
}

export interface UIConfig {
    title: string;
    parameters: UIParameter[];
}
