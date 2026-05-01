import { ComponentRegistry } from "./Registry";
import type { Entity } from "./Components";

export const PLAYER_INVENTORY_SIZE = 3;
export const ENEMY_INVENTORY_SIZE = 3;
export const CHEST_INVENTORY_SIZE = 4;

export enum ObjectId {
    CHARACTER = 0,
    CHEST = 1,
    SWORD = 2,
    BANDAGE = 3,
    KEY = 4,
}

// Chest loot generation constants
const CHEST_SLOT_FILL_CHANCE = 0.6;
const BANDAGE_SPAWN_CHANCE = 0.4;
const SWORD_SPAWN_CHANCE = 0.3;
const KEY_SPAWN_CHANCE = 0.3;
const BANDAGE_MIN_COUNT = 3;
const BANDAGE_MAX_COUNT = 8;

// Define possible chest items with their spawn chances
const POSSIBLE_CHEST_ITEMS = [
    { type: ObjectId.BANDAGE, chance: BANDAGE_SPAWN_CHANCE, minCount: BANDAGE_MIN_COUNT, maxCount: BANDAGE_MAX_COUNT },
    { type: ObjectId.SWORD, chance: SWORD_SPAWN_CHANCE, minCount: 1, maxCount: 1 },
    { type: ObjectId.KEY, chance: KEY_SPAWN_CHANCE, minCount: 1, maxCount: 1 }
];

export class ObjectManager {
    constructor(private registry: ComponentRegistry) { }

    createObjectDefinition(name: string, description?: string) {
        const entityId = this.registry.createEntity();
        this.registry.addComponent("description", entityId, {
            name: name,
            description: description || `${name} definition`
        });
        return entityId;
    }

    getObjectDefinition(objectType: ObjectId) {
        if (!this.registry.getDefinitionEntity(objectType)) {
            throw new Error(`Object definition for ${objectType} not found. Make sure createObjectDefinition() was called.`);
        }
        return this.registry.getDefinitionEntity(objectType);
    }

    getEntityDefinition(entityId: number) {
        // Check if entity is a definition by checking if it has a definition component
        const definition = this.registry.components.get('definition').get(entityId);
        if (definition) {
            return entityId;
        }
        
        // Check if entity is an instance and return its definition
        const instance = this.registry.components.get('instance').get(entityId);
        if (instance) {
            return instance.definition;
        }
        
        throw new Error(`Entity ${entityId} is neither a definition nor an instance`);
    }

    // Handle object instance creation
    createObjectInstance(objectType: ObjectId) {
        const definitionEntity = this.registry.getDefinitionEntity(objectType);

        if (!definitionEntity) {
            throw new Error(`Object definition for ${objectType} not found. Make sure createObjectDefinition() was called.`);
        }

        const entityId = this.registry.createEntity();
        this.registry.addComponent("instance", entityId, {
            definition: definitionEntity
        });
        return entityId;
    }

    initializeObjectDefinitions() {
        this.addCharacterDefinition();
        this.addChestDefinition();
        this.addSwordDefinition();
        this.addBandageDefinition();
        this.addKeyDefinition();
    }

    addCharacterDefinition() {
        const entityId = this.createObjectDefinition("Character");
        this.registry.markAsDefinition(entityId, ObjectId.CHARACTER);
    }

    addChestDefinition() {
        const entityId = this.createObjectDefinition("Chest");
        this.registry.markAsDefinition(entityId, ObjectId.CHEST);
    }

    addSwordDefinition() {
        const entityId = this.createObjectDefinition("Sword");
        this.registry.addComponent("weapon", entityId, {
            damage: 10
        });
        this.registry.markAsDefinition(entityId, ObjectId.SWORD);
    }

    addSwordInstance() {
        const entityId = this.createObjectInstance(ObjectId.SWORD);
        return entityId;
    }

    addBandageDefinition() {
        const entityId = this.createObjectDefinition("Bandage");
        this.registry.addComponent("stackable", entityId, {
            maxStack: 10
        });
        this.registry.addComponent("heal", entityId, {
            amount: 10
        });
        this.registry.addComponent("usable", entityId, {});
        this.registry.addComponent("consummable", entityId, {});
        this.registry.markAsDefinition(entityId, ObjectId.BANDAGE);
    }

    addKeyDefinition() {
        const entityId = this.createObjectDefinition("Key");
        this.registry.markAsDefinition(entityId, ObjectId.KEY);
    }

    createPlayerInstance() {
        const playerEntity = this.createObjectInstance(ObjectId.CHARACTER);
        this.registry.inventoryHelper.createInventory(playerEntity, PLAYER_INVENTORY_SIZE);
        this.initializePlayerInventory(playerEntity);
        return playerEntity;
    }

    initializePlayerInventory(player: Entity) {
        const playerInventory = this.registry.inventoryHelper.getInventoryByOwner(player);
        if (!playerInventory) return;

        const playerInventorySlots = this.registry.inventoryHelper.getInventorySlots(playerInventory);

        // Check if inventory is already initialized to prevent re-initialization
        const existingItems = playerInventorySlots.filter(slot => this.registry.components.get("slot").get(slot)?.object);
        if (existingItems.length > 0) {
            return;
        }
        
        // Add starting items to player inventory
        const swordInstance = this.addSwordInstance();
        const bandageDef = this.registry.getDefinitionEntity(ObjectId.BANDAGE);
        const keyDef = this.registry.getDefinitionEntity(ObjectId.KEY);
        
        if (swordInstance) {
            this.registry.inventoryHelper.addObjectToInventory(playerInventory, swordInstance, 1);
        }
        if (bandageDef) {
            this.registry.inventoryHelper.addObjectToInventory(playerInventory, bandageDef, 5);
        }
        if (keyDef) {
            this.registry.inventoryHelper.addObjectToInventory(playerInventory, keyDef, 1);
        }

        const inventory = this.registry.components.get("inventory").get(playerInventory);
        if (!inventory) return;
    }


    createChestInstance() {
        const chestEntity = this.createObjectInstance(ObjectId.CHEST);
        this.registry.inventoryHelper.createInventory(chestEntity, CHEST_INVENTORY_SIZE);
        this.initializeChestInventory(chestEntity);
        return chestEntity;
    }

    initializeChestInventory(chest: Entity) {
        const chestInventory = this.registry.inventoryHelper.getInventoryByOwner(chest);
        if (!chestInventory) return;

        const inventory = this.registry.components.get("inventory").get(chestInventory);
        if (!inventory) return;

        // Track which item types have been used to prevent duplicates
        const usedItemTypes = new Set<ObjectId>();

        // Generate items for each slot (with some randomness)
        for (let i = 0; i < inventory.slots.length; i++) {
            // 60% chance for each slot to contain an item
            if (Math.random() < CHEST_SLOT_FILL_CHANCE) {
                // Filter out already used item types
                const availableItems = POSSIBLE_CHEST_ITEMS.filter(item => !usedItemTypes.has(item.type));

                if (availableItems.length === 0) break; // No more unique items to place

                // Select a random item from available ones
                const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                usedItemTypes.add(selectedItem.type);

                // Use object definition for stackable items
                const itemEntity = this.registry.getDefinitionEntity(selectedItem.type);
                const quantity = selectedItem.minCount + Math.floor(Math.random() * (selectedItem.maxCount - selectedItem.minCount + 1));

                this.registry.inventoryHelper.addObjectToInventory(chestInventory, itemEntity, quantity);
            }
        }
    }
}
