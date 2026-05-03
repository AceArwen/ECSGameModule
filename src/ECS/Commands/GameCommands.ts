/**
 * Base interface for all game commands.
 * Defines the contract for command execution.
 */
export interface GameCommand {
    /**
     * Executes the command action.
     */
    execute(): void;
    
    /**
     * Gets a human-readable description of the command.
     * 
     * @returns {string} Command description
     */
    getDescription(): string;
}

/**
 * No-operation command.
 * Used when no action is needed but a command object is required.
 */
export class NoOpCommand implements GameCommand {
    /**
     * Creates a no-op command.
     * 
     * @param {string} message - Description message to display
     */
    constructor(private message: string) {}

    /**
     * Executes no action.
     */
    execute(): void {
        // No action
    }

    /**
     * Gets the command description.
     * 
     * @returns {string} The message provided during construction
     */
    getDescription(): string {
        return this.message;
    }
}
