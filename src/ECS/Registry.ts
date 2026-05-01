import type { ConsummableTagComponent, DescriptionComponent, HasOwnerComponent, InventoryComponent, IsOwnerComponent, ObjectDefinitionComponent, ObjectInstanceComponent, SlotComponent, StackableComponent, UsableTagComponent } from "./Components";
import type { Entity } from "./ObjectDefinitions";
import { ObjectId } from "./ObjectDefinitions";
import { InventoryManager } from "./RegistryHelper";

interface ReadonlyComponentStore<T> {
    get(entity: Entity): T | undefined;
    has(entity: Entity): boolean;
    entries(): IterableIterator<[Entity, T]>;
}

// Generic component storage
class ComponentStore<T> {
    private data = new Map<Entity, T>();

    add(entity: Entity, component: T) {
        this.data.set(entity, component);
    }

    get(entity: Entity): T | undefined {
        return this.data.get(entity);
    }

    remove(entity: Entity) {
        this.data.delete(entity);
    }

    has(entity: Entity): boolean {
        return this.data.has(entity);
    }

    entries() {
        return this.data.entries();
    }
    
    clear() {
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
};

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
        isOwner: this.isOwnerStore
    });

    public components = this.storeMap.readonlyView();

    // Helper for entity management operations
    inventoryHelper: InventoryManager;

    // Store for pre-created object definitions
    private objectDefinitions: Record<ObjectId, Entity> = {} as Record<ObjectId, Entity>;

    // Track which entities are object definitions
    private definitionEntities = new Set<Entity>();

    private currentEntity: number = 0;

    constructor() {
        this.inventoryHelper = new InventoryManager(this);
    }

    removeEntity(entity: Entity, visited: Set<Entity> = new Set()) {
        // Prevent infinite recursion with visited set
        if (visited.has(entity)) {
            return;
        }
        visited.add(entity);

        // Skip definition entities entirely
        if (this.definitionEntities.has(entity)) {
            return;
        }

        // First, remove all linked entities recursively
        const linkedEntities = this.inventoryHelper.getChildEntities(entity);
        for (const linkedEntity of linkedEntities) {
            this.removeEntity(linkedEntity, visited);
        }

        // Then remove the entity itself from all component stores
        for (const component of Object.values(this.storeMap) as ComponentStore<any>[]) {
            component.remove(entity);
        }
    }

    createEntity(): Entity {
        return ++this.currentEntity;
    }

    cleanRegistry() {
        this.currentEntity = 0;
        for (const component of Object.values(this.storeMap) as ComponentStore<any>[]) {
            component.clear();
        }
    }

    private assertCanModify(entity: Entity) {
        if (this.definitionEntities.has(entity)) {
            throw new Error("Cannot modify definition entity after creation");
        }
    }

    addComponent<K extends keyof ComponentMap>(
        key: K,
        entity: Entity,
        component: ComponentMap[K]
    ) {
        this.assertCanModify(entity);
        const store = this.storeMap.get(key);
        store.add(entity, component);
    }

    removeComponent<K extends keyof ComponentMap>(
        key: K,
        entity: Entity
    ) {
        this.assertCanModify(entity);
        const store = this.storeMap.get(key);
        store.remove(entity);
    }

    markAsDefinition(entity: Entity, objectType: ObjectId) {
        if (this.definitionEntities.has(entity)) {
            throw new Error("Entity is already a definition");
        }

        this.definitionStore.add(entity, {
            objectType
        });
        this.definitionEntities.add(entity);
    }

    getDefinitionEntity(objectType: ObjectId): Entity | undefined {
        return this.objectDefinitions[objectType];
    }

    createObjectInstance(objectType: ObjectId) {
        const definitionEntity = this.getDefinitionEntity(objectType);
        
        if (!definitionEntity) {
            throw new Error(`Object definition for ${objectType} not found. Make sure createObjectDefinition() was called.`);
        }

        const entityId = this.createEntity();
        this.instanceStore.add(entityId, {
            definition: definitionEntity
        });
        return entityId;
    }
}
