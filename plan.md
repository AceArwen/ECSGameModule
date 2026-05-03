# ECS Game Module - Repository Plan

## Overview
This document provides comprehensive context for understanding and working with the ECS Game Module repository. It's designed to help agents quickly understand the architecture, patterns, and conventions used in this codebase.

## Architecture Summary

### Technology Stack
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: CSS Modules
- **Architecture**: Custom Entity Component System (ECS)

### Core Design Patterns
1. **Entity Component System (ECS)**: Custom implementation for game object management
2. **Command Pattern**: For game actions and UI operations
3. **React Context**: For global state management
4. **Template Method**: For object definition/instance pattern
5. **Strategy Pattern**: For system processing

## Repository Structure Deep Dive

### `/src/ECS/` - Core ECS Implementation

#### `/Core/` - ECS Infrastructure
- **Entity.ts**: Entity lifecycle management
  - `EntityManager` class handles entity creation/destruction
  - Tracks active entities and definition entities (templates)
  - Enforces immutability of definition entities
  
- **Registry.ts**: Component storage system
  - `ComponentRegistry` class manages all components
  - Type-safe component storage using Maps
  - Supports adding/removing components per entity
  
- **System.ts**: System base classes and interfaces
  - `System` interface for system implementation
  - `EntityProcessingSystem` for entities that need per-frame processing
  - `EntityFilter` for selecting entities with specific components
  
- **Components/**: Component type definitions
  - **BaseComponents.ts**: Core entity components (ObjectDefinition, ObjectInstance, Description)
  - **InventoryComponents.ts**: Inventory-related components (Inventory, Slot, HasOwner, IsOwner)
  - **ItemComponents.ts**: Item behavior components (Stackable, Weapon, Heal)
  - **TagComponents.ts**: Tag components for behavior marking (Usable, Consummable)

#### `/Data/` - Data Management
- **ObjectManager.ts**: Object creation and management
  - Handles object definitions (templates)
  - Creates object instances from definitions
  - Manages object type registry
  - Built-in methods for creating players, chests, and items
  
- **ObjectDefinitions.ts**: Game constants and object types
  - `ObjectId` enum for all object types
  - Game constants (inventory sizes, spawn chances)
  - Loot table configurations

#### `/Systems/` - Game Systems
- **InventorySystem.ts**: Inventory management
  - Creates inventories and slots
  - Handles item stacking and storage
  - Manages slot operations and item manipulation
  - Initializes player and chest inventories
  
- **InputSystem.ts**: Command processing
  - Processes console text commands
  - Converts commands to command descriptors
  - Manages inventory selection state
  - Provides help and status information

#### `/Commands/` - Command Pattern Implementation
- **GameCommands.ts**: Base game command classes
- **UICommands.ts**: UI-specific commands (ClearConsole, AddMessage)
- **CommandFactory.ts**: Creates commands from descriptors
- **Command Types**: TypeScript interfaces for command descriptors

#### `/Game/` - Game Initialization
- **GameInitializer.ts**: Game world setup
  - Initializes object definitions
  - Creates player and world entities
  - Sets up inventories
  - Provides game setup logging

### `/src/Context/` - React Context Providers

#### **ECSContext.tsx**
- Provides ECS system access to React components
- Initializes game on mount
- Manages ComponentRegistry, EntityManager, ObjectManager, Systems
- Provides player entity and input system to components

#### **GameConsoleContext.tsx**
- Manages console messages and history
- Persists messages to localStorage
- Provides message addition/clearing functionality

#### **SettingsContext.tsx**
- Manages user preferences (text size, colors, etc.)
- Persists settings to localStorage

### `/src/Routes/` - Application Screens

#### **GameScreen.tsx**
- Main game interface with console
- Handles command input and processing
- Manages command history navigation
- Renders console messages with styling

#### **Menu.tsx**
- Main navigation hub
- Links to game screen and settings

#### **Settings.tsx**
- User preferences interface
- Text customization options

## Key Architectural Decisions

### ECS Implementation
1. **Entity IDs**: Sequential integers starting from 1
2. **Component Storage**: Maps for O(1) access
3. **Definition vs Instance**: Clear separation between templates and instances
4. **System Processing**: Entity filtering based on component requirements

### React Integration
1. **Context Providers**: Centralized state management
2. **Initialization**: Single game initialization on app start
3. **Command Pattern**: Decouples game logic from React components
4. **Persistence**: localStorage for console messages and settings

### Performance Considerations
1. **Component Registry**: Efficient Map-based storage
2. **Entity Filtering**: Systems only process relevant entities
3. **Command Processing**: Batched command execution
4. **Message Persistence**: Limited localStorage usage

## Development Patterns

### Adding New Components
1. Define component interface in appropriate Components file
2. Export from Components/index.ts
3. Add to ComponentRegistry type definitions
4. Use in systems as needed

### Adding New Systems
1. Implement `EntityProcessingSystem` interface
2. Define `getEntityFilter()` method
3. Implement `processEntity()` method
4. Add to ECSContext initialization

### Adding New Commands
1. Define command descriptor in Commands/
2. Implement command class
3. Add to CommandFactory
4. Process in InputSystem

### Adding New Object Types
1. Add to ObjectId enum in ObjectDefinitions.ts
2. Create definition method in ObjectManager.ts
3. Add initialization in GameInitializer.ts

## Important Files for Understanding

### Core Architecture Files
- `src/ECS/Core/Entity.ts` - Entity lifecycle
- `src/ECS/Core/Registry.ts` - Component storage
- `src/ECS/Data/ObjectManager.ts` - Object management
- `src/ECS/Systems/InventorySystem.ts` - Inventory logic

### Integration Files
- `src/Context/ECSContext.tsx` - React integration
- `src/Routes/GameScreen.tsx` - Game interface
- `src/ECS/Game/GameInitializer.ts` - Game setup

### Configuration Files
- `src/ECS/Data/ObjectDefinitions.ts` - Game constants
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration

## Common Tasks

### Debugging Entity Issues
1. Check EntityManager for entity existence
2. Verify ComponentRegistry for component presence
3. Use console logging in system methods
4. Check entity definition/instance status

### Adding Game Features
1. Define new components for feature data
2. Create system for feature logic
3. Add commands for user interaction
4. Update UI as needed

### Performance Optimization
1. Monitor system processing time
2. Optimize entity filters
3. Reduce unnecessary component access
4. Use efficient data structures

## Testing Strategy

### Unit Testing Focus Areas
- Component Registry operations
- Entity Manager lifecycle
- System entity processing
- Command execution
- Object Manager operations

### Integration Testing Focus Areas
- Game initialization flow
- Command processing pipeline
- React Context integration
- localStorage persistence

## Future Extension Points

### Planned Features
- Combat system
- Quest system
- Save/load functionality
- Multi-entity interactions
- Advanced item properties

### Architectural Improvements
- Event system for entity communication
- Scripting system for game logic
- Network support for multiplayer
- Visual editor for object definitions

## Code Conventions

### TypeScript
- Strict type checking enabled
- Interface-first design
- Generic types for reusability
- JSDoc comments for documentation

### React
- Functional components with hooks
- Context providers for state
- CSS Modules for styling
- TypeScript props interfaces

### ECS
- Clear separation of concerns
- Immutable definition entities
- Type-safe component access
- System-based processing logic

This plan provides a comprehensive foundation for understanding and extending the ECS Game Module codebase.
