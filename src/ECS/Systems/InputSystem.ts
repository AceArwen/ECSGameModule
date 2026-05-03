import { ComponentRegistry } from '../Core';
import type { Entity } from '../Core';
import type { CommandDescriptor } from '../Commands';
import { ObjectManager } from '../Data';
import type { InventorySystem } from './InventorySystem';

/**
 * Input processing system for console commands.
 * Handles text-based player input and converts it to game commands.
 * 
 * Responsibilities:
 * - Processing console text commands
 * - Converting commands to command descriptors
 * - Managing inventory selection state
 * - Providing help and status information
 * 
 * Not responsible for:
 * - Command execution (handled by CommandFactory)
 * - Component storage (handled by ComponentRegistry)
 * - Game logic processing (higher-level systems)
 */
export class InputSystem {
    private selectedInventory: Entity | null = null;

    /**
     * Creates input system with required dependencies.
     * 
     * @param {ComponentRegistry} registry - Component storage system
     * @param {ObjectManager} objectManager - Object creation and management
     * @param {InventorySystem} inventorySystem - Inventory management system
     * @param {Entity} player - Player entity ID
     */
    constructor(
        private registry: ComponentRegistry, 
        private objectManager: ObjectManager,
        private inventorySystem: InventorySystem,
        private player: number
    ) {
        // No more keyboard listeners - using console commands instead
    }

    /**
     * Processes text commands from the console.
     * Converts player input into command descriptors for execution.
     * 
     * @param {string} command - The raw text command from player
     * 
     * @returns {CommandDescriptor[]} Array of command descriptors to execute
     * 
     * @example
     * ```typescript
     * const commands = inputSystem.processCommand("inventory");
     * // Returns: [{ type: 'addMessage', message: '🎒 INVENTORY:...' }]
     * ```
     */
    processCommand(command: string): CommandDescriptor[] {
        const trimmedCommand = command.toLowerCase().trim();
        
        // Define command patterns with regex
        const patterns = [
            { regex: /^(?:i|inventory)$/, handler: () => this.displayInventoryCommand() },
            { regex: /^i\s+([1-9])$/, handler: (_, match) => this.handleInventorySlotWithPrefix(match[1]) },
            { regex: /^(?:c|clear)$/, handler: () => [{ type: 'clearConsole' as const }] },
            { regex: /^(?:help|h)$/, handler: () => [{ type: 'addMessage' as const, message: this.getHelpText() }] },
            { regex: /^(?:status|s)$/, handler: () => [{ type: 'addMessage' as const, message: this.getStatusText() }] }
        ];
        
        // Test patterns in order
        for (const pattern of patterns) {
            const match = trimmedCommand.match(pattern.regex);
            if (match) {
                return pattern.handler(trimmedCommand, match);
            }
        }
        
        return [{ type: 'addMessage', message: `Unknown command: "${command}". Type "h/help" for available commands.` }];
    }

    /**
     * Handles inventory display command ("inventory" or "i").
     * Selects player inventory and returns command to display it.
     * 
     * @returns {CommandDescriptor[]} Command descriptor for displaying inventory
     */
    private displayInventoryCommand(): CommandDescriptor[] {
        // Always select player inventory when displaying
        this.selectedInventory = this.inventorySystem.getInventoryByOwner(this.player);
        return [{ type: 'addMessage' as const, message: this.displayInventory() }];
    }

    /**
     * Handles inventory slot commands with prefix (e.g., "i 3").
     * Parses slot number and delegates to selectInventorySlot.
     * 
     * @param {string} slotNumber - Slot number as string (1-based)
     * 
     * @returns {CommandDescriptor[]} Command descriptors for slot selection
     */
    private handleInventorySlotWithPrefix(slotNumber: string): CommandDescriptor[] {
        const slotIndex = parseInt(slotNumber) - 1;
        return this.selectInventorySlot(slotIndex);
    }


    /**
     * Selects a specific inventory for display.
     * Used for switching between different inventories (e.g., player vs chest).
     * 
     * @param {Entity} inventoryEntity - Inventory entity to select
     * 
     * @returns {CommandDescriptor[]} Command descriptor for displaying selected inventory
     * 
     * @example
     * ```typescript
     * const commands = inputSystem.selectInventory(chestInventory);
     * // Returns: [{ type: 'addMessage', message: '🎒 CHEST INVENTORY:...' }]
     * ```
     */
    public selectInventory(inventoryEntity: Entity): CommandDescriptor[] {
        this.selectedInventory = inventoryEntity;
        return [{ type: 'addMessage' as const, message: this.displayInventory() }];
    }

    
    private displayInventory(): string {
        if (!this.selectedInventory) {
            return '❌ No inventory selected';
        }

        const slots = this.inventorySystem.getInventorySlots(this.selectedInventory);
        
        // Handle empty inventory
        if (slots.length === 0) {
            const message = '❌ The inventory with ID ' + this.selectedInventory + ' does not contain any slots';
            this.selectedInventory = null;
            return message;
        }

        let output = '\n🎒 INVENTORY:\n==================\n';
        
        slots.forEach((slotEntity, index) => {
            const slot = this.registry.components.get('slot').get(slotEntity);
            if (!slot || !slot.object) {
                output += `${index + 1}. [Empty]\n`;
                return;
            }

            // Get the definition entity for proper description and component access
            const itemDefinition = this.objectManager.getEntityDefinition(slot.object);
            const description = this.registry.components.get('description').get(itemDefinition);
            const stackable = this.registry.components.get('stackable').get(itemDefinition);
            
            const itemName = description?.name || 'Unknown Item';
            const count = slot.count > 1 ? ` x${slot.count}` : '';
            const stackInfo = stackable ? ` (Max: ${stackable.maxStack})` : '';
            
            output += `${index + 1}. ${itemName}${count}${stackInfo}\n`;
        });
        
        output += `\nType "i 1"-"i ${slots.length}" to select items\n==================\n`;
        return output;
    }

    /**
     * Handles inventory slot selection commands (e.g., "i 3").
     * Selects a specific slot and displays item information.
     * 
     * @param {number} slotIndex - Zero-based slot index (0 for slot 1)
     * 
     * @returns {CommandDescriptor[]} Command descriptors for displaying selection result
     * 
     * @example
     * ```typescript
     * const result = inputSystem.selectInventorySlot(2);
     * // Returns: [{ type: 'addMessage', message: '🎯 Selected: Sword x1 (Slot 3)' }]
     * ```
     */
    private selectInventorySlot(slotIndex: number): CommandDescriptor[] {
        // Always use player inventory when selecting slots
        this.selectedInventory = this.inventorySystem.getInventoryByOwner(this.player);
        
        const slots = this.inventorySystem.getInventorySlots(this.selectedInventory);
        if (slotIndex >= slots.length) {
            return [{ type: 'addMessage' as const, message: `❌ Slot ${slotIndex + 1} does not exist (Inventory has ${slots.length} slots)` }];
        }

        const slotEntity = slots[slotIndex];
        const hasObject = this.inventorySystem.slotHasObject(slotEntity);
        
        if (!hasObject) {
            return [{ type: 'addMessage' as const, message: `❌ Slot ${slotIndex + 1} is empty` }];
        }

        const itemName = this.inventorySystem.getSlotObjectName(slotEntity);
        const quantity = this.inventorySystem.getSlotQuantity(slotEntity);
        
        return [{ type: 'addMessage' as const, message: `🎯 Selected: ${itemName} x${quantity} (Slot ${slotIndex + 1})` }];
    }

    /**
     * Gets help text for available commands.
     * 
     * @returns {string} Formatted help text with all available commands
     */
    private getHelpText(): string {
        return `📖 Available Commands:
• inventory/i - Display inventory content
• i [1-9] - Select inventory slot (e.g., "i 3")
• clear/c - Clear console messages
• status/s - Show player status
• help/h - Show this help message`;
    }

    /**
     * Gets player status information.
     * 
     * @returns {string} Formatted status text with player information
     */
    private getStatusText(): string {
        const description = this.registry.components.get('description').get(this.player);
        const playerName = description?.name || 'Unknown Player';
        return `👤 Player: ${playerName} (ID: ${this.player})`;
    }

}
