import { ComponentRegistry } from './Registry';

export interface GameConsole {
    addMessage: (message: {text: string, isPlayer: boolean}) => void;
}

export class GameInitializer {
    constructor(
        private registry: ComponentRegistry,
        private console?: GameConsole
    ) {}

    private log(message: string) {
        if (this.console) {
            this.console.addMessage({ text: message, isPlayer: false });
        } else {
            // Fallback to browser console if no game console provided
            console.log(message);
        }
    }

    initializeGame() {
        // Initialize all object definitions using the proper method
        this.registry.objectManager.initializeObjectDefinitions();
        
        // Create player instance
        const player = this.registry.objectManager.createPlayerInstance();
        
        // Create some test entities
        const chest = this.registry.objectManager.createChestInstance();
        
        // Log to game console instead of browser console
        this.log('🎮 Game initialized!');
        this.log(`Player ID: ${player}`);
        this.log(`Chest ID: ${chest}`);
        this.log('Press "I" to open inventory');
        
        return player;
    }
}
