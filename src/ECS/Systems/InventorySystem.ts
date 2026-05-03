import { ComponentRegistry, EntityManager, EntityFilters } from "../Core";
import type { Entity, EntityProcessingSystem, EntityFilter } from "../Core";
import { ObjectId, PLAYER_INVENTORY_SIZE, CHEST_INVENTORY_SIZE, CHEST_SLOT_FILL_CHANCE, POSSIBLE_CHEST_ITEMS } from "../Data/ObjectDefinitions";
// These imports are used in the class methods

/**
 * Inventory management system.
 * Handles inventory creation, slot management, and item operations.
 * 
 * Responsibilities:
 * - Creating inventories and slots
 * - Managing item stacking and storage
 * - Providing inventory access methods
 * - Initializing player/chest inventories
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

    // Slot operations
    slotHasObject(slot: Entity): boolean {
        const slotComponent = this.registry.getComponent("slot", slot);
        return slotComponent ? slotComponent.object !== null : false;
    }

    getSlotQuantity(slot: Entity): number {
        const slotComponent = this.registry.getComponent("slot", slot);
        return slotComponent ? slotComponent.count : 0;
    }

    getSlotObjectName(slot: Entity): string {
        const slotComponent = this.registry.getComponent("slot", slot);
        if (!slotComponent || !slotComponent.object) return "Empty";

        const itemDefinition = this.getEntityDefinition(slotComponent.object);
        const description = this.registry.getComponent("description", itemDefinition);
        return description?.name || "Unknown Item";
    }

    // Object manipulation methods
    addObjectToInventory(inventory: Entity, object: Entity, count: number): boolean {
        const slots = this.getInventorySlots(inventory);
        
        // Try to stack with existing items first
        for (const slotEntity of slots) {
            if (this.canStackInSlot(slotEntity, object)) {
                return this.addToSlot(slotEntity, object, count);
            }
        }

        // Try to find empty slot
        for (const slotEntity of slots) {
            if (!this.slotHasObject(slotEntity)) {
                return this.addToSlot(slotEntity, object, count);
            }
        }

        return false; // No space available
    }

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

    private addToSlot(slot: Entity, object: Entity, count: number): boolean {
        const slotComponent = this.registry.getComponent("slot", slot);
        if (!slotComponent) return false;

        const itemDefinition = this.getEntityDefinition(object);
        const stackable = this.registry.getComponent("stackable", itemDefinition);

        if (stackable) {
            // Handle stackable items
            const maxAddable = stackable.maxStack - slotComponent.count;
            const actualAdd = Math.min(count, maxAddable);
            
            slotComponent.count += actualAdd;
            slotComponent.object = itemDefinition;
            
            return actualAdd === count; // Return false if not all items could be added
        } else {
            // Handle non-stackable items
            if (count === 1 && !this.slotHasObject(slot)) {
                slotComponent.object = itemDefinition;
                slotComponent.count = 1;
                return true;
            }
            return false;
        }
    }

    // Helper methods
    private getEntityDefinition(entity: Entity): Entity {
        const instance = this.registry.getComponent("instance", entity);
        if (instance) {
            return instance.definition;
        }
        return entity; // Assume it's already a definition
    }

    // Entity cleanup
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

    // Initialize player inventory with starting items
    initializePlayerInventory(player: Entity): void {
        const inventory = this.getInventoryByOwner(player);
        if (!inventory) return;

        // Create player inventory if it doesn't exist
        if (!inventory) {
            this.createInventory(player, PLAYER_INVENTORY_SIZE);
            return;
        }

        // Check if already initialized
        const slots = this.getInventorySlots(inventory);
        const existingItems = slots.filter(slot => this.slotHasObject(slot));
        if (existingItems.length > 0) return; // Already initialized

        // Add starting items (this would need access to ObjectManager for creating instances)
        // For now, this is a placeholder - the actual item creation should be handled elsewhere
    }

    // Initialize chest inventory with random loot
    initializeChestInventory(chest: Entity): void {
        const inventory = this.getInventoryByOwner(chest);
        if (!inventory) {
            this.createInventory(chest, CHEST_INVENTORY_SIZE);
            return;
        }

        const slots = this.getInventorySlots(inventory);
        const usedItemTypes = new Set<ObjectId>();

        // Generate items for each slot
        for (let i = 0; i < slots.length; i++) {
            if (Math.random() < CHEST_SLOT_FILL_CHANCE) {
                const availableItems = POSSIBLE_CHEST_ITEMS.filter(item => !usedItemTypes.has(item.type));
                
                if (availableItems.length === 0) break;

                const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                usedItemTypes.add(selectedItem.type);

                // This would need ObjectManager to create the actual items
                // For now, this is a placeholder
                // Calculate quantity for future use when item creation is implemented
                const _quantity = selectedItem.minCount + Math.floor(Math.random() * (selectedItem.maxCount - selectedItem.minCount + 1));
                // this.addObjectToInventory(inventory, itemEntity, quantity);
            }
        }
    }
}
