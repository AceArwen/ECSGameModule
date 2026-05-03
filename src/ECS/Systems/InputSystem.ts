import { ComponentRegistry } from '../Core';
import type { Entity } from '../Core';
import type { CommandDescriptor } from '../Commands';
import { ObjectManager } from '../Data';
import type { InventorySystem } from './InventorySystem';
import type { UsableSystem } from './UsableSystem';

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

    constructor(
        private registry: ComponentRegistry, 
        private objectManager: ObjectManager,
        private inventorySystem: InventorySystem,
        private usableSystem: UsableSystem,
        private player: number
    ) {
        // No more keyboard listeners - using console commands instead
    }

    // ====================
    // MAIN COMMAND PROCESSING
    // ====================

    /**
     * Processes text commands from the console.
     * Converts player input into command descriptors for execution.
     * 
     * @param {string} command - The raw text command from player
     * 
     * @returns {CommandDescriptor[]} Array of command descriptors to execute
     */
    processCommand(command: string): CommandDescriptor[] {
        const trimmedCommand = command.toLowerCase().trim();
        
        // Define command patterns with regex
        const patterns = [
            { regex: /^(?:i|inventory)$/, handler: () => this.displayInventoryCommand() },
            { regex: /^i\s+([1-9])$/, handler: (_, match) => this.handleInventorySlotWithPrefix(match[1]) },
            { regex: /^i\s+([1-9])\s+(?:u|use)$/, handler: (_, match) => this.handleItemUsage(match[1]) },
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

    // ====================
    // INVENTORY COMMANDS
    // ====================

    /**
     * Handles inventory display command.
     * Shows the selected inventory or default to player inventory.
     * 
     * @returns {CommandDescriptor[]} Command descriptors for inventory display
     */
    private displayInventoryCommand(): CommandDescriptor[] {
        const inventory = this.selectedInventory || this.inventorySystem.getInventoryByOwner(this.player);
        if (!inventory) {
            return [{ type: 'addMessage', message: 'No inventory available' }];
        }

        const slots = this.inventorySystem.getInventorySlots(inventory);
        const inventoryLines = slots.map((slot, index) => {
            const slotNumber = index + 1;
            const hasObject = this.inventorySystem.slotHasObject(slot);
            const quantity = this.inventorySystem.getSlotQuantity(slot);
            const objectName = this.inventorySystem.getSlotObjectName(slot);
            
            return `${slotNumber}. ${hasObject ? `${objectName} (${quantity})` : 'Empty'}`;
        });

        const inventoryOwner = this.selectedInventory ? 'Selected' : 'Player';
        return [{ type: 'addMessage', message: `${inventoryOwner} Inventory:\n${inventoryLines.join('\n')}` }];
    }

    /**
     * Handles inventory slot selection with prefix.
     * Selects or deselects inventory slots.
     * 
     * @param {string} slotNumber - The slot number as string
     * 
     * @returns {CommandDescriptor[]} Command descriptors for slot selection
     */
    private handleInventorySlotWithPrefix(slotNumber: string): CommandDescriptor[] {
        const slotIndex = parseInt(slotNumber) - 1;
        return this.selectInventorySlot(slotIndex);
    }

    /**
     * Handles item usage commands.
     * Uses items from selected inventory slots.
     * 
     * @param {string} slotNumber - The slot number as string
     * 
     * @returns {CommandDescriptor[]} Command descriptors for item usage
     */
    private handleItemUsage(slotNumber: string): CommandDescriptor[] {
        const slotIndex = parseInt(slotNumber) - 1;
        const inventory = this.selectedInventory || this.inventorySystem.getInventoryByOwner(this.player);
        
        if (!inventory) {
            return [{ type: 'addMessage', message: 'No inventory available' }];
        }

        const slots = this.inventorySystem.getInventorySlots(inventory);
        if (slotIndex < 0 || slotIndex >= slots.length) {
            return [{ type: 'addMessage', message: `Invalid slot number: ${slotNumber + 1}` }];
        }

        const slot = slots[slotIndex];
        if (!this.inventorySystem.slotHasObject(slot)) {
            return [{ type: 'addMessage', message: `Slot ${slotNumber + 1} is empty` }];
        }

        const slotComponent = this.registry.getComponent("slot", slot);
        if (!slotComponent || !slotComponent.object) {
            return [{ type: 'addMessage', message: `Slot ${slotNumber + 1} has no valid item` }];
        }

        // Use the item
        const result = this.usableSystem.useEntity(this.player, slotComponent.object, slot);
        return [{ type: 'addMessage', message: result }];
    }

    /**
     * Selects an inventory slot for further operations.
     * 
     * @param {number} slotIndex - The zero-based slot index
     * 
     * @returns {CommandDescriptor[]} Command descriptors for slot selection
     */
    private selectInventorySlot(slotIndex: number): CommandDescriptor[] {
        const inventory = this.selectedInventory || this.inventorySystem.getInventoryByOwner(this.player);
        
        if (!inventory) {
            return [{ type: 'addMessage', message: 'No inventory available' }];
        }

        const slots = this.inventorySystem.getInventorySlots(inventory);
        if (slotIndex < 0 || slotIndex >= slots.length) {
            return [{ type: 'addMessage', message: `Invalid slot number: ${slotIndex + 1}` }];
        }

        const slot = slots[slotIndex];
        const hasObject = this.inventorySystem.slotHasObject(slot);
        const quantity = this.inventorySystem.getSlotQuantity(slot);
        const objectName = this.inventorySystem.getSlotObjectName(slot);
        
        const slotInfo = hasObject ? `${objectName} (${quantity})` : 'Empty';
        return [{ type: 'addMessage', message: `Selected slot ${slotIndex + 1}: ${slotInfo}` }];
    }

    // ====================
    // HELP & STATUS COMMANDS
    // ====================

    /**
     * Gets help text for available commands.
     * 
     * @returns {string} Formatted help text
     */
    private getHelpText(): string {
        return `Available commands:
  i/inventory - Show inventory
  i [number] - Select/show inventory slot
  i [number] u/use - Use item from slot
  c/clear - Clear console
  h/help - Show this help
  s/status - Show player status`;
    }

    /**
     * Gets player status information.
     * 
     * @returns {string} Formatted status text
     */
    private getStatusText(): string {
        const health = this.registry.getComponent("health", this.player);
        const healthText = health ? `Health: ${health.health}/${health.maxHealth}` : 'Health: N/A';
        
        const inventory = this.inventorySystem.getInventoryByOwner(this.player);
        const slots = inventory ? this.inventorySystem.getInventorySlots(inventory) : [];
        const itemCount = slots.filter(slot => this.inventorySystem.slotHasObject(slot)).length;
        
        return `Player Status:
  ${healthText}
  Inventory: ${itemCount}/${slots.length} slots used`;
    }

    // ====================
    // INVENTORY MANAGEMENT
    // ====================

    /**
     * Sets the currently selected inventory.
     * Used for targeting specific inventories (e.g., chests).
     * 
     * @param {Entity} inventory - The inventory entity to select
     */
    setSelectedInventory(inventory: Entity): void {
        this.selectedInventory = inventory;
    }

    /**
     * Gets the currently selected inventory.
     * 
     * @returns {Entity | null} The selected inventory or null
     */
    getSelectedInventory(): Entity | null {
        return this.selectedInventory;
    }

    /**
     * Clears the selected inventory.
     * Resets to player inventory context.
     */
    clearSelectedInventory(): void {
        this.selectedInventory = null;
    }
}
