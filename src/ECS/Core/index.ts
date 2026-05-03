// Core ECS infrastructure exports
export type { Entity } from "./Components";
export { EntityManager } from "./Entity";
export { ComponentRegistry } from "./Registry";
export type { System, EntityProcessingSystem, EntityFilter } from "./System";
export { EntityFilters } from "./System";

// Component exports
export * from "./Components";
