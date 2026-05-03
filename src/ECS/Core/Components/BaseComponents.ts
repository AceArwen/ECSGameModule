import { ObjectId } from "../../Data/ObjectDefinitions";
import type { Entity } from "./Entity";

// All entities must have or point to a definition
export type ObjectDefinitionComponent = {
    objectType: ObjectId;
};

// Used to link an instance to its base definition
export type ObjectInstanceComponent = {
    definition: Entity;
};

// Used to describe an entity (can be developed later)
export type DescriptionComponent = {
    name: string;
    description: string;
};
