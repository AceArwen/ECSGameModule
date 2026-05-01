// Command descriptor interface for game actions
export interface CommandDescriptor {
    type: 'addMessage' | 'clearConsole' | 'noop';
    message?: string;
    isPlayer?: boolean;
}

// Command interface for game actions
export interface GameCommand {
    execute(): void;
    getDescription(): string;
}

// Console commands
export class ClearConsoleCommand implements GameCommand {
    constructor(private clearMessages: () => void) {}

    execute(): void {
        this.clearMessages();
    }

    getDescription(): string {
        return '🧹 Console cleared';
    }
}

export class AddMessageCommand implements GameCommand {
    constructor(
        private addMessage: (message: {text: string, isPlayer: boolean}) => void,
        private message: string,
        private isPlayer: boolean = false
    ) {}

    execute(): void {
        this.addMessage({ text: this.message, isPlayer: this.isPlayer });
    }

    getDescription(): string {
        return this.message;
    }
}

// Factory to create commands from descriptors
export class CommandFactory {
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

// No-op command for cases where no action is needed
export class NoOpCommand implements GameCommand {
    constructor(private message: string) {}

    execute(): void {
        // No action
    }

    getDescription(): string {
        return this.message;
    }
}
