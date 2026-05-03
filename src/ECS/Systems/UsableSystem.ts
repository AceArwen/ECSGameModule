import { ComponentRegistry, EntityManager, EntityFilters } from "../Core";
import type { Entity, EntityProcessingSystem, EntityFilter } from "../Core";
import type { InventorySystem } from "./InventorySystem";
import type { HealthComponent } from "../Core/Components";

/**
 * Base effect interface for all item effects.
 * Defines the common structure for effect descriptors.
 */
interface Effect {
    type: string;
}

/**
 * Healing effect descriptor.
 * Contains the amount of health to restore.
 */
interface HealEffect extends Effect {
    type: 'heal';
    amount: number;
}

/**
 * Quantity reduction effect descriptor.
 * Contains the amount to reduce from item stack.
 */
interface QuantityEffect extends Effect {
    type: 'quantity';
    reduction: number;
}

/**
 * Usable system for handling item usage.
 * Manages the usage of entities with the UsableTagComponent.
 * 
 * Responsibilities:
 * - Using entities with usable tag
 * - Applying item effects (healing, quantity reduction)
 * - Managing health modifications
 * - Validating usage conditions
 * 
 * Not responsible for:
 * - Component storage (handled by ComponentRegistry)
 * - Entity lifecycle (handled by EntityManager)
 * - Inventory management (handled by InventorySystem)
 */
export class UsableSystem implements EntityProcessingSystem {
    readonly name = "UsableSystem";

    constructor(
        private registry: ComponentRegistry,
        private inventorySystem: InventorySystem
    ) {}

    // ====================
    // SYSTEM LIFECYCLE
    // ====================

    initialize(): void {
        // Initialize usable system
    }

    cleanup(): void {
        // Clean up usable system
    }

    getEntityFilter(): EntityFilter {
        return EntityFilters.withComponents(new Map([
            ["usable", this.registry.components.get("usable")]
        ]));
    }

    processEntity(_entity: Entity, _deltaTime: number): void {
        // Process usable entities if needed
    }

    // ====================
    // MAIN USAGE API
    // ====================

    /**
     * Uses an item entity and applies its effects.
     * Main entry point for item usage.
     * 
     * @param {Entity} userEntity - The entity using the item
     * @param {Entity} itemEntity - The item entity to use
     * @param {Entity} slotEntity - The slot containing the item
     * 
     * @returns {string} Result message describing the usage outcome
     */
    useEntity(userEntity: Entity, itemEntity: Entity, slotEntity: Entity): string {
        // Check if item is usable
        const usableTag = this.registry.components.get('usable').get(itemEntity);
        if (!usableTag) {
            return "❌ This item cannot be used";
        }

        // Collect all effects from the item
        const effects = this.collectEffects(itemEntity);
        
        // Apply all effects and collect results
        const resultMessages = this.applyEffects(effects, userEntity, itemEntity, slotEntity);

        return `✅ Used ${EntityManager.getEntityName(itemEntity, this.registry)}. ${resultMessages.join(". ")}`;
    }

    // ====================
    // EFFECT COLLECTION
    // ====================

    /**
     * Collects all effects from an item entity.
     * Scans the item for effect components and returns effect descriptors.
     * 
     * @param {Entity} itemEntity - The item entity to scan for effects
     * 
     * @returns {Effect[]} Array of effect descriptors
     */
    private collectEffects(itemEntity: Entity): Effect[] {
        const effects: Effect[] = [];
        
        // Check for healing effect
        const healComponent = this.registry.components.get('heal').get(itemEntity);
        if (healComponent) {
            effects.push({
                type: 'heal',
                amount: healComponent.amount
            } as HealEffect);
        }

        // Check if item is consummable (gets reduced when used)
        const consummable = this.registry.components.get('consummable').get(itemEntity);
        if (consummable) {
            effects.push({
                type: 'quantity',
                reduction: 1 // Fixed quantity for now, could be configurable later
            } as QuantityEffect);
        }

        return effects;
    }

    // ====================
    // EFFECT APPLICATION
    // ====================

    /**
     * Applies a collection of effects to targets.
     * Orchestrates effect application in sequence.
     * 
     * @param {Effect[]} effects - Array of effects to apply
     * @param {Entity} userEntity - The entity using the item
     * @param {Entity} itemEntity - The item being used
     * @param {Entity} slotEntity - The slot containing the item
     * 
     * @returns {string[]} Array of result messages from each effect
     */
    private applyEffects(effects: Effect[], userEntity: Entity, itemEntity: Entity, slotEntity: Entity): string[] {
        const resultMessages: string[] = [];

        for (const effect of effects) {
            const result = this.applyEffect(effect, userEntity, itemEntity, slotEntity);
            if (result) {
                resultMessages.push(result);
            }
        }

        return resultMessages;
    }

    /**
     * Applies a single effect to appropriate targets.
     * Routes effect to specific effect handlers.
     * 
     * @param {Effect} effect - The effect to apply
     * @param {Entity} userEntity - The entity using the item
     * @param {Entity} itemEntity - The item being used
     * @param {Entity} slotEntity - The slot containing the item
     * 
     * @returns {string} Result message from the effect application
     */
    private applyEffect(effect: Effect, userEntity: Entity, itemEntity: Entity, slotEntity: Entity): string {
        switch (effect.type) {
            case 'heal':
                return this.applyHealEffect(effect as HealEffect, userEntity);
            case 'quantity':
                return this.applyQuantityEffect(effect as QuantityEffect, slotEntity);
            default:
                return `Unknown effect type: ${(effect as any).type}`;
        }
    }

    /**
     * Applies a healing effect to the target entity.
     * 
     * @param {HealEffect} effect - The healing effect to apply
     * @param {Entity} targetEntity - The entity to heal
     * 
     * @returns {string} Result message describing the healing
     */
    private applyHealEffect(effect: HealEffect, targetEntity: Entity): string {
        const health = this.registry.components.get('health').get(targetEntity);
        if (!health) {
            return "Target has no health component";
        }

        const oldHealth = health.health;
        const newHealth = Math.min(health.health + effect.amount, health.maxHealth);
        const actualHeal = newHealth - oldHealth;

        if (actualHeal === 0) {
            return "Already at full health";
        }

        health.health = newHealth;
        return `Health restored by ${actualHeal} (${health.health}/${health.maxHealth})`;
    }

    /**
     * Applies a quantity reduction effect to the slot.
     * 
     * @param {QuantityEffect} effect - The quantity effect to apply
     * @param {Entity} slotEntity - The slot entity containing the item
     * 
     * @returns {string} Result message describing the quantity change
     */
    private applyQuantityEffect(effect: QuantityEffect, slotEntity: Entity): string {
        const slot = this.registry.components.get('slot').get(slotEntity);
        if (!slot) {
            return "Invalid slot";
        }

        this.inventorySystem.removeQuantityFromSlot(slotEntity, effect.reduction);
        
        const newQuantity = this.inventorySystem.getSlotQuantity(slotEntity);
        
        if (newQuantity === 0) {
            return "Quantity depleted";
        }

        return `Quantity: ${newQuantity}`;
    }
}
