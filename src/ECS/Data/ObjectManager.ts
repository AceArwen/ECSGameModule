import { ComponentRegistry, EntityManager } from "../Core";
import type { Entity } from "../Core";
import { ObjectId, POSSIBLE_CHEST_ITEMS, PLAYER_INVENTORY_SIZE, CHEST_INVENTORY_SIZE, CHEST_SLOT_FILL_CHANCE } from "./ObjectDefinitions";
import type { InventorySystem } from "../Systems";

/**
 * Object creation and management system.
 * Handles object definitions and instance creation.
 * 
 * Responsibilities:
 * - Creating object definitions (templates)
 * - Creating object instances from definitions
 * - Managing object type registry
 * 
 * Not responsible for:
 * - Component storage (handled by ComponentRegistry)
 * - Entity lifecycle (handled by EntityManager)
 * - Game logic processing
 */
export class ObjectManager {
    private objectDefinitions: Record<ObjectId, Entity> = {} as Record<ObjectId, Entity>;

    /**
     * Creates object manager with required dependencies.
     * 
     * @param {ComponentRegistry} registry - Component storage system
     * @param {EntityManager} entityManager - Entity lifecycle manager
     */
    constructor(
        private registry: ComponentRegistry,
        private entityManager: EntityManager
    ) {}

    /**
     * Creates a new object definition with description.
     * 
     * @param {string} name - Object name
     * @param {string} [description] - Optional description
     * 
     * @returns {Entity} Created definition entity
     */
    createObjectDefinition(name: string, description?: string): Entity {
        const entityId = this.entityManager.createEntity();
        this.registry.addComponent("description", entityId, {
            name: name,
            description: description || `${name} definition`
        });
        return entityId;
    }

    /**
     * Gets object definition by type.
     * 
     * @param {ObjectId} objectType - Type of object
     * 
     * @returns {Entity} Definition entity
     * 
     * @throws {Error} If definition not found
     */
    getObjectDefinition(objectType: ObjectId): Entity {
        if (!this.objectDefinitions[objectType]) {
            throw new Error(`Object definition for ${objectType} not found. Make sure createObjectDefinition() was called.`);
        }
        return this.objectDefinitions[objectType];
    }

    /**
     * Gets the definition entity for any entity.
     * 
     * @param {Entity} entity - Entity to get definition for
     * 
     * @returns {Entity} Definition entity
     * 
     * @throws {Error} If entity is neither definition nor instance
     */
    getEntityDefinition(entity: Entity): Entity {
        const definition = this.registry.getComponent('definition', entity);
        if (definition) {
            return entity;
        }
        
        const instance = this.registry.getComponent('instance', entity);
        if (instance) {
            return instance.definition;
        }
        
        throw new Error(`Entity ${entity} is neither a definition nor an instance`);
    }

    /**
     * Creates an instance of an object type.
     * 
     * @param {ObjectId} objectType - Type to instantiate
     * 
     * @returns {Entity} Created instance entity
     * 
     * @throws {Error} If definition not found
     */
    createObjectInstance(objectType: ObjectId): Entity {
        const definitionEntity = this.objectDefinitions[objectType];

        if (!definitionEntity) {
            throw new Error(`Object definition for ${objectType} not found. Make sure createObjectDefinition() was called.`);
        }

        const entityId = this.entityManager.createEntity();
        this.registry.addComponent("instance", entityId, {
            definition: definitionEntity
        });
        return entityId;
    }

    /**
     * Marks entity as definition and registers it by type.
     * 
     * @param {Entity} entity - Entity to mark as definition
     * @param {ObjectId} objectType - Object type identifier
     */
    markAsDefinition(entity: Entity, objectType: ObjectId): void {
        this.entityManager.markAsDefinition(entity);
        this.registry.addComponent("definition", entity, {
            objectType
        });
        this.objectDefinitions[objectType] = entity;
    }

    /**
     * Gets definition entity by object type.
     * 
     * @param {ObjectId} objectType - Object type
     * 
     * @returns {Entity | undefined} Definition entity or undefined
     */
    getDefinitionEntity(objectType: ObjectId): Entity | undefined {
        return this.objectDefinitions[objectType];
    }

    /**
     * Initializes all game object definitions.
     * Should be called during game setup.
     */
    initializeObjectDefinitions(): void {
        this.addCharacterDefinition();
        this.addChestDefinition();
        this.addSwordDefinition();
        this.addBandageDefinition();
        this.addKeyDefinition();
    }

    private addCharacterDefinition(): void {
        const entityId = this.createObjectDefinition("Character");
        this.markAsDefinition(entityId, ObjectId.CHARACTER);
    }

    private addChestDefinition(): void {
        const entityId = this.createObjectDefinition("Chest");
        this.markAsDefinition(entityId, ObjectId.CHEST);
    }

    private addSwordDefinition(): void {
        const entityId = this.createObjectDefinition("Sword");
        this.registry.addComponent("weapon", entityId, {
            damage: 10
        });
        this.markAsDefinition(entityId, ObjectId.SWORD);
    }

    private addBandageDefinition(): void {
        const entityId = this.createObjectDefinition("Bandage");
        this.registry.addComponent("stackable", entityId, {
            maxStack: 10
        });
        this.registry.addComponent("heal", entityId, {
            amount: 10
        });
        this.registry.addComponent("usable", entityId, {});
        this.registry.addComponent("consummable", entityId, {});
        this.markAsDefinition(entityId, ObjectId.BANDAGE);
    }

    private addKeyDefinition(): void {
        const entityId = this.createObjectDefinition("Key");
        this.markAsDefinition(entityId, ObjectId.KEY);
    }

    createPlayerInstance(): Entity {
        const playerEntity = this.createObjectInstance(ObjectId.CHARACTER);
        
        // Add Health component to player
        this.registry.addComponent("health", playerEntity, {
            health: 100,
            maxHealth: 100,
            onDeath: () => {
                console.log("💀 Player has died!");
            }
        });
        
        return playerEntity;
    }

    /**
     * Creates and initializes a player instance with inventory.
     * 
     * @param {InventorySystem} inventorySystem - The inventory system to use
     * 
     * @returns {Entity} The created player entity
     */
    createPlayerInstanceWithInventory(inventorySystem: InventorySystem): Entity {
        const playerEntity = this.createPlayerInstance();
        
        // Create and initialize player inventory
        inventorySystem.createInventory(playerEntity, PLAYER_INVENTORY_SIZE);
        this.initializePlayerInventory(playerEntity, inventorySystem);
        
        return playerEntity;
    }

    createChestInstance(): Entity {
        const chestEntity = this.createObjectInstance(ObjectId.CHEST);
        return chestEntity;
    }

    /**
     * Creates and initializes a chest instance with inventory.
     * 
     * @param {InventorySystem} inventorySystem - The inventory system to use
     * 
     * @returns {Entity} The created chest entity
     */
    createChestInstanceWithInventory(inventorySystem: InventorySystem): Entity {
        const chestEntity = this.createChestInstance();
        
        // Create and initialize chest inventory
        inventorySystem.createInventory(chestEntity, CHEST_INVENTORY_SIZE);
        this.initializeChestInventory(chestEntity, inventorySystem);
        
        return chestEntity;
    }

    /**
     * Initializes a player inventory with starting items.
     * Creates inventory if it doesn't exist and sets up initial items.
     * 
     * @param {Entity} player - The player entity
     * @param {InventorySystem} inventorySystem - The inventory system to use
     */
    initializePlayerInventory(player: Entity, inventorySystem: InventorySystem): void {
        const inventory = inventorySystem.getInventoryByOwner(player);
        if (!inventory) {
            inventorySystem.createInventory(player, PLAYER_INVENTORY_SIZE);
            return;
        }

        // Check if already initialized
        const slots = inventorySystem.getInventorySlots(inventory);
        const existingItems = slots.filter(slot => inventorySystem.slotHasObject(slot));
        if (existingItems.length > 0) return; // Already initialized

        // Add starting items (this would create actual item instances)
        // For now, this is a placeholder - the actual item creation should be handled elsewhere
    }

    /**
     * Initializes a chest inventory with random loot.
     * Creates inventory if it doesn't exist and fills with random items.
     * 
     * @param {Entity} chest - The chest entity
     * @param {InventorySystem} inventorySystem - The inventory system to use
     */
    initializeChestInventory(chest: Entity, inventorySystem: InventorySystem): void {
        const inventory = inventorySystem.getInventoryByOwner(chest);
        if (!inventory) {
            inventorySystem.createInventory(chest, CHEST_INVENTORY_SIZE);
            return;
        }

        const slots = inventorySystem.getInventorySlots(inventory);
        const usedItemTypes = new Set<ObjectId>();

        // Generate items for each slot
        for (let i = 0; i < slots.length; i++) {
            if (Math.random() < CHEST_SLOT_FILL_CHANCE) {
                const availableItems = POSSIBLE_CHEST_ITEMS.filter(item => !usedItemTypes.has(item.type));
                
                if (availableItems.length === 0) break;

                const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                usedItemTypes.add(selectedItem.type);

                // This would create actual item instances using ObjectManager
                // For now, this is a placeholder
                const _quantity = selectedItem.minCount + Math.floor(Math.random() * (selectedItem.maxCount - selectedItem.minCount + 1));
                // inventorySystem.addObjectToInventory(inventory, itemEntity, quantity);
            }
        }
    }
}
