import { EntityManager } from '../Core';
import { ObjectManager } from '../Data';
import { InventorySystem } from '../Systems';

/**
 * Interface for game console output.
 * Provides a way to send messages to the game's console display.
 */
export interface GameConsole {
    /**
     * Adds a message to the console.
     * 
     * @param {{text: string, isPlayer: boolean}} message - Message object with text and player flag
     */
    addMessage: (message: {text: string, isPlayer: boolean}) => void;
}

/**
 * Game initialization system.
 * Handles setting up the game world, creating initial entities, and managing game state.
 * 
 * Responsibilities:
 * - Initializing object definitions
 * - Creating player and world entities
 * - Providing game setup logging
 * 
 * Not responsible for:
 * - Component storage (handled by ComponentRegistry)
 * - Entity lifecycle (handled by EntityManager)
 * - Game loop processing (handled by game engine)
 */
export class GameInitializer {
    /**
     * Creates game initializer with required dependencies.
     * 
     * @param {EntityManager} _entityManager - Entity lifecycle manager (currently unused)
     * @param {ObjectManager} objectManager - Object creation and management system
     * @param {InventorySystem} inventorySystem - Inventory management system
     * @param {GameConsole} [console] - Optional game console for logging
     */
    constructor(
        private _entityManager: EntityManager, // Currently unused but kept for future extensibility
        private objectManager: ObjectManager,
        private inventorySystem: InventorySystem,
        private console?: GameConsole
    ) {}

    /**
     * Logs a message to the game console or browser console.
     * 
     * @param {string} message - Message to log
     */
    private log(message: string) {
        if (this.console) {
            this.console.addMessage({ text: message, isPlayer: false });
        } else {
            // Fallback to browser console if no game console provided
            console.log(message);
        }
    }

    /**
     * Initializes the game world.
     * Sets up object definitions, creates player and world entities with inventories.
     * 
     * @returns {{player: Entity, chest: Entity}} The created player and chest entities
     * 
     * @example
     * ```typescript
     * const gameInitializer = new GameInitializer(entityManager, objectManager, inventorySystem, gameConsole);
     * const {player, chest} = gameInitializer.initializeGame();
     * ```
     */
    initializeGame() {
        // Initialize all object definitions using the proper method
        this.objectManager.initializeObjectDefinitions();
        
        // Create player instance with inventory
        const player = this.objectManager.createPlayerInstanceWithInventory(this.inventorySystem);
        
        // Create chest instance with inventory
        const chest = this.objectManager.createChestInstanceWithInventory(this.inventorySystem);
        
        // Log to game console instead of browser console
        this.log('🎮 Game initialized!');
        this.log(`Player ID: ${player} with inventory created`);
        this.log(`Chest ID: ${chest} with inventory created`);
        this.log('Press "I" to open inventory');
        
        return { player, chest };
    }
}
