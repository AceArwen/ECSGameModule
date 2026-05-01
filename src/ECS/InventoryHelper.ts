import { ComponentRegistry } from "./Registry";
import type { Entity } from "./Components";

export class InventoryManager {
    constructor(private registry: ComponentRegistry) { }

    getChildEntities(entity: Entity) {
        const entities: Entity[] = [];
        for (const [ownedEntity, hasOwner] of this.registry.components.get("hasOwner").entries()) {
            if (hasOwner.owner === entity) {
                entities.push(ownedEntity);
            }
        }
        return entities;
    }

    getParentEntity(entity: Entity) {
        const isOwner = this.registry.components.get("isOwner").get(entity);
        if (!isOwner) {
            return null;
        }
        return isOwner.ownedEntity;
    }

    createInventory(ownerEntity: Entity, size: number = 1) {
        if (this.registry.components.get("isOwner").has(ownerEntity)) {
            throw new Error("Entity already has an inventory");
        }
        if (size <= 1) {
            throw new Error("Inventory size must be greater or equal to 1");
        }
        const inventoryEntity = this.registry.createEntity();
        this.registry.addComponent("inventory", inventoryEntity, {
            slots: [],
        });
        this.registry.addComponent("hasOwner", inventoryEntity, {
            owner: ownerEntity
        });
        this.registry.addComponent("isOwner", ownerEntity, {
            ownedEntity: inventoryEntity
        });
        const inventory = this.registry.components.get("inventory").get(inventoryEntity)!;
        for (let i = 0; i < size; i++) {
            const slotEntity = this.registry.createEntity();
            this.registry.addComponent("slot", slotEntity, {
                index: i,
                object: null,
                count: 0,
            });
            this.registry.addComponent("hasOwner", slotEntity, {
                owner: inventoryEntity
            });
            inventory.slots.push(slotEntity);
        }
    }

    getInventoryByOwner(ownerEntity: Entity) {

        return this.registry.components.get("isOwner").get(ownerEntity)?.ownedEntity || undefined;
    }

    getInventorySlots(inventoryEntity: Entity) {
        return inventoryEntity ? this.registry.components.get("inventory").get(inventoryEntity)?.slots ?? [] : [];
    }

    slotHasObject(slotEntity: Entity) {
        const inventorySlot = this.registry.components.get("slot").get(slotEntity);
        return inventorySlot?.object !== null;
    }

    addObjectToInventory(inventoryEntity: Entity, objectEntity: Entity, count: number = 1) {
        if (count <= 0) return count;
        const inventory = this.registry.components.get("inventory").get(inventoryEntity);

        if (inventory) {
            for (let i = 0; i < inventory.slots.length; i++) {
                const slot = inventory.slots[i];
                if (slot) {
                    const leftOver = this.addObjectToSlot(slot, objectEntity, count);
                    if (leftOver === 0) {
                        return 0;
                    }
                    count = leftOver;
                }
            }
        }
        return count;
    }

    addObjectToSlot(slotEntity: Entity, objectEntity: Entity, count: number = 1) {
        if (count <= 0) return count;

        const inventorySlot = this.registry.components.get("slot").get(slotEntity);
        if (!inventorySlot) return count;

        if (!inventorySlot.object) {
            inventorySlot.object = objectEntity;
            if (this.registry.components.get("stackable").has(objectEntity)) {
                const stackable = this.registry.components.get("stackable").get(objectEntity)!;
                inventorySlot.count = Math.min(count, stackable.maxStack);
                return count - inventorySlot.count;
            }
            else {
                inventorySlot.count = 1;
                return count - 1;
            }
        }
        else {
            if (this.registry.components.get("instance").has(inventorySlot.object) || this.registry.components.get("instance").has(objectEntity)) {
                return count;
            }

            const currentObjectDef = this.registry.components.get("definition").get(inventorySlot.object)!;
            const newObjectDef = this.registry.components.get("definition").get(objectEntity)!;
            const stackable = this.registry.components.get("stackable").get(inventorySlot.object);

            if (currentObjectDef.objectType !== newObjectDef.objectType || !stackable) {
                return count;
            }

            const totalObjects = inventorySlot.count + count;
            inventorySlot.count = Math.min(totalObjects, stackable.maxStack);
            return totalObjects - inventorySlot.count;
        }
    }

    removeQuantityFromSlot(slotEntity: Entity, quantity: number = 1, keepEntityRef: boolean = false) {
        if (quantity <= 0) return; // prevent negative removal

        const inventorySlot = this.registry.components.get("slot").get(slotEntity);
        if (!inventorySlot || !inventorySlot.object) return; // nothing to remove

        // Might be interesting to think about handling case where quantity > count
        inventorySlot.count -= quantity;

        if (inventorySlot.count <= 0) {
            if (!keepEntityRef) {
                inventorySlot.object = null;
            }
            inventorySlot.count = 0;
            console.log(`Slot ${slotEntity} is now empty`);
        }
    }

    // Some inventory could be fixed inventory (ex: equipment slots), that should only accept one type of object after being set
    // For these slots, the reference should be kept even if the slot is empty
    removeObjectFromSlot(slotEntity: Entity, keepEntityRef: boolean = false) {
        const slot = this.registry.components.get("slot").get(slotEntity);
        if (!slot) return;
        console.log(`Removing object from slot ${slotEntity}`);
        this.removeQuantityFromSlot(slotEntity, slot.count, keepEntityRef);
    }

    removeRefFromSlot(slotEntity: Entity) {
        this.removeObjectFromSlot(slotEntity, false);
    }

    exchangeObjectInSlots(fromSlotEntity: Entity, toSlotEntity: Entity) {
        const fromSlot = this.registry.components.get("slot").get(fromSlotEntity);
        const toSlot = this.registry.components.get("slot").get(toSlotEntity);

        // If one of the slots is not defined or the slot we take from has nothing, return
        if (!fromSlot || !toSlot || !fromSlot.object) return;

        const fromSlotOwner = this.registry.components.get("hasOwner").get(fromSlotEntity)!;
        const toSlotOwner = this.registry.components.get("hasOwner").get(toSlotEntity)!;
        if (fromSlotOwner.owner !== toSlotOwner.owner) {
            this.moveObjectFromSlotToInventory(fromSlotEntity, toSlotOwner.owner);
            return;
        }

        // They are from the same inventory
        if (!toSlot.object) {
            // Target slot is empty, move the object
            toSlot.object = fromSlot.object;
            toSlot.count = fromSlot.count;
            fromSlot.object = null;
            fromSlot.count = 0;
        }
        else {
            // Both slots have objects, try to add to target slot first
            const leftOver = this.addObjectToSlot(toSlotEntity, fromSlot.object, fromSlot.count);

            // If nothing was added (leftOver === fromSlot.count), swap the two slots
            if (leftOver === fromSlot.count) {
                const tempObject = toSlot.object;
                const tempCount = toSlot.count;
                toSlot.object = fromSlot.object;
                toSlot.count = fromSlot.count;
                fromSlot.object = tempObject;
                fromSlot.count = tempCount;
            }
            else {
                // Some objects were added, remove them from source slot
                const amountRemoved = fromSlot.count - leftOver;
                this.removeQuantityFromSlot(fromSlotEntity, amountRemoved);
            }
        }
    }

    moveObjectFromSlotToInventory(slotEntity: Entity, inventoryEntity: Entity) {
        const slot = this.registry.components.get("slot").get(slotEntity);
        const inventory = this.registry.components.get("inventory").get(inventoryEntity);
        if (slot && inventory) {
            const leftOver = this.addObjectToInventory(inventoryEntity, slot.object!, slot.count);
            if (leftOver === slot.count) return;
            this.removeQuantityFromSlot(slotEntity, slot.count - leftOver);
        }
    }

    getSlotIndex(slotEntity: Entity) {
        const slot = this.registry.components.get("slot").get(slotEntity);
        return slot?.index;
    }

    getSlotObjectName(slotEntity: Entity): string {
        const slot = this.registry.components.get("slot").get(slotEntity);
        if (!slot || !slot.object) return "";

        let objectEntity: Entity;
        if (this.registry.components.get("instance").has(slot.object)) {
            objectEntity = this.registry.components.get("instance").get(slot.object)!.definition;
        } else {
            objectEntity = slot.object;
        }

        // Check if the object instance has a description component first
        if (this.registry.components.get("description").has(slot.object)) {
            return this.registry.components.get("description").get(slot.object)!.name;
        }

        // Fall back to description component on the definition
        return this.registry.components.get("description").get(objectEntity)?.name || "";
    }

    getSlotQuantity(slotEntity: Entity): number {
        const slot = this.registry.components.get("slot").get(slotEntity);
        if (!slot || !slot.object) return 0;
        return slot.count;
    }
}