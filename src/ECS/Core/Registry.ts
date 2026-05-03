import type { ConsummableTagComponent, DescriptionComponent, HasOwnerComponent, HealthComponent, HealComponent, InventoryComponent, IsOwnerComponent, ObjectDefinitionComponent, ObjectInstanceComponent, SlotComponent, StackableComponent, UsableTagComponent, WeaponComponent, Entity } from "./Components";

interface ReadonlyComponentStore<T> {
    get(entity: Entity): T | undefined;
    has(entity: Entity): boolean;
    entries(): IterableIterator<[Entity, T]>;
}

// Generic component storage - the heart of the ECS
class ComponentStore<T> {
    private data = new Map<Entity, T>();

    add(entity: Entity, component: T): void {
        this.data.set(entity, component);
    }

    get(entity: Entity): T | undefined {
        return this.data.get(entity);
    }

    remove(entity: Entity): void {
        this.data.delete(entity);
    }

    has(entity: Entity): boolean {
        return this.data.has(entity);
    }

    entries(): IterableIterator<[Entity, T]> {
        return this.data.entries();
    }
    
    clear(): void {
        this.data.clear();
    }

    asReadonly(): ReadonlyComponentStore<T> {
        return {
            get: this.get.bind(this),
            has: this.has.bind(this),
            entries: this.entries.bind(this),
        };
    }
}

class StoreMap<M extends Record<string, any>> {
    constructor(
        private stores: {
            [K in keyof M]: ComponentStore<M[K]>
        }
    ) {}

    get<K extends keyof M>(key: K): ComponentStore<M[K]> {
        return this.stores[key];
    }

    readonlyView(): ReadonlyStoreMap<M> {
        return new ReadonlyStoreMap(this.stores);
    }
}

class ReadonlyStoreMap<M extends Record<string, any>> {
    constructor(
        private stores: {
            [K in keyof M]: ComponentStore<M[K]>
        }
    ) {}

    get<K extends keyof M>(key: K): ReadonlyComponentStore<M[K]> {
        const store = this.stores[key];

        return {
            get: store.get.bind(store),
            has: store.has.bind(store),
            entries: store.entries.bind(store),
        };
    }
}

// Component map type definition
type ComponentMap = {
    definition: ObjectDefinitionComponent;
    instance: ObjectInstanceComponent;
    description: DescriptionComponent;
    stackable: StackableComponent;
    usable: UsableTagComponent;
    consummable: ConsummableTagComponent;
    inventory: InventoryComponent;
    slot: SlotComponent;
    hasOwner: HasOwnerComponent;
    isOwner: IsOwnerComponent;
    weapon: WeaponComponent;
    heal: HealComponent;
    health: HealthComponent;
};

/**
 * Pure component registry - the heart of the ECS system.
 * Focuses solely on component storage and retrieval without entity management.
 * 
 * Responsibilities:
 * - Storing components by type and entity
 * - Providing type-safe component access
 * - Managing component lifecycle (add/remove/clear)
 * - Offering read-only component views
 * 
 * Not responsible for:
 * - Entity creation/destruction (handled by EntityManager)
 * - Game logic processing (handled by Systems)
 * - Entity validation (assumes valid entities are passed)
 * - Component business logic (components are data only)
 */
export class ComponentRegistry {
    private definitionStore = new ComponentStore<ObjectDefinitionComponent>();
    private instanceStore = new ComponentStore<ObjectInstanceComponent>();
    private descriptionStore = new ComponentStore<DescriptionComponent>();
    private stackableStore = new ComponentStore<StackableComponent>();
    private usableStore = new ComponentStore<UsableTagComponent>();
    private consummableStore = new ComponentStore<ConsummableTagComponent>();
    private inventoryStore = new ComponentStore<InventoryComponent>();
    private slotStore = new ComponentStore<SlotComponent>();
    private hasOwnerStore = new ComponentStore<HasOwnerComponent>();
    private isOwnerStore = new ComponentStore<IsOwnerComponent>();
    private weaponStore = new ComponentStore<WeaponComponent>();
    private healStore = new ComponentStore<HealComponent>();
    private healthStore = new ComponentStore<HealthComponent>();

    private storeMap = new StoreMap<ComponentMap>({
        definition: this.definitionStore,
        instance: this.instanceStore,
        description: this.descriptionStore,
        stackable: this.stackableStore,
        usable: this.usableStore,
        consummable: this.consummableStore,
        inventory: this.inventoryStore,
        slot: this.slotStore,
        hasOwner: this.hasOwnerStore,
        isOwner: this.isOwnerStore,
        weapon: this.weaponStore,
        heal: this.healStore,
        health: this.healthStore
    });

    /** Read-only view of all component stores for safe external access */
    public readonly components = this.storeMap.readonlyView();

    /**
     * Adds a component to an entity.
     * 
     * @template K - Type key of the component
     * @param {K} key - The component type identifier
     * @param {Entity} entity - The entity to add the component to
     * @param {ComponentMap[K]} component - The component data to add
     * 
     * @returns {void}
     * 
     * @throws {Error} Never - component addition always succeeds
     * 
     * @note This method does not check if the entity exists.
     *       Use EntityManager.isEntityActive() to validate entities.
     * 
     * @note This method does not check if entity is a definition.
     *       Use EntityManager.assertCanModify() before calling.
     * 
     * @example
     * ```typescript
     * registry.addComponent("position", entityId, { x: 10, y: 20 });
     * registry.addComponent("health", entityId, { current: 100, max: 100 });
     * ```
     */
    addComponent<K extends keyof ComponentMap>(
        key: K,
        entity: Entity,
        component: ComponentMap[K]
    ): void {
        const store = this.storeMap.get(key);
        store.add(entity, component);
    }

    /**
     * Removes a component from an entity.
     * 
     * @template K - Type key of the component
     * @param {K} key - The component type identifier
     * @param {Entity} entity - The entity to remove the component from
     * 
     * @returns {void}
     * 
     * @throws {Error} Never - safe to call on non-existent components
     * 
     * @note This method does not check if the entity is a definition.
     *       Use EntityManager.assertCanModify() before calling.
     * 
     * @example
     * ```typescript
     * registry.removeComponent("position", entityId);
     * ```
     */
    removeComponent<K extends keyof ComponentMap>(
        key: K,
        entity: Entity
    ): void {
        const store = this.storeMap.get(key);
        store.remove(entity);
    }

    /**
     * Checks if an entity has a specific component.
     * 
     * @template K - Type key of the component
     * @param {K} key - The component type identifier
     * @param {Entity} entity - The entity to check
     * 
     * @returns {boolean} True if entity has the component, false otherwise
     * 
     * @example
     * ```typescript
     * if (registry.hasComponent("position", entityId)) {
     *   const position = registry.getComponent("position", entityId);
     *   console.log(`Position: ${position.x}, ${position.y}`);
     * }
     * ```
     */
    hasComponent<K extends keyof ComponentMap>(
        key: K,
        entity: Entity
    ): boolean {
        const store = this.storeMap.get(key);
        return store.has(entity);
    }

    /**
     * Gets a component from an entity.
     * 
     * @template K - Type key of the component
     * @param {K} key - The component type identifier
     * @param {Entity} entity - The entity to get the component from
     * 
     * @returns {ComponentMap[K] | undefined} The component data, or undefined if not found
     * 
     * @example
     * ```typescript
     * const position = registry.getComponent("position", entityId);
     * if (position) {
     *   console.log(`Entity at ${position.x}, ${position.y}`);
     * }
     * ```
     */
    getComponent<K extends keyof ComponentMap>(
        key: K,
        entity: Entity
    ): ComponentMap[K] | undefined {
        const store = this.storeMap.get(key);
        return store.get(entity);
    }

    /**
     * Removes all components from an entity.
     * Useful for entity cleanup or destruction.
     * 
     * @param {Entity} entity - The entity to remove all components from
     * 
     * @returns {void}
     * 
     * @throws {Error} Never - safe to call on any entity
     * 
     * @note This is more efficient than removing each component individually.
     * 
     * @example
     * ```typescript
     * // Full entity cleanup
     * registry.removeEntity(entityId);
     * entityManager.destroyEntity(entityId);
     * ```
     */
    removeEntity(entity: Entity): void {
        for (const component of Object.values(this.storeMap) as ComponentStore<any>[]) {
            component.remove(entity);
        }
    }

    /**
     * Clears all components from all entities.
     * Useful for system reset or level changes.
     * 
     * @returns {void}
     * 
     * @warning This removes all data from the registry.
     *          Make sure to also reset EntityManager.
     * 
     * @example
     * ```typescript
     * // Full system reset
     * registry.clear();
     * entityManager.reset();
     * ```
     */
    clear(): void {
        for (const component of Object.values(this.storeMap) as ComponentStore<any>[]) {
            component.clear();
        }
    }

    /**
     * Gets all entities that have a specific component.
     * Useful for system queries and entity filtering.
     * 
     * @template K - Type key of the component
     * @param {K} key - The component type identifier
     * 
     * @returns {Entity[]} Array of entity IDs that have the component
     * 
     * @note Returns a new array each time to prevent external mutation.
     * 
     * @example
     * ```typescript
     * const movableEntities = registry.getEntitiesWithComponent("position");
     * console.log(`Found ${movableEntities.length} movable entities`);
     * ```
     */
    getEntitiesWithComponent<K extends keyof ComponentMap>(key: K): Entity[] {
        const store = this.storeMap.get(key);
        const entities: Entity[] = [];
        for (const [entity] of store.entries()) {
            entities.push(entity);
        }
        return entities;
    }
}
