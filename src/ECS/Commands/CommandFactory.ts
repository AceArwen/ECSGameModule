import type { GameCommand } from "./GameCommands";
import { ClearConsoleCommand, AddMessageCommand, type CommandDescriptor } from "./UICommands";
import { NoOpCommand } from "./GameCommands";

/**
 * Factory class for creating game commands from descriptors.
 * Handles the conversion of command descriptors into executable command objects.
 */
export class CommandFactory {
    /**
     * Creates command objects from command descriptors.
     * 
     * @param {CommandDescriptor[]} descriptors - Array of command descriptors
     * @param {(message: {text: string, isPlayer: boolean}) => void} addMessage - Function to add messages to console
     * @param {() => void} clearMessages - Function to clear console messages
     * 
     * @returns {GameCommand[]} Array of executable command objects
     * 
     * @throws {Error} If unknown command type is encountered
     * 
     * @example
     * ```typescript
     * const descriptors = [
     *   { type: 'addMessage', message: 'Hello', isPlayer: true },
     *   { type: 'clearConsole' }
     * ];
     * const commands = CommandFactory.createCommands(
     *   descriptors, addMessage, clearMessages
     * );
     * ```
     */
    static createCommands(
        descriptors: CommandDescriptor[], 
        addMessage: (message: {text: string, isPlayer: boolean}) => void,
        clearMessages: () => void
    ): GameCommand[] {
        return descriptors.map(descriptor => {
            switch (descriptor.type) {
                case 'addMessage':
                    return new AddMessageCommand(addMessage, descriptor.message || '', descriptor.isPlayer || false);
                case 'clearConsole':
                    return new ClearConsoleCommand(clearMessages);
                case 'noop':
                    return new NoOpCommand(descriptor.message || '');
                default:
                    throw new Error(`Unknown command type: ${(descriptor as any).type}`);
            }
        });
    }
}
