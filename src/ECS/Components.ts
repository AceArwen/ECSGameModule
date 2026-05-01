import { ObjectId } from "./ObjectDefinitions";
import type { Entity } from "./ObjectDefinitions";


// All entities must have or point to a definition
export type ObjectDefinitionComponent = {
    objectType: ObjectId;
};

// Used to link an instance to its bas definition
export type ObjectInstanceComponent = {
    definition: Entity;
};

// Used to describe an entity (can be developed later)
export type DescriptionComponent = {
    name: string;
    description: string;
};

export type StackableComponent = {
    maxStack: number;
};

export type UsableTagComponent = {};

export type ConsummableTagComponent = {};


/// Inventory management
export type InventoryComponent = {
    slots: Entity[];
};

export type SlotComponent = {
    index: number;
    object: Entity | null;
    count: number;
};

export type HasOwnerComponent = {
    owner: Entity;
};

export type IsOwnerComponent = {
    ownedEntity: Entity;
};