# ECS Game Module: Complete System Architecture & Event-Ready Design

## Overview

This document provides a comprehensive overview of the ECS Game Module's complete system architecture, including the current implementation with semantic organization, complete documentation coverage, and the event-ready design for future extensibility. The architecture maintains clean separation of concerns across all systems while providing a clear migration path to event-driven design.

## Current Implementation (Hybrid Approach)

The current implementation uses a hybrid approach where:
- **UsableSystem** orchestrates effect application
- **Effect descriptors** define what effects exist
- **InventorySystem** handles all slot operations and quantity management
- **ObjectManager** handles entity initialization and creation
- **InputSystem** manages command processing and user interaction

### Current Structure
```typescript
// Effect descriptors (data)
interface HealEffect { type: 'heal'; amount: number; }
interface QuantityEffect { type: 'quantity'; reduction: number; }

// UsableSystem orchestrates effects with organized methods
class UsableSystem {
    // SYSTEM LIFECYCLE
    initialize() { /* system setup */ }
    cleanup() { /* system teardown */ }
    
    // MAIN USAGE API
    useEntity(user, item, slot) {
        const effects = this.collectEffects(item);
        const results = this.applyEffects(effects, user, item, slot);
        return results.join(". ");
    }
    
    // EFFECT COLLECTION
    private collectEffects(item) { /* collect effect descriptors */ }
    
    // EFFECT APPLICATION
    private applyEffects() { /* orchestrate effect application */ }
    private applyHealEffect() { /* handle healing */ }
    private applyQuantityEffect() { /* handle quantity reduction */ }
}

// InventorySystem handles all slot operations
class InventorySystem {
    // SYSTEM LIFECYCLE
    initialize() { /* system setup */ }
    cleanup() { /* system teardown */ }
    
    // INVENTORY CREATION & ACCESS
    createInventory() { /* create new inventories */ }
    getInventoryByOwner() { /* get inventory by owner */ }
    getInventorySlots() { /* get all slots */ }
    
    // SLOT QUERY METHODS
    slotHasObject() { /* check slot contents */ }
    getSlotQuantity() { /* get item count */ }
    getSlotObjectName() { /* get item name */ }
    getSlotIndex() { /* get slot position */ }
    
    // ADD OPERATIONS
    addObjectToInventory() { /* add with stacking */ }
    canStackInSlot() { /* check stacking */ }
    addToSlot() { /* add to specific slot */ }
    
    // REMOVE OPERATIONS
    removeQuantityFromSlot() { /* remove specific amount */ }
    removeObjectFromSlot() { /* clear slot */ }
    
    // ADVANCED OPERATIONS
    exchangeObjectInSlots() { /* swap between slots */ }
    moveObjectFromSlotToInventory() { /* move to inventory */ }
    
    // HELPER METHODS
    getEntityDefinition() { /* get definition */ }
    getChildEntities() { /* get children */ }
}

// ObjectManager handles entity lifecycle
class ObjectManager {
    createPlayerInstance() { /* basic player creation */ }
    createPlayerInstanceWithInventory() { /* full player setup */ }
    createChestInstance() { /* basic chest creation */ }
    createChestInstanceWithInventory() { /* full chest setup */ }
    initializePlayerInventory() { /* setup player items */ }
    initializeChestInventory() { /* setup chest loot */ }
}

// InputSystem handles user commands
class InputSystem {
    // MAIN COMMAND PROCESSING
    processCommand() { /* parse and route commands */ }
    
    // INVENTORY COMMANDS
    displayInventoryCommand() { /* show inventory */ }
    handleInventorySlotWithPrefix() { /* select slots */ }
    handleItemUsage() { /* use items */ }
    selectInventorySlot() { /* slot selection */ }
    
    // HELP & STATUS COMMANDS
    getHelpText() { /* show help */ }
    getStatusText() { /* show status */ }
    
    // INVENTORY MANAGEMENT
    setSelectedInventory() { /* manage selection */ }
}
```

### Key Improvements Made

1. **Semantic Organization**: All systems now have methods organized by semantic groups:
   - System Lifecycle (initialize, cleanup, etc.)
   - Public API (main entry points)
   - Core Functionality grouped by operation type (add, remove, query)
   - Helper/Utility methods

2. **Complete Documentation**: Every method has comprehensive JSDoc documentation with:
   - Clear descriptions of functionality
   - Type information for all parameters and return values
   - Usage context and examples

3. **Proper Separation of Concerns**: Each system has clear, focused responsibilities:
   - **InventorySystem**: Slot operations, inventory management, item stacking
   - **UsableSystem**: Effect orchestration, item usage, effect application
   - **ObjectManager**: Entity creation, initialization, definition management
   - **InputSystem**: Command processing, user interaction, inventory selection

4. **Unified Quantity Management**: 
   - Removed redundant `clearSlot` method
   - Consolidated all quantity operations in `removeQuantityFromSlot`
   - Consistent API for all slot manipulation

5. **Entity Name Centralization**: 
   - Uses `EntityManager.getEntityName()` for consistent naming
   - Removed duplicate name retrieval logic
   - Single source of truth for entity display names

6. **Enhanced Slot Operations**:
   - Advanced slot manipulation (exchange, move, partial removal)
   - Cross-inventory operations
   - Proper error handling and validation

7. **Improved Entity Initialization**:
   - Moved initialization logic from InventorySystem to ObjectManager
   - Integrated entity creation with inventory setup
   - Clean separation between entity definition and inventory management

## Future Event-Ready Architecture

### Design Principles
1. **Loose Coupling** - Systems communicate through events only
2. **Extensibility** - New effects can be added without modifying core systems
3. **Data-Driven** - Effects are pure data, behavior is in separate systems
4. **Event Chaining** - Effects can trigger additional events

### Proposed Architecture

#### 1. Event System Interface
```typescript
interface EventSystem {
    dispatch(eventName: string, data: any): void;
    subscribe(eventName: string, handler: (data: any) => void): void;
    unsubscribe(eventName: string, handler: (data: any) => void): void;
}
```

#### 2. Event Types
```typescript
// Core usage event
interface ItemUsedEvent {
    user: Entity;
    item: Entity;
    slot: Entity;
    effects: Effect[];
    timestamp: number;
}

// Effect-specific events
interface HealthChangedEvent {
    entity: Entity;
    oldHealth: number;
    newHealth: number;
    source: 'item' | 'damage' | 'regeneration';
}

interface QuantityChangedEvent {
    slot: Entity;
    oldQuantity: number;
    newQuantity: number;
    item: Entity;
}
```

#### 3. Refactored UsableSystem
```typescript
class UsableSystem {
    constructor(
        private registry: ComponentRegistry,
        private eventSystem: EventSystem
    ) {}

    useEntity(user: Entity, item: Entity, slot: Entity): string {
        // Validate usability
        if (!this.isUsable(item)) {
            return "❌ This item cannot be used";
        }

        // Collect effects
        const effects = this.collectEffects(item);

        // Dispatch usage event - let other systems handle effects
        this.eventSystem.dispatch('itemUsed', {
            user,
            item,
            slot,
            effects,
            timestamp: Date.now()
        });

        return `✅ Used ${this.getItemName(item)}`;
    }

    private isUsable(item: Entity): boolean {
        return this.registry.components.get('usable').has(item);
    }

    private collectEffects(item: Entity): Effect[] {
        // Same as current implementation
        const effects: Effect[] = [];
        
        const healComponent = this.registry.components.get('heal').get(item);
        if (healComponent) {
            effects.push({ type: 'heal', amount: healComponent.amount } as HealEffect);
        }

        // Check if item is consummable (gets reduced when used)
        const consummable = this.registry.components.get('consummable').get(item);
        if (consummable) {
            effects.push({ type: 'quantity', reduction: 1 } as QuantityEffect);
        }

        return effects;
    }
}
```

#### 4. Effect Handler Systems

##### HealthSystem
```typescript
class HealthSystem implements EntityProcessingSystem {
    constructor(
        private registry: ComponentRegistry,
        private eventSystem: EventSystem
    ) {
        // Subscribe to item usage events
        this.eventSystem.subscribe('itemUsed', this.handleItemUsed.bind(this));
    }

    private handleItemUsed(event: ItemUsedEvent): void {
        const healEffect = event.effects.find(e => e.type === 'heal') as HealEffect;
        if (!healEffect) return;

        this.applyHealing(event.user, healEffect.amount);
    }

    private applyHealing(entity: Entity, amount: number): void {
        const health = this.registry.components.get('health').get(entity);
        if (!health) return;

        const oldHealth = health.health;
        health.health = Math.min(health.health + amount, health.maxHealth);
        const actualHeal = health.health - oldHealth;

        // Dispatch health change event for other systems
        this.eventSystem.dispatch('healthChanged', {
            entity,
            oldHealth,
            newHealth: health.health,
            source: 'item'
        });

        // Check for death
        if (health.health <= 0 && health.onDeath) {
            health.onDeath();
            this.eventSystem.dispatch('entityDied', { entity });
        }
    }
}
```

##### InventorySystem
```typescript
class InventorySystem implements EntityProcessingSystem {
    constructor(
        private registry: ComponentRegistry,
        private eventSystem: EventSystem
    ) {
        this.eventSystem.subscribe('itemUsed', this.handleItemUsed.bind(this));
    }

    private handleItemUsed(event: ItemUsedEvent): void {
        const quantityEffect = event.effects.find(e => e.type === 'quantity') as QuantityEffect;
        
        if (quantityEffect) {
            this.reduceQuantity(event.slot, quantityEffect.reduction, event.item);
        }
    }

    private reduceQuantity(slot: Entity, reduction: number, item: Entity): void {
        const slotComponent = this.registry.components.get('slot').get(slot);
        if (!slotComponent) return;

        const oldQuantity = slotComponent.count;
        const newQuantity = slotComponent.count - reduction;

        if (newQuantity <= 0) {
            this.clearSlot(slot);
        } else {
            slotComponent.count = newQuantity;
        }

        // Dispatch quantity change event
        this.eventSystem.dispatch('quantityChanged', {
            slot,
            oldQuantity,
            newQuantity: Math.max(0, newQuantity),
            item
        });
    }
}
```

#### 5. Extensible Effect System

##### Adding New Effects
```typescript
// 1. Define new effect type
interface StatusEffect extends Effect {
    type: 'status';
    status: 'poison' | 'burn' | 'freeze';
    duration: number;
}

// 2. Add effect collection logic
private collectEffects(item: Entity): Effect[] {
    // ... existing effects ...
    
    const statusComponent = this.registry.components.get('status').get(item);
    if (statusComponent) {
        effects.push({
            type: 'status',
            status: statusComponent.status,
            duration: statusComponent.duration
        } as StatusEffect);
    }
    
    return effects;
}

// 3. Proper component semantics
// Stackable: Item can be stacked in inventory slots (capacity management)
// Consummable: Item gets reduced/removed when used (consumption behavior)
// Example: Potion = Stackable + Consummable, Key = Not Stackable + Not Consummable

// 3. Create new system to handle effects
class StatusEffectSystem implements EntityProcessingSystem {
    constructor(private eventSystem: EventSystem) {
        this.eventSystem.subscribe('itemUsed', this.handleItemUsed.bind(this));
    }

    private handleItemUsed(event: ItemUsedEvent): void {
        const statusEffect = event.effects.find(e => e.type === 'status') as StatusEffect;
        if (statusEffect) {
            this.applyStatusEffect(event.user, statusEffect);
        }
    }
}
```

## Component Semantics

### Stackable Component
- **Purpose**: Determines if an item can be stacked in inventory slots
- **Usage**: Inventory management and capacity control
- **Examples**: 
  - Potions, arrows, coins = Stackable
  - Weapons, keys, unique items = Not Stackable

### Consummable Component
- **Purpose**: Determines if using the item reduces its quantity
- **Usage**: All consummable items have quantity reduction when used
- **Examples**:
  - Potions, food, bandages = Consummable (quantity reduced)
  - Weapons, keys, tools = Not Consummable (quantity unchanged)

### Component Combinations
| Item Type | Stackable | Consummable | Behavior                                        |
|-----------|-----------|-------------|-------------------------------------------------|
| Potion    | ✅         | ✅           | Multiple per slot, quantity decreases when used |
| Sword     | ❌         | ❌           | One per slot, quantity unchanged when used      |
| Key       | ❌         | ❌           | One per slot, quantity unchanged when used      |
| Food      | ✅         | ✅           | Multiple per slot, quantity decreases when used |
| Scroll    | ❌         | ✅           | One per slot, quantity decreases when used      |

### Key Distinction
- **Stackable**: How many can fit in ONE slot (capacity)
- **Consummable**: Quantity gets reduced when used

**Examples:**
- **Potion**: 10 potions in 1 slot (stackable), each use reduces count by 1 (consummable)
- **Scroll**: 1 scroll per slot (not stackable), each use reduces count by 1 (consummable)
- **Sword**: 1 sword per slot (not stackable), quantity unchanged when used (not consummable)

**Important**: Consummable ALWAYS means quantity reduction. The amount reduced depends on the item configuration (currently fixed at 1, but could be variable in future).

### Future Extensibility
The consummable behavior could be enhanced with:
- **Variable quantity reduction**: Different amounts per use (liquid portions)
- **Conditional quantity reduction**: Only reduce if effect succeeds
- **Percentage reduction**: Reduce by percentage instead of fixed amount
- **Reduction modifiers**: Tools that affect quantity reduction rate

## Migration Path

### Phase 1: Event System Infrastructure
1. Create EventSystem interface and basic implementation
2. Define core event types (ItemUsedEvent, HealthChangedEvent, etc.)
3. Add EventSystem to existing system constructors (preserving current organization)

### Phase 2: Refactor UsableSystem
1. Modify UsableSystem to dispatch events instead of applying effects directly
2. Keep current effect collection logic and semantic organization
3. Update return messages to be event-driven
4. Maintain current method organization (SYSTEM LIFECYCLE, MAIN USAGE API, etc.)

### Phase 3: Create Effect Handler Systems
1. Create HealthSystem with event subscription
2. Move healing logic from UsableSystem to HealthSystem
3. Create InventorySystem event handlers for quantity effects
4. Leverage existing REMOVE OPERATIONS methods for quantity handling
5. Test and validate event flow

### Phase 4: Add New Effects
1. Implement status effects as example of extensibility
2. Add event chaining (effects triggering other effects)
3. Add event filtering and priority systems
4. Integrate with current ADVANCED OPERATIONS methods

### Current System Readiness
The current implementation is well-prepared for event-driven migration:
- ✅ **Semantic Organization**: Clear method groups make event integration straightforward
- ✅ **Complete Documentation**: Every method documented for easy migration
- ✅ **Separation of Concerns**: Each system has focused responsibilities
- ✅ **Unified APIs**: Consistent patterns across all systems
- ✅ **Error Handling**: Robust validation and edge case handling

## Benefits of Event-Ready Architecture

### 1. **Scalability**
- New effects can be added without modifying existing systems
- Systems can be developed and tested independently
- Event-based communication reduces coupling

### 2. **Maintainability**
- Clear separation of concerns
- Each system has a single responsibility
- Event flow is easy to trace and debug

### 3. **Extensibility**
- Runtime addition of new effect types
- Plugin architecture for third-party effects
- Event chaining for complex interactions

### 4. **Testing**
- Each system can be unit tested independently
- Event-driven behavior can be mocked easily
- Integration tests focus on event flow

## Implementation Notes

### Event System Considerations
- **Event Ordering**: Consider event priority and execution order
- **Event Batching**: Batch related events to improve performance
- **Event History**: Maintain event log for debugging and replay
- **Error Handling**: Graceful handling of event handler failures

### Performance Considerations
- **Event Filtering**: Allow systems to filter events they care about
- **Event Cancellation**: Allow systems to cancel event propagation
- **Async Events**: Support for asynchronous event handling
- **Event Aggregation**: Combine similar events to reduce overhead

### Debugging Support
- **Event Logging**: Log all events with timestamps and context
- **Event Tracing**: Visual tools to trace event flow
- **Event Statistics**: Metrics on event frequency and performance
- **Event Breakpoints**: Debug tools to pause on specific events

## Conclusion

The event-ready architecture provides a solid foundation for future growth while maintaining the simplicity of the current hybrid approach. The migration can be done incrementally, allowing you to adopt event-driven patterns as the complexity of your game increases.

This architecture will support:
- Complex item interactions
- Status effects and buffs
- Environmental interactions
- AI behavior responses
- Achievement systems
- Combat mechanics
- Crafting systems

All while maintaining clean, testable, and maintainable code.
