# ECS Game Module

A React + TypeScript game application built with a custom Entity Component System (ECS) architecture. This modular game framework provides a foundation for building text-based games with flexible object management.

## Features

### ECS Architecture
- **Entity Component System**: Custom implementation for efficient game object management
- **Component Registry**: Type-safe component storage and retrieval system
- **Object Definitions**: Template-based object instantiation system
- **Inventory Management**: Built-in inventory and slot management components

### Game Interface
- **Console-style Game Screen**: Interactive text-based gameplay interface
- **Persistent Console Messages**: Messages saved to localStorage across sessions
- **Customizable Text Settings**: Adjustable text size, weight, and colors
- **Keyboard Shortcuts**: Quick commands for enhanced gameplay

### Application Structure
- **Menu System**: Main navigation hub
- **Game Screen**: Primary gameplay interface
- **Settings Panel**: Customizable user preferences
- **Context-based State Management**: React Context for global settings

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

### Components
The ECS system includes several core component types:

- **ObjectDefinitionComponent**: Links entities to object type definitions
- **ObjectInstanceComponent**: Connects instances to their base definitions
- **DescriptionComponent**: Stores name and description data
- **InventoryComponent**: Manages entity inventories with slots
- **StackableComponent**: Handles item stacking mechanics
- **UsableTagComponent** & **ConsummableTagComponent**: Item behavior tags

### Entity Management
- Create entities using `createEntity()`
- Define object templates with `markAsDefinition()`
- Instantiate objects from definitions with `createObjectInstance()`
- Clean entity removal with automatic cleanup of linked entities

## Game Controls

### Keyboard Shortcuts
- **Enter**: Submit console command
- **G**: Trigger Game Overlord response

### Navigation
- Use the menu buttons to navigate between screens
- Access settings to customize text appearance
- Console messages persist across sessions

## Development Notes

### React Compiler
The React Compiler is not enabled due to performance considerations. To enable it, see the [React Compiler documentation](https://react.dev/learn/react-compiler/installation).

### ESLint Configuration
For production development, consider enabling type-aware lint rules by updating the ESLint configuration to include stricter TypeScript rules.
