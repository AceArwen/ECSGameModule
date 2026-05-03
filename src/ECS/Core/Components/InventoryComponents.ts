import type { Entity } from "./Entity";

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
