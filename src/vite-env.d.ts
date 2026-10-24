/// <reference types="vite/client" />

declare const __LIVELY_BUILD__: boolean;
declare const __LIVELY_PRESET__: string;

declare module '*.glsl' {
    const value: string;
    export default value;
}

declare module '*.glsl?raw' {
    const value: string;
    export default value;
}
