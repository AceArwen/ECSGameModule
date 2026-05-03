import { ComponentRegistry, EntityManager, EntityFilters } from "../Core";
import type { Entity, EntityProcessingSystem, EntityFilter } from "../Core";
import { ObjectId, PLAYER_INVENTORY_SIZE, CHEST_INVENTORY_SIZE, CHEST_SLOT_FILL_CHANCE, POSSIBLE_CHEST_ITEMS } from "../Data/ObjectDefinitions";

/**
 * Inventory management system.
 * Handles inventory creation, slot management, and item operations.
 * 
 * Responsibilities:
 * - Creating inventories and slots
 * - Managing item stacking and storage
 * - Providing inventory access methods
 * 
 * Not responsible for:
 * - Component storage (handled by ComponentRegistry)
 * - Entity lifecycle (handled by EntityManager)
 * - Game logic processing (higher-level systems)
 */
export class InventorySystem implements EntityProcessingSystem {
    readonly name = "InventorySystem";

    /**
     * Creates inventory system with required dependencies.
     * 
     * @param {ComponentRegistry} registry - Component storage system
     * @param {EntityManager} entityManager - Entity lifecycle manager
     */
    constructor(
        private registry: ComponentRegistry,
        private entityManager: EntityManager
    ) {}

    // ====================
    // SYSTEM LIFECYCLE
    // ====================

    /**
     * Initializes the inventory system.
     * Called during system setup.
     */
    initialize(): void {
        // Initialize any inventory-related setup
    }

    /**
     * Cleans up inventory system resources.
     * Called during system shutdown.
     */
    cleanup(): void {
        // Clean up inventory resources
    }

    /**
     * Gets entity filter for inventory processing.
     * 
     * @returns {EntityFilter} Filter for entities with inventory components
     */
    getEntityFilter(): EntityFilter {
        return EntityFilters.withComponents(new Map([
            ["inventory", this.registry.components.get("inventory")]
        ]));
    }

    /**
     * Processes inventory entity (currently unused).
     * 
     * @param {Entity} _entity - Entity being processed
     * @param {number} _deltaTime - Time since last frame
     */
    processEntity(_entity: Entity, _deltaTime: number): void {
        // Process inventory entities if needed (e.g., auto-sort, cleanup)
    }

    // ====================
    // INVENTORY CREATION & ACCESS
    // ====================

    /**
     * Creates a new inventory for an entity.
     * 
     * @param {Entity} owner - Entity that will own the inventory
     * @param {number} size - Number of slots in the inventory
     * 
     * @returns {Entity} Created inventory entity
     */
    createInventory(owner: Entity, size: number): Entity {
        const inventoryEntity = this.entityManager.createEntity();
        const slots: Entity[] = [];

        // Create slots
        for (let i = 0; i < size; i++) {
            const slotEntity = this.entityManager.createEntity();
            this.registry.addComponent("slot", slotEntity, {
                index: i,
                object: null,
                count: 0
            });
            this.registry.addComponent("hasOwner", slotEntity, {
                owner: inventoryEntity
            });
            slots.push(slotEntity);
        }

        // Create inventory component
        this.registry.addComponent("inventory", inventoryEntity, {
            slots
        });

        // Link inventory to owner
        this.registry.addComponent("isOwner", owner, {
            ownedEntity: inventoryEntity
        });

        return inventoryEntity;
    }

    /**
     * Gets inventory entity owned by an entity.
     * 
     * @param {Entity} owner - Entity that owns the inventory
     * 
     * @returns {Entity | null} Inventory entity or null if not found
     */
    getInventoryByOwner(owner: Entity): Entity | null {
        const isOwnerComponent = this.registry.getComponent("isOwner", owner);
        return isOwnerComponent ? isOwnerComponent.ownedEntity : null;
    }

    /**
     * Gets all slot entities in an inventory.
     * 
     * @param {Entity} inventory - Inventory entity
     * 
     * @returns {Entity[]} Array of slot entities
     */
    getInventorySlots(inventory: Entity): Entity[] {
        const inventoryComponent = this.registry.getComponent("inventory", inventory);
        return inventoryComponent ? inventoryComponent.slots : [];
    }

    // ====================
    // SLOT QUERY METHODS
    // ====================

    /**
     * Checks if a slot contains an object.
     * 
     * @param {Entity} slot - The slot entity to check
     * 
     * @returns {boolean} True if slot has an object, false otherwise
     */
    slotHasObject(slot: Entity): boolean {
        const slotComponent = this.registry.getComponent("slot", slot);
        return slotComponent ? slotComponent.object !== null : false;
    }

    /**
     * Gets the quantity of items in a slot.
     * 
     * @param {Entity} slot - The slot entity to check
     * 
     * @returns {number} Quantity of items in the slot
     */
    getSlotQuantity(slot: Entity): number {
        const slotComponent = this.registry.getComponent("slot", slot);
        return slotComponent ? slotComponent.count : 0;
    }

    /**
     * Gets the display name of the object in a slot.
     * 
     * @param {Entity} slot - The slot entity to check
     * 
     * @returns {string} The object's display name or "Empty"
     */
    getSlotObjectName(slot: Entity): string {
        const slotComponent = this.registry.getComponent("slot", slot);
        if (!slotComponent || !slotComponent.object) return "Empty";

        const itemDefinition = this.getEntityDefinition(slotComponent.object);
        return EntityManager.getEntityName(itemDefinition, this.registry);
    }

    /**
     * Gets the slot index.
     * 
     * @param {Entity} slotEntity - The slot entity
     * 
     * @returns {number | undefined} The slot index or undefined
     */
    getSlotIndex(slotEntity: Entity): number | undefined {
        const slotComponent = this.registry.getComponent("slot", slotEntity);
        return slotComponent?.index;
    }

    // ====================
    // ADD OPERATIONS
    // ====================

    /**
     * Adds an object to an inventory with automatic stacking and slot management.
     * 
     * @param {Entity} inventory - The inventory entity to add to
     * @param {Entity} object - The object entity to add
     * @param {number} count - Quantity to add
     * 
     * @returns {number} Remaining quantity (0 if all added, >0 if leftovers)
     */
    addObjectToInventory(inventory: Entity, object: Entity, count: number): number {
        const slots = this.getInventorySlots(inventory);
        
        // Try to stack with existing items first
        for (const slotEntity of slots) {
            if (this.canStackInSlot(slotEntity, object)) {
                const leftOver = this.addObjectToSlot(slotEntity, object, count);
                if (leftOver === 0) {
                    return 0;
                }
                count = leftOver;
            }
        }

        // Try to find empty slot
        for (const slotEntity of slots) {
            if (!this.slotHasObject(slotEntity)) {
                const leftOver = this.addObjectToSlot(slotEntity, object, count);
                if (leftOver === 0) {
                    return 0;
                }
                count = leftOver;
            }
        }

        return count; // Return remaining quantity
    }

    /**
     * Checks if an object can be stacked in a specific slot.
     * 
     * @param {Entity} slot - The slot entity to check
     * @param {Entity} object - The object entity to test for stacking
     * 
     * @returns {boolean} True if object can be stacked in the slot
     */
    private canStackInSlot(slot: Entity, object: Entity): boolean {
        if (!this.slotHasObject(slot)) return false;

        const slotComponent = this.registry.getComponent("slot", slot);
        if (!slotComponent || !slotComponent.object) return false;

        const slotItemDefinition = this.getEntityDefinition(slotComponent.object);
        const newItemDefinition = this.getEntityDefinition(object);

        // Check if same item type
        if (slotItemDefinition !== newItemDefinition) return false;

        // Check if item is stackable
        const stackable = this.registry.getComponent("stackable", newItemDefinition);
        if (!stackable) return false;

        // Check if stack has space
        return slotComponent.count < stackable.maxStack;
    }

    /**
     * Adds an object to a specific slot.
     * Handles both empty slots and stacking with existing items.
     * 
     * @param {Entity} slot - The slot entity to add to
     * @param {Entity} object - The object entity to add
     * @param {number} count - Quantity to add
     * 
     * @returns {number} Remaining quantity (0 if all added, >0 if leftovers)
     */
    public addObjectToSlot(slot: Entity, object: Entity, count: number): number {
        if (count <= 0) return count;

        const slotComponent = this.registry.getComponent("slot", slot);
        if (!slotComponent) return count;

        const itemDefinition = this.getEntityDefinition(object);

        if (!slotComponent.object) {
            // Empty slot - place object here
            slotComponent.object = itemDefinition;
            const stackable = this.registry.getComponent("stackable", itemDefinition);
            if (stackable) {
                slotComponent.count = Math.min(count, stackable.maxStack);
                return count - slotComponent.count;
            } else {
                slotComponent.count = 1;
                return count - 1;
            }
        } else {
            // Slot has object - check if same type and stackable
            const currentObjectDef = this.getEntityDefinition(slotComponent.object);
            const newObjectDef = itemDefinition;
            const stackable = this.registry.getComponent("stackable", slotComponent.object);

            if (currentObjectDef !== newObjectDef || !stackable) {
                return count; // Can't stack different items or non-stackable
            }

            const totalObjects = slotComponent.count + count;
            slotComponent.count = Math.min(totalObjects, stackable.maxStack);
            return totalObjects - slotComponent.count;
        }
    }

    // ====================
    // REMOVE OPERATIONS
    // ====================

    /**
     * Removes a specific quantity from a slot.
     * 
     * @param {Entity} slotEntity - The slot entity to modify
     * @param {number} quantity - Amount to remove (prevents negative removal)
     * @param {boolean} keepEntityRef - Whether to keep entity reference when quantity reaches 0
     */
    removeQuantityFromSlot(slotEntity: Entity, quantity: number = 1, keepEntityRef: boolean = false): void {
        if (quantity <= 0) return; // Prevent negative removal

        const slotComponent = this.registry.getComponent("slot", slotEntity);
        if (!slotComponent || !slotComponent.object) return; // Nothing to remove

        slotComponent.count -= quantity;

        if (slotComponent.count <= 0) {
            if (!keepEntityRef) {
                slotComponent.object = null;
            }
            slotComponent.count = 0;
        }
    }

    /**
     * Removes all quantity from a slot (equivalent to clearSlot but with logging).
     * 
     * @param {Entity} slotEntity - The slot entity to clear
     * @param {boolean} keepEntityRef - Whether to keep entity reference
     */
    removeObjectFromSlot(slotEntity: Entity, keepEntityRef: boolean = false): void {
        const slotComponent = this.registry.getComponent("slot", slotEntity);
        if (!slotComponent) return;
        
        this.removeQuantityFromSlot(slotEntity, slotComponent.count, keepEntityRef);
    }

    // ====================
    // ADVANCED OPERATIONS
    // ====================

    /**
     * Exchanges objects between two slots.
     * Handles same-inventory and cross-inventory exchanges.
     * 
     * @param {Entity} fromSlotEntity - Source slot
     * @param {Entity} toSlotEntity - Target slot
     */
    exchangeObjectInSlots(fromSlotEntity: Entity, toSlotEntity: Entity): void {
        const fromSlot = this.registry.getComponent("slot", fromSlotEntity);
        const toSlot = this.registry.getComponent("slot", toSlotEntity);

        // Validate slots
        if (!fromSlot || !toSlot || !fromSlot.object) return;

        const fromSlotOwner = this.registry.getComponent("hasOwner", fromSlotEntity);
        const toSlotOwner = this.registry.getComponent("hasOwner", toSlotEntity);
        
        if (!fromSlotOwner || !toSlotOwner) return;

        // Cross-inventory move
        if (fromSlotOwner.owner !== toSlotOwner.owner) {
            this.moveObjectFromSlotToInventory(fromSlotEntity, toSlotOwner.owner);
            return;
        }

        // Same inventory exchange
        if (!toSlot.object) {
            // Target slot is empty, move the object
            toSlot.object = fromSlot.object;
            toSlot.count = fromSlot.count;
            fromSlot.object = null;
            fromSlot.count = 0;
        } else {
            // Both slots have objects, try to add to target slot first
            const leftOver = this.addObjectToSlot(toSlotEntity, fromSlot.object, fromSlot.count);

            // If nothing was added (leftOver === fromSlot.count), exchange the two slots
            if (leftOver === fromSlot.count) {
                const tempObject = toSlot.object;
                const tempCount = toSlot.count;
                toSlot.object = fromSlot.object;
                toSlot.count = fromSlot.count;
                fromSlot.object = tempObject;
                fromSlot.count = tempCount;
            } else {
                // Some objects were added, remove them from source slot
                const amountAdded = fromSlot.count - leftOver;
                this.removeQuantityFromSlot(fromSlotEntity, amountAdded);
            }
        }
    }

    /**
     * Moves object from a slot to an inventory.
     * 
     * @param {Entity} slotEntity - Source slot
     * @param {Entity} inventoryEntity - Target inventory
     */
    moveObjectFromSlotToInventory(slotEntity: Entity, inventoryEntity: Entity): void {
        const slot = this.registry.getComponent("slot", slotEntity);
        const inventory = this.registry.getComponent("inventory", inventoryEntity);
        
        if (!slot || !inventory || !slot.object) return;

        const leftOver = this.addObjectToInventory(inventoryEntity, slot.object, slot.count);
        if (leftOver === slot.count) return; // Nothing was moved
        this.removeQuantityFromSlot(slotEntity, slot.count - leftOver);
    }

    // ====================
    // HELPER METHODS
    // ====================

    /**
     * Gets the definition entity for a given entity.
     * If the entity is an instance, returns its definition; otherwise returns the entity itself.
     * 
     * @param {Entity} entity - The entity to get the definition for
     * 
     * @returns {Entity} The definition entity
     */
    private getEntityDefinition(entity: Entity): Entity {
        const instance = this.registry.getComponent("instance", entity);
        if (instance) {
            return instance.definition;
        }
        return entity; // Assume it's already a definition
    }

    /**
     * Gets all child entities for a given entity.
     * Includes inventory and slots if the entity has an inventory.
     * 
     * @param {Entity} entity - The parent entity
     * 
     * @returns {Entity[]} Array of child entities
     */
    getChildEntities(entity: Entity): Entity[] {
        const childEntities: Entity[] = [];
        
        // Get inventory if entity has one
        const inventory = this.getInventoryByOwner(entity);
        if (inventory) {
            childEntities.push(inventory);
            childEntities.push(...this.getInventorySlots(inventory));
        }

        return childEntities;
    }
}
