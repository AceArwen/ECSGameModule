import { ComponentRegistry } from './Registry';
import type { Entity } from './Components';
import type { CommandDescriptor } from './Commands';

export class InputSystem {
    private inventoryOpen = false;
    private selectedInventory: Entity | null = null;

    constructor(
        private registry: ComponentRegistry, 
        private player: number
    ) {
        // No more keyboard listeners - using console commands instead
    }

    // Process text commands from the console - returns command descriptors to execute
    processCommand(command: string): CommandDescriptor[] {
        const trimmedCommand = command.toLowerCase().trim();
        
        switch (trimmedCommand) {
            case 'i':
            case 'inventory':
                return this.toggleInventory();

            case 'c':
            case 'clear':
                return [{ type: 'clearConsole' }];
            
            case 'help':
            case 'h':
                return [{ type: 'addMessage', message: this.getHelpText() }];
            
            case 'status':
            case 's':
                return [{ type: 'addMessage', message: this.getStatusText() }];
            
            default:
                // Handle inventory slot selection (1-9)
                if (this.inventoryOpen && trimmedCommand >= '1' && trimmedCommand <= '9') {
                    const slotIndex = parseInt(trimmedCommand) - 1;
                    return this.selectInventorySlot(slotIndex);
                }
                
                return [{ type: 'addMessage', message: `Unknown command: "${command}". Type "help" for available commands.` }];
        }
    }

    private toggleInventory(): CommandDescriptor[] {
        this.inventoryOpen = !this.inventoryOpen;
        if (this.inventoryOpen) {
            // Auto-select player inventory when opening
            this.selectedInventory = this.registry.inventoryHelper.getInventoryByOwner(this.player);
            return [{ type: 'addMessage', message: this.displayInventory() }];
        } else {
            this.selectedInventory = null;
            return [{ type: 'addMessage', message: '📦 Inventory closed' }];
        }
    }

    // Method to select a specific inventory (for future use with chests, etc.)
    public selectInventory(inventoryEntity: Entity): CommandDescriptor[] {
        this.selectedInventory = inventoryEntity;
        this.inventoryOpen = true;
        return [{ type: 'addMessage', message: this.displayInventory() }];
    }

    
    private displayInventory(): string {
        if (!this.selectedInventory) {
            return '❌ No inventory selected';
        }

        const slots = this.registry.inventoryHelper.getInventorySlots(this.selectedInventory);
        
        // Handle empty inventory
        if (slots.length === 0) {
            const message = '❌ The inventory with ID ' + this.selectedInventory + ' does not contain any slots';
            this.inventoryOpen = false;
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
            const itemDefinition = this.registry.objectManager.getEntityDefinition(slot.object);
            const description = this.registry.components.get('description').get(itemDefinition);
            const stackable = this.registry.components.get('stackable').get(itemDefinition);
            
            const itemName = description?.name || 'Unknown Item';
            const count = slot.count > 1 ? ` x${slot.count}` : '';
            const stackInfo = stackable ? ` (Max: ${stackable.maxStack})` : '';
            
            output += `${index + 1}. ${itemName}${count}${stackInfo}\n`;
        });
        
        output += `\nType 1-${slots.length} to select items, or "i"/"inventory" to close\n==================\n`;
        return output;
    }

    private selectInventorySlot(slotIndex: number): CommandDescriptor[] {
        if (!this.selectedInventory) {
            return [{ type: 'addMessage', message: '❌ No inventory selected' }];
        }
        
        const slots = this.registry.inventoryHelper.getInventorySlots(this.selectedInventory);
        if (slotIndex >= slots.length) {
            return [{ type: 'addMessage', message: `❌ Slot ${slotIndex + 1} does not exist (Inventory has ${slots.length} slots)` }];
        }

        const slotEntity = slots[slotIndex];
        const hasObject = this.registry.inventoryHelper.slotHasObject(slotEntity);
        
        if (!hasObject) {
            return [{ type: 'addMessage', message: `❌ Slot ${slotIndex + 1} is empty` }];
        }

        const itemName = this.registry.inventoryHelper.getSlotObjectName(slotEntity);
        const quantity = this.registry.inventoryHelper.getSlotQuantity(slotEntity);
        
        return [{ type: 'addMessage', message: `🎯 Selected: ${itemName} x${quantity} (Slot ${slotIndex + 1})` }];
    }

    private getHelpText(): string {
        return `📖 Available Commands:
• inventory/i - Open/close inventory
• clear/c - Clear console messages
• status/s - Show player status
• help/h - Show this help message
• 1-9 - Select inventory slot (when inventory is open)`;
    }

    private getStatusText(): string {
        const description = this.registry.components.get('description').get(this.player);
        const playerName = description?.name || 'Unknown Player';
        return `👤 Player: ${playerName} (ID: ${this.player})\n📦 Inventory: ${this.inventoryOpen ? 'Open' : 'Closed'}`;
    }

    public getInventoryStatus(): boolean {
        return this.inventoryOpen;
    }
}
