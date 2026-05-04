import { ComponentRegistry } from '../Core';
import type { Entity } from '../Core';
import type { CommandDescriptor } from '../Commands';
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
        private inventorySystem: InventorySystem,
        private usableSystem: UsableSystem,
        private player: number,
        private chest: number
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
        
        // Step 1: Identify base action
        const baseActionMatch = trimmedCommand.match(/^(i|inventory|chest|c|clear|help|h|status|s)(?:\s|$)/);
        if (!baseActionMatch) {
            return [{ type: 'addMessage', message: `Unknown command: "${command}". Type "h/help" for available commands.` }];
        }
        
        const baseAction = baseActionMatch[1];
        
        // Handle simple commands first
        if (/^(?:c|clear|help|h|status|s)$/.test(baseAction)) {
            return this.handleSimpleCommand(baseAction);
        }
        
        // Step 2: Parse inventory commands
        return this.parseInventoryCommand(baseAction, trimmedCommand);
    }

    /**
     * Handles simple commands that don't require further parsing.
     */
    private handleSimpleCommand(command: string): CommandDescriptor[] {
        switch (command) {
            case 'h':
            case 'help':
                return [{ type: 'addMessage' as const, message: this.getHelpText() }];
            case 's':
            case 'status':
                return [{ type: 'addMessage' as const, message: this.getStatusText() }];
            case 'c':
            case 'clear':
                return [{ type: 'clearConsole' as const }];
            default:
                return [{ type: 'addMessage', message: `Unknown simple command: ${command}` }];
        }
    }

    /**
     * Parses inventory commands with action and parameter identification.
     */
    private parseInventoryCommand(baseAction: string, fullCommand: string): CommandDescriptor[] {
        // Step 2: Find secondary action and parameters
        const remainingCommand = fullCommand.slice(baseAction.length).trim();
        
        // Extract action and parameters in order
        const parts = remainingCommand.split(/\s+/);
        let action: string | undefined;
        let parameters: string[] = [];
        
        // Identify action type and expected parameter count
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            
            if (/^(?:u|use)$/.test(part)) {
                action = 'use';
            } else if (/^(?:t|take)$/.test(part)) {
                action = 'take';
            } else if (/^(?:m|move)$/.test(part)) {
                action = 'move';
            } else if (/^[1-9]$/.test(part)) {
                parameters.push(part);
            }
        }
        
        // Execute based on base action and identified action
        return this.executeInventoryAction(baseAction, action, parameters);
    }

    /**
     * Executes inventory actions based on parsed components.
     */
    private executeInventoryAction(baseAction: string, action: string | undefined, parameters: string[]): CommandDescriptor[] {
        const inventoryType = /^(?:i|inventory)$/.test(baseAction) ? 'player' : 'chest';
        
        // No action = display inventory
        if (!action) {
            if (parameters.length === 0) {
                return this.displayInventoryByType(inventoryType);
            } else if (parameters.length === 1) {
                return this.handleSlotDisplay(inventoryType, parameters[0]);
            } else {
                return [{ type: 'addMessage', message: 'Too many parameters for inventory display' }];
            }
        }
        
        // Execute specific action with parameter validation
        switch (action) {
            case 'use':
                if (parameters.length === 1) {
                    return this.handleItemUseAction(inventoryType, parameters[0]);
                } else {
                    return [{ type: 'addMessage', message: 'Use command requires exactly 1 slot number' }];
                }
            case 'take':
                if (parameters.length === 1) {
                    return this.handleItemTakeAction(inventoryType, parameters[0]);
                } else {
                    return [{ type: 'addMessage', message: 'Take command requires exactly 1 slot number' }];
                }
            case 'move':
                if (parameters.length === 2) {
                    return this.handleItemMoveAction(inventoryType, parameters);
                } else {
                    return [{ type: 'addMessage', message: 'Move command requires exactly 2 slot numbers' }];
                }
            default:
                return [{ type: 'addMessage', message: `Unknown action: ${action}` }];
        }
    }

    /**
     * Displays inventory based on type.
     */
    private displayInventoryByType(inventoryType: 'player' | 'chest'): CommandDescriptor[] {
        if (inventoryType === 'player') {
            return this.displayInventoryCommand();
        } else {
            return this.handleChestInventoryCommand();
        }
    }

    /**
     * Handles slot display for different inventory types.
     */
    private handleSlotDisplay(inventoryType: 'player' | 'chest', slotNumber: string): CommandDescriptor[] {
        if (inventoryType === 'player') {
            return this.handleInventorySlotWithPrefix(slotNumber);
        } else {
            return this.handleChestSlotWithPrefix(slotNumber);
        }
    }

    /**
     * Handles item use action for different inventory types.
     */
    private handleItemUseAction(inventoryType: 'player' | 'chest', slotNumber: string): CommandDescriptor[] {
        if (inventoryType === 'player') {
            return this.handleItemUsage(slotNumber);
        } else {
            return this.handleChestItemUsage(slotNumber);
        }
    }

    /**
     * Handles item take action (only for chest).
     */
    private handleItemTakeAction(inventoryType: 'player' | 'chest', slotNumber: string): CommandDescriptor[] {
        if (inventoryType === 'chest') {
            return this.handleChestItemTake(slotNumber);
        } else {
            return [{ type: 'addMessage', message: 'Cannot take from player inventory' }];
        }
    }

    /**
     * Handles item move action between two slots.
     */
    private handleItemMoveAction(inventoryType: 'player' | 'chest', slotNumbers: string[]): CommandDescriptor[] {
        const fromSlotNumber = slotNumbers[0];
        const toSlotNumber = slotNumbers[1];
        
        return this.moveBetweenSlots(inventoryType, fromSlotNumber, toSlotNumber);
    }

    /**
     * Generic method to move items between slots.
     */
    private moveBetweenSlots(inventoryType: 'player' | 'chest', fromSlotNumber: string, toSlotNumber: string): CommandDescriptor[] {
        const inventory = inventoryType === 'player' 
            ? (this.selectedInventory || this.inventorySystem.getInventoryByOwner(this.player))
            : this.inventorySystem.getInventoryByOwner(this.chest);
        
        if (!inventory) {
            const inventoryName = inventoryType === 'player' ? 'Player' : 'Chest';
            return [{ type: 'addMessage', message: `${inventoryName} has no inventory` }];
        }

        const slots = this.inventorySystem.getInventorySlots(inventory);
        const fromSlotIndex = parseInt(fromSlotNumber) - 1;
        const toSlotIndex = parseInt(toSlotNumber) - 1;
        
        // Validate slot indices
        if (fromSlotIndex < 0 || fromSlotIndex >= slots.length || toSlotIndex < 0 || toSlotIndex >= slots.length) {
            return [{ type: 'addMessage', message: `Invalid slot numbers: ${fromSlotNumber} or ${toSlotNumber}` }];
        }

        const fromSlot = slots[fromSlotIndex];
        const toSlot = slots[toSlotIndex];
        
        // Check if source slot has an object
        if (!this.inventorySystem.slotHasObject(fromSlot)) {
            return [{ type: 'addMessage', message: `Source slot ${fromSlotNumber} is empty` }];
        }

        // Use inventory system's exchange method
        const moveSuccess = this.inventorySystem.exchangeObjectInSlots(fromSlot, toSlot);
        
        if (!moveSuccess) {
            return [{ type: 'addMessage', message: `Failed to move item from slot ${fromSlotNumber}` }];
        }
        
        // Determine operation type based on slot states
        const fromSlotEmpty = !this.inventorySystem.slotHasObject(fromSlot);
        const toSlotEmpty = !this.inventorySystem.slotHasObject(toSlot);
        
        if (fromSlotEmpty && !toSlotEmpty) {
            return [{ type: 'addMessage', message: `Moved item from slot ${fromSlotNumber} to ${toSlotNumber}` }];
        } else if (!fromSlotEmpty && !toSlotEmpty) {
            return [{ type: 'addMessage', message: `Exchanged items between slots ${fromSlotNumber} and ${toSlotNumber}` }];
        } else {
            return [{ type: 'addMessage', message: `Stacked item in slot ${toSlotNumber}` }];
        }
    }

    // ====================
    // INVENTORY COMMANDS
    // ====================

    /**
     * Generic method to display inventory contents.
     * 
     * @param {Entity} inventory - The inventory entity to display
     * @param {string} inventoryName - The name to display for the inventory
     * 
     * @returns {CommandDescriptor[]} Command descriptors for inventory display
     */
    private displayInventory(inventory: Entity, inventoryName: string): CommandDescriptor[] {
        if (!inventory) {
            return [{ type: 'addMessage', message: `${inventoryName} has no inventory` }];
        }

        const slots = this.inventorySystem.getInventorySlots(inventory);
        const inventoryLines = slots.map((slot, index) => {
            const slotNumber = index + 1;
            const hasObject = this.inventorySystem.slotHasObject(slot);
            const quantity = this.inventorySystem.getSlotQuantity(slot);
            const objectName = this.inventorySystem.getSlotObjectName(slot);
            
            return `${slotNumber}. ${hasObject ? `${objectName} (${quantity})` : 'Empty'}`;
        });

        return [{ type: 'addMessage', message: `${inventoryName} Inventory:\n${inventoryLines.join('\n')}` }];
    }

    /**
     * Generic method to handle item usage from a specific inventory.
     * 
     * @param {string} slotNumber - The slot number as string
     * @param {Entity} inventory - The inventory entity to use from
     * @param {string} inventoryType - The type of inventory for error messages
     * 
     * @returns {CommandDescriptor[]} Command descriptors for item usage
     */
    private handleItemUsageFromInventory(slotNumber: string, inventory: Entity, inventoryType: string): CommandDescriptor[] {
        const slotIndex = parseInt(slotNumber) - 1;
        
        if (!inventory) {
            return [{ type: 'addMessage', message: `${inventoryType} has no inventory` }];
        }

        const slots = this.inventorySystem.getInventorySlots(inventory);
        if (slotIndex < 0 || slotIndex >= slots.length) {
            return [{ type: 'addMessage', message: `Invalid slot number: ${slotIndex + 1}` }];
        }

        const slot = slots[slotIndex];
        if (!this.inventorySystem.slotHasObject(slot)) {
            return [{ type: 'addMessage', message: `${inventoryType} slot ${slotIndex + 1} is empty` }];
        }

        const slotComponent = this.registry.getComponent("slot", slot);

        // Use the item
        const result = this.usableSystem.useEntity(this.player, slotComponent.object, slot);
        return [{ type: 'addMessage', message: result }];
    }

    /**
     * Generic method to select a slot from a specific inventory.
     * 
     * @param {number} slotIndex - The zero-based slot index
     * @param {Entity} inventory - The inventory entity
     * @param {string} inventoryType - The type of inventory for messages
     * 
     * @returns {CommandDescriptor[]} Command descriptors for slot selection
     */
    private selectSlotFromInventory(slotIndex: number, inventory: Entity, inventoryType: string): CommandDescriptor[] {
        if (!inventory) {
            return [{ type: 'addMessage', message: `${inventoryType} has no inventory` }];
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
        return [{ type: 'addMessage', message: `${inventoryType} slot ${slotIndex + 1}: ${slotInfo}` }];
    }

    /**
     * Handles chest inventory display command.
     * Shows the contents of the chest.
     * 
     * @returns {CommandDescriptor[]} Command descriptors for chest inventory display
     */
    private handleChestInventoryCommand(): CommandDescriptor[] {
        const inventory = this.inventorySystem.getInventoryByOwner(this.chest);
        return this.displayInventory(inventory, 'Chest');
    }

    /**
     * Handles inventory display command.
     * Shows the selected inventory or default to player inventory.
     * 
     * @returns {CommandDescriptor[]} Command descriptors for inventory display
     */
    private displayInventoryCommand(): CommandDescriptor[] {
        const inventory = this.selectedInventory || this.inventorySystem.getInventoryByOwner(this.player);
        const inventoryOwner = this.selectedInventory ? 'Selected' : 'Player';
        return this.displayInventory(inventory, inventoryOwner);
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
     * Handles chest slot selection with prefix.
     * Selects or shows chest slots.
     * 
     * @param {string} slotNumber - The slot number as string
     * 
     * @returns {CommandDescriptor[]} Command descriptors for chest slot selection
     */
    private handleChestSlotWithPrefix(slotNumber: string): CommandDescriptor[] {
        const slotIndex = parseInt(slotNumber) - 1;
        return this.selectChestSlot(slotIndex);
    }

    /**
     * Handles chest item usage commands.
     * Uses items from chest inventory slots.
     * 
     * @param {string} slotNumber - The slot number as string
     * 
     * @returns {CommandDescriptor[]} Command descriptors for chest item usage
     */
    private handleChestItemUsage(slotNumber: string): CommandDescriptor[] {
        const inventory = this.inventorySystem.getInventoryByOwner(this.chest);
        return this.handleItemUsageFromInventory(slotNumber, inventory, 'Chest');
    }

    /**
     * Handles item take commands from a specific inventory.
     * Transfers items from source inventory to player inventory.
     * 
     * @param {string} slotNumber - The slot number as string
     * @param {Entity} sourceInventory - The source inventory to take from
     * @param {string} sourceType - The type of source inventory (e.g., 'Chest')
     * 
     * @returns {CommandDescriptor[]} Command descriptors for item taking
     */
    private handleItemTakeFromInventory(slotNumber: string, sourceInventory: Entity, sourceType: string): CommandDescriptor[] {
        const slotIndex = parseInt(slotNumber) - 1;
        
        if (!sourceInventory) {
            return [{ type: 'addMessage', message: `${sourceType} has no inventory` }];
        }

        const playerInventory = this.inventorySystem.getInventoryByOwner(this.player);
        if (!playerInventory) {
            return [{ type: 'addMessage', message: 'Player has no inventory' }];
        }

        const sourceSlots = this.inventorySystem.getInventorySlots(sourceInventory);
        if (slotIndex < 0 || slotIndex >= sourceSlots.length) {
            return [{ type: 'addMessage', message: `Invalid slot number: ${slotIndex + 1}` }];
        }

        const sourceSlot = sourceSlots[slotIndex];
        if (!this.inventorySystem.slotHasObject(sourceSlot)) {
            return [{ type: 'addMessage', message: `${sourceType} slot ${slotIndex + 1} is empty` }];
        }

        // Get item info before transfer
        const objectName = this.inventorySystem.getSlotObjectName(sourceSlot);
        const originalQuantity = this.inventorySystem.getSlotQuantity(sourceSlot);
        
        // Use the inventory system's built-in move method which handles stacking and partial transfers
        this.inventorySystem.moveObjectFromSlotToInventory(sourceSlot, playerInventory);
        
        // Check how many items were actually moved
        const remainingQuantity = this.inventorySystem.getSlotQuantity(sourceSlot);
        const movedQuantity = originalQuantity - remainingQuantity;
        
        if (movedQuantity > 0) {
            if (remainingQuantity > 0) {
                return [{ type: 'addMessage', message: `Moved ${movedQuantity}/${originalQuantity}x ${objectName} from ${sourceType}` }];
            } else {
                return [{ type: 'addMessage', message: `Took ${movedQuantity}x ${objectName} from ${sourceType}` }];
            }
        } else {
            return [{ type: 'addMessage', message: `Inventory full, ${originalQuantity}x ${objectName} not moved` }];
        }
    }

    /**
     * Handles chest item take commands.
     * Transfers items from chest to player inventory.
     * 
     * @param {string} slotNumber - The slot number as string
     * 
     * @returns {CommandDescriptor[]} Command descriptors for chest item taking
     */
    private handleChestItemTake(slotNumber: string): CommandDescriptor[] {
        const chestInventory = this.inventorySystem.getInventoryByOwner(this.chest);
        return this.handleItemTakeFromInventory(slotNumber, chestInventory, 'Chest');
    }

    /**
     * Handles item usage commands.
     * Uses items from player inventory slots.
     * 
     * @param {string} slotNumber - The slot number as string
     * 
     * @returns {CommandDescriptor[]} Command descriptors for item usage
     */
    private handleItemUsage(slotNumber: string): CommandDescriptor[] {
        const inventory = this.selectedInventory || this.inventorySystem.getInventoryByOwner(this.player);
        const inventoryType = this.selectedInventory ? 'Selected' : 'Slot';
        return this.handleItemUsageFromInventory(slotNumber, inventory, inventoryType);
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
        return this.selectSlotFromInventory(slotIndex, inventory, 'Selected');
    }

    /**
     * Selects a chest slot for further operations.
     * 
     * @param {number} slotIndex - The zero-based slot index
     * 
     * @returns {CommandDescriptor[]} Command descriptors for chest slot selection
     */
    private selectChestSlot(slotIndex: number): CommandDescriptor[] {
        const inventory = this.inventorySystem.getInventoryByOwner(this.chest);
        return this.selectSlotFromInventory(slotIndex, inventory, 'Chest');
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
        return `Commands:
  i/inventory - Show inventory
  i [number] - Show inventory slot
  i [number] u/use - Use inventory item (or: i u/use [number])
  chest - Show chest inventory
  chest [number] - Show chest slot
  chest [number] u/use - Use chest item (or: chest u/use [number])
  chest [number] t/take - Take chest item (or: chest t/take [number])
  c/clear - Clear console
  h/help - Show this help
  s/status - Show status`;
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
