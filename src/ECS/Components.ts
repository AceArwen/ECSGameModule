import { ObjectId } from "./ObjectDefinitions";

// Entity type definition
export type Entity = number; // Just an ID

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

// Item components
export type WeaponComponent = {
    damage: number;
};

export type HealComponent = {
    amount: number;
};