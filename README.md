# ECS Game Module

A React + TypeScript game application built with a custom Entity Component System (ECS) architecture. This modular game framework provides a foundation for building text-based games with flexible object management and extensible systems.

## Features

### ECS Architecture
- **Entity Component System**: Custom implementation for efficient game object management
- **Component Registry**: Type-safe component storage and retrieval system
- **Object Definitions**: Template-based object instantiation system
- **Inventory Management**: Built-in inventory and slot management components
- **Environment Interaction**
   - Interactive objects (chests, doors, torches)
   - Proximity-based interaction system
   - Environmental state management
   - Multi-entity interaction mechanics
     - Entity-to-entity communication and trading
     - Combat system and battle mechanics
- **Save/Load System**
   - Game state serialization and persistence
   - Multiple save slot management
   - Version compatibility handling
   - Progress recovery and backup systems
- **Player Entity Creation Interface**
   - In-game entity definition creation system
   - Component-based crafting interface
   - Visual component selection and configuration
   - Free-form crafting and item creation
   - Player-created entity templates and instances
- **Command Pattern**: Extensible command system for game actions
- **System-based Processing**: Modular systems for different game mechanics

### Game Interface
- **Console-style Game Screen**: Interactive text-based gameplay interface
- **Persistent Console Messages**: Messages saved to localStorage across sessions
- **Customizable Text Settings**: Adjustable text size, weight, and colors
- **Command History**: Navigate through previous commands with arrow keys
- **Real-time Command Processing**: Immediate feedback and response system

### Application Structure
- **Menu System**: Main navigation hub
- **Game Screen**: Primary gameplay interface with console
- **Settings Panel**: Customizable user preferences
- **Context-based State Management**: React Context for global settings
- **Modular Routing**: Clean separation between game screens

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **CSS Modules** for scoped styling

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ECSGameModule

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## ECS System Overview

### Core Architecture
The ECS system is built around three main concepts:

#### Entities
- Unique identifiers for game objects
- Managed by `EntityManager`
- Can be marked as definitions (templates) or instances
- Support lifecycle management (create/destroy)

#### Components
- Data containers attached to entities
- Type-safe storage through `ComponentRegistry`
- Organized into logical groups:
  - **Base Components**: ObjectDefinition, ObjectInstance, Description
  - **Inventory Components**: Inventory, Slot, HasOwner, IsOwner
  - **Item Components**: Stackable, Weapon, Heal
  - **Tag Components**: Usable, Consummable

#### Systems
- Process entities with specific component combinations
- Currently implemented systems:
  - **InventorySystem**: Manages inventories, slots, and item operations
  - **InputSystem**: Processes console commands and user input

### Object Management
- **ObjectManager**: Handles object definitions and instance creation
- **Template System**: Define object types once, instantiate many times
- **Built-in Object Types**: Character, Chest, Sword, Bandage, Key
- **Extensible Design**: Easy to add new object types and behaviors

### Command System
- **Command Pattern**: Extensible command architecture
- **Command Factory**: Creates commands from descriptors
- **UI Commands**: ClearConsole, AddMessage
- **Game Commands**: Extensible for game-specific actions

### Entity Management Workflow
1. Create object definitions with components
2. Mark entities as definitions (immutable templates)
3. Create instances from definitions
4. Systems process entities based on their components
5. Commands execute game actions and UI updates

## Game Controls

### Console Commands
- **inventory** or **i**: Display player inventory content
- **i [1-9]**: Select and interact with inventory slot (e.g., "i 3")
- **clear** or **c**: Clear console messages
- **status** or **s**: Show player status information
- **help** or **h**: Display available commands

### Keyboard Navigation
- **Enter**: Submit console command
- **Arrow Up/Down**: Navigate through command history
- **Arrow Keys**: Auto-complete previous commands

### Navigation
- Use the menu buttons to navigate between screens
- Access settings to customize text appearance
- Console messages persist across sessions via localStorage

## Project Structure

```
src/
├── Context/                 # React Context providers
│   ├── ECSContext.tsx      # Main ECS system provider
│   ├── GameConsoleContext.tsx # Console message management
│   └── SettingsContext.tsx # User preferences
├── ECS/                    # Core ECS implementation
│   ├── Core/              # ECS infrastructure
│   │   ├── Components/    # Component type definitions
│   │   ├── Entity.ts      # Entity lifecycle management
│   │   ├── Registry.ts    # Component storage system
│   │   └── System.ts      # System base classes
│   ├── Data/              # Data management
│   │   ├── ObjectManager.ts # Object creation/management
│   │   └── ObjectDefinitions.ts # Game constants/types
│   ├── Systems/           # Game systems
│   │   ├── InventorySystem.ts # Inventory management
│   │   └── InputSystem.ts # Command processing
│   ├── Commands/          # Command pattern implementation
│   └── Game/              # Game initialization
├── Routes/                # Application screens
│   ├── GameScreen.tsx    # Main game interface
│   ├── Menu.tsx          # Main menu
│   └── Settings.tsx     # Settings panel
└── assets/               # Static assets
```

## Development Notes

### React Compiler
The React Compiler is not enabled due to performance considerations. To enable it, see the [React Compiler documentation](https://react.dev/learn/react-compiler/installation).

### ESLint Configuration
For production development, consider enabling type-aware lint rules by updating the ESLint configuration to include stricter TypeScript rules.

### Extending the Game
The ECS architecture makes it easy to extend the game:

1. **Add new components**: Define in `src/ECS/Core/Components/`
2. **Create new systems**: Implement in `src/ECS/Systems/`
3. **Define new objects**: Add to `ObjectDefinitions.ts` and `ObjectManager.ts`
4. **Add new commands**: Implement in `src/ECS/Commands/`
5. **Extend UI**: Modify React components in `src/Routes/`

### Future Vision: Player Entity Creation
A planned future feature will enable players to create their own entities directly in the game:

- **In-Game Entity Definition System**: Visual interface for creating new entity templates
- **Component-Based Crafting**: Select and combine existing components to create new items
- **Free-Form Creation**: Allow players to experiment with component combinations
- **Template Management**: Save, load, and share player-created entity definitions
- **Dynamic Instantiation**: Create instances of player-defined objects during gameplay

This system will enable:
- **Free Crafting Mechanics**: Combine components to create unique items
- **Player-Driven Content**: Community-created objects and templates
- **Emergent Gameplay**: Unexpected combinations and interactions
- **Modding Without Code**: In-game content creation tools

### Performance Considerations
- Component registry uses Maps for O(1) component access
- Entity IDs are sequential integers for efficient storage
- Systems process only entities with required components
- Console messages are stored in localStorage with size limits
