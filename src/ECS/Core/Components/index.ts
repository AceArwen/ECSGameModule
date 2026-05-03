// Entity definition
export type { Entity } from "./Entity";

// Base components
export type { 
    ObjectDefinitionComponent,
    ObjectInstanceComponent,
    DescriptionComponent
} from "./BaseComponents";

// Tag components
export type {
    UsableTagComponent,
    ConsummableTagComponent
} from "./TagComponents";

// Inventory components
export type {
    InventoryComponent,
    SlotComponent,
    HasOwnerComponent,
    IsOwnerComponent
} from "./InventoryComponents";

// Item components
export type {
    StackableComponent,
    WeaponComponent,
    HealComponent,
    HealthComponent
} from "./ItemComponents";
