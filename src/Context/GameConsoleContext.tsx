import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ConsoleMessage {
    text: string;
    isPlayer: boolean;
}

interface GameConsoleContextType {
    messages: ConsoleMessage[];
    addMessage: (message: {text: string, isPlayer: boolean}) => void;
    clearMessages: () => void;
}

const GameConsoleContext = createContext<GameConsoleContextType | undefined>(undefined);

interface GameConsoleProviderProps {
    children: ReactNode;
}

export const GameConsoleProvider: React.FC<GameConsoleProviderProps> = ({ children }) => {
    const [messages, setMessages] = useState<ConsoleMessage[]>(() => {
        const saved = localStorage.getItem('gameConsoleMessages');
        return saved ? JSON.parse(saved) : [];
    });

    const addMessage = (message: {text: string, isPlayer: boolean}) => {
        setMessages(prev => {
            const newMessages = [...prev, message];
            localStorage.setItem('gameConsoleMessages', JSON.stringify(newMessages));
            return newMessages;
        });
    };

    const clearMessages = () => {
        setMessages([]);
        localStorage.removeItem('gameConsoleMessages');
    };

    return (
        <GameConsoleContext.Provider value={{ messages, addMessage, clearMessages }}>
            {children}
        </GameConsoleContext.Provider>
    );
};

export const useGameConsole = (): GameConsoleContextType => {
    const context = useContext(GameConsoleContext);
    if (context === undefined) {
        throw new Error('useGameConsole must be used within a GameConsoleProvider');
    }
    return context;
};
