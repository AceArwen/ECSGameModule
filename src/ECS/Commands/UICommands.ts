import type { GameCommand } from "./GameCommands";

/**
 * Command to clear the console messages.
 * Implements UI cleanup functionality.
 */
export class ClearConsoleCommand implements GameCommand {
    /**
     * Creates a clear console command.
     * 
     * @param {() => void} clearMessages - Function to clear console messages
     */
    constructor(private clearMessages: () => void) {}

    /**
     * Executes the console clearing action.
     */
    execute(): void {
        this.clearMessages();
    }

    /**
     * Gets the command description.
     * 
     * @returns {string} Description indicating console was cleared
     */
    getDescription(): string {
        return '🧹 Console cleared';
    }
}

/**
 * Command to add a message to the console.
 * Handles both player and system messages.
 */
export class AddMessageCommand implements GameCommand {
    /**
     * Creates an add message command.
     * 
     * @param {(message: {text: string, isPlayer: boolean}) => void} addMessage - Function to add message
     * @param {string} message - Message text to display
     * @param {boolean} [isPlayer=false] - Whether this is a player message
     */
    constructor(
        private addMessage: (message: {text: string, isPlayer: boolean}) => void,
        private message: string,
        private isPlayer: boolean = false
    ) {}

    /**
     * Executes the message addition action.
     */
    execute(): void {
        this.addMessage({ text: this.message, isPlayer: this.isPlayer });
    }

    /**
     * Gets the command description.
     * 
     * @returns {string} The message text
     */
    getDescription(): string {
        return this.message;
    }
}

/**
 * Command descriptor for UI actions.
 * Defines the structure for command creation from user input.
 */
export interface CommandDescriptor {
    /** Type of command to create */
    type: 'addMessage' | 'clearConsole' | 'noop';
    /** Optional message text for addMessage commands */
    message?: string;
    /** Whether the message is from a player (for addMessage commands) */
    isPlayer?: boolean;
}
