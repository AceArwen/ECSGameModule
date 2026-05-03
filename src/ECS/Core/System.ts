import type { Entity } from "./Components";

// Base system interface for all game systems
export interface System {
    // System name for identification
    readonly name: string;
    
    // Initialize the system with required dependencies
    initialize(): void;
    
    // Update the system (called each game loop if needed)
    update?(deltaTime: number): void;
    
    // Clean up system resources
    cleanup(): void;
}

// Base interface for systems that need to process entities
export interface EntityProcessingSystem extends System {
    // Process a specific entity
    processEntity(entity: Entity, deltaTime: number): void;
    
    // Get the filter for entities this system should process
    getEntityFilter(): EntityFilter;
}

// Entity filter for determining which entities a system should process
export interface EntityFilter {
    // Check if an entity matches the filter criteria
    matches(entity: Entity): boolean;
}

// Utility class for creating common entity filters
export class EntityFilters {
    // Filter for entities that have all specified components
    static withComponents(
        componentStores: Map<string, { has(entity: Entity): boolean }>
    ): EntityFilter {
        return {
            matches: (entity: Entity) => {
                for (const [, store] of componentStores) {
                    if (!store.has(entity)) {
                        return false;
                    }
                }
                return true;
            }
        };
    }

    // Filter for entities that have any of the specified components
    static withAnyComponent(
        componentStores: Map<string, { has(entity: Entity): boolean }>
    ): EntityFilter {
        return {
            matches: (entity: Entity) => {
                for (const [, store] of componentStores) {
                    if (store.has(entity)) {
                        return true;
                    }
                }
                return false;
            }
        };
    }

    // Filter for entities that are not definitions
    static notDefinitions(entityManager: { isDefinition(entity: Entity): boolean }): EntityFilter {
        return {
            matches: (entity: Entity) => !entityManager.isDefinition(entity)
        };
    }
}
