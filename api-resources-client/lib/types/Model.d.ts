import { FieldJSONValue } from './field/Field';
export declare type ModelJSON = {
    [key: string]: FieldJSONValue | undefined;
    type: string;
    id?: string;
};
export declare class Model {
    [index: string]: unknown;
    static type: string;
    id: string | null;
    type: string;
    static create(json: ModelJSON): Model;
    constructor(type?: string);
    deserialize(json: ModelJSON): void;
    serialize(): ModelJSON;
}
//# sourceMappingURL=Model.d.ts.map