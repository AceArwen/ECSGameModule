import type { Entity } from "./Components";

/**
 * Manages entity lifecycle and tracks entity states in the ECS system.
 * Handles entity creation, destruction, and definition tracking.
 * 
 * Responsibilities:
 * - Generating unique entity IDs
 * - Tracking active entities
 * - Managing definition entities (templates)
 * - Enforcing definition immutability
 * 
 * Not responsible for:
 * - Component storage (handled by ComponentRegistry)
 * - Entity-component relationships
 * - Game logic processing
 */
export class EntityManager {
    private currentEntity: Entity = 0;
    private activeEntities = new Set<Entity>();
    private definitionEntities = new Set<Entity>();

    /**
     * Creates a new unique entity.
     * 
     * @returns {Entity} The newly created entity ID
     * 
     * @throws {Error} Never - entity creation always succeeds unless system is corrupted
     * 
     * @example
     * ```typescript
     * const entityManager = new EntityManager();
     * const entity = entityManager.createEntity(); // Returns 1
     * ```
     */
    createEntity(): Entity {
        const entity = ++this.currentEntity;
        this.activeEntities.add(entity);
        return entity;
    }

    /**
     * Destroys an entity and removes it from tracking.
     * 
     * @param {Entity} entity - The entity to destroy
     * 
     * @returns {void}
     * 
     * @throws {Error} Never - safe to call on non-existent entities
     * 
     * @note This does not remove components from the ComponentRegistry.
     *       Use ComponentRegistry.removeEntity() for full cleanup.
     * 
     * @example
     * ```typescript
     * entityManager.destroyEntity(entityId);
     * ```
     */
    destroyEntity(entity: Entity): void {
        this.activeEntities.delete(entity);
        this.definitionEntities.delete(entity);
    }

    /**
     * Checks if an entity is currently active.
     * 
     * @param {Entity} entity - The entity to check
     * 
     * @returns {boolean} True if entity is active, false otherwise
     * 
     * @example
     * ```typescript
     * if (entityManager.isEntityActive(entityId)) {
     *   // Entity exists and can be used
     * }
     * ```
     */
    isEntityActive(entity: Entity): boolean {
        return this.activeEntities.has(entity);
    }

    /**
     * Marks an entity as a definition (template).
     * Definition entities cannot be modified after being marked.
     * 
     * @param {Entity} entity - The entity to mark as definition
     * 
     * @returns {void}
     * 
     * @throws {Error} If entity is already a definition
     * @throws {Error} If entity does not exist
     * 
     * @note Definition entities serve as templates for instances.
     *       They should have all their components set before being marked.
     * 
     * @example
     * ```typescript
     * const swordDef = entityManager.createEntity();
     * // Add components...
     * entityManager.markAsDefinition(swordDef);
     * ```
     */
    markAsDefinition(entity: Entity): void {
        if (!this.activeEntities.has(entity)) {
            throw new Error("Entity does not exist");
        }
        if (this.definitionEntities.has(entity)) {
            throw new Error("Entity is already a definition");
        }
        this.definitionEntities.add(entity);
    }

    /**
     * Checks if an entity is a definition (template).
     * 
     * @param {Entity} entity - The entity to check
     * 
     * @returns {boolean} True if entity is a definition, false otherwise
     * 
     * @example
     * ```typescript
     * if (!entityManager.isDefinition(entityId)) {
     *   // Can modify this entity
     * }
     * ```
     */
    isDefinition(entity: Entity): boolean {
        return this.definitionEntities.has(entity);
    }

    /**
     * Checks if an entity can be modified.
     * 
     * @param {Entity} entity - The entity to check
     * 
     * @returns {boolean} True if entity can be modified, false if it's a definition
     * 
     * @example
     * ```typescript
     * if (entityManager.canModify(entityId)) {
     *   // Safe to add/remove components
     * }
     * ```
     */
    canModify(entity: Entity): boolean {
        return !this.definitionEntities.has(entity);
    }

    /**
     * Asserts that an entity can be modified. Throws error if not.
     * 
     * @param {Entity} entity - The entity to check
     * 
     * @returns {void}
     * 
     * @throws {Error} If entity is a definition and cannot be modified
     * 
     * @example
     * ```typescript
     * entityManager.assertCanModify(entityId); // Throws if not modifiable
     * registry.addComponent("position", entityId, {x: 0, y: 0});
     * ```
     */
    assertCanModify(entity: Entity): void {
        if (this.definitionEntities.has(entity)) {
            throw new Error("Cannot modify definition entity after creation");
        }
    }

    /**
     * Gets all currently active entities.
     * 
     * @returns {Entity[]} Array of all active entity IDs
     * 
     * @note Returns a new array each time to prevent external mutation.
     * 
     * @example
     * ```typescript
     * const allEntities = entityManager.getAllActiveEntities();
     * console.log(`Total entities: ${allEntities.length}`);
     * ```
     */
    getAllActiveEntities(): Entity[] {
        return Array.from(this.activeEntities);
    }

    /**
     * Resets the entity manager to initial state.
     * Clears all entities and resets the ID counter.
     * 
     * @returns {void}
     * 
     * @warning This does not clean up components in ComponentRegistry.
     *          Use ComponentRegistry.clear() for full system reset.
     * 
     * @example
     * ```typescript
     * // Full system reset
     * entityManager.reset();
     * componentRegistry.clear();
     * ```
     */
    reset(): void {
        this.currentEntity = 0;
        this.activeEntities.clear();
        this.definitionEntities.clear();
    }
}
