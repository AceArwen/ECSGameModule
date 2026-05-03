/**
 * Game constants and object type definitions.
 * Contains all the core data definitions for the game world.
 */

/** Number of inventory slots for player characters */
export const PLAYER_INVENTORY_SIZE = 3;

/** Number of inventory slots for enemy characters */
export const ENEMY_INVENTORY_SIZE = 3;

/** Number of inventory slots for chest containers */
export const CHEST_INVENTORY_SIZE = 4;

/**
 * Enumeration of all object types in the game.
 * Used to identify different kinds of game objects.
 */
export enum ObjectId {
    /** Player and non-player characters */
    CHARACTER = 0,
    /** Chest containers for loot */
    CHEST = 1,
    /** Weapon items */
    SWORD = 2,
    /** Healing consumable items */
    BANDAGE = 3,
    /** Key items for unlocking */
    KEY = 4,
}

/** Probability that a chest slot will contain an item */
export const CHEST_SLOT_FILL_CHANCE = 0.6;

/** Probability that bandages will spawn in chests */
export const BANDAGE_SPAWN_CHANCE = 0.4;

/** Probability that swords will spawn in chests */
export const SWORD_SPAWN_CHANCE = 0.3;

/** Probability that keys will spawn in chests */
export const KEY_SPAWN_CHANCE = 0.3;

/** Minimum number of bandages when spawned */
export const BANDAGE_MIN_COUNT = 3;

/** Maximum number of bandages when spawned */
export const BANDAGE_MAX_COUNT = 8;

/**
 * Configuration for possible chest loot items.
 * Defines spawn chances and quantity ranges for each item type.
 */
export const POSSIBLE_CHEST_ITEMS = [
    { type: ObjectId.BANDAGE, chance: BANDAGE_SPAWN_CHANCE, minCount: BANDAGE_MIN_COUNT, maxCount: BANDAGE_MAX_COUNT },
    { type: ObjectId.SWORD, chance: SWORD_SPAWN_CHANCE, minCount: 1, maxCount: 1 },
    { type: ObjectId.KEY, chance: KEY_SPAWN_CHANCE, minCount: 1, maxCount: 1 }
] as const;
