import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ComponentRegistry } from '../ECS/Registry';
import { GameInitializer } from '../ECS/GameInitializer';
import { InputSystem } from '../ECS/InputSystem';
import { useGameConsole } from './GameConsoleContext';
import type { Entity } from '../ECS/Components';

interface ECSContextType {
    registry: ComponentRegistry;
    player: Entity;
    inputSystem: InputSystem;
}

const ECSContext = createContext<ECSContextType | null>(null);

interface ECSProviderProps {
    children: ReactNode;
}

export const ECSProvider: React.FC<ECSProviderProps> = ({ children }) => {
    const { addMessage, clearMessages } = useGameConsole();
    const [isInitialized, setIsInitialized] = useState(false);
    const registryRef = useRef<ComponentRegistry | null>(null);
    const playerRef = useRef<Entity | null>(null);
    const inputSystemRef = useRef<InputSystem | null>(null);
    const addMessageRef = useRef(addMessage);

    // Update the ref when addMessage changes
    useEffect(() => {
        addMessageRef.current = addMessage;
    }, [addMessage]);

    // Initialize game on mount - only run once
    useEffect(() => {
        if (!registryRef.current) {
            clearMessages();
            registryRef.current = new ComponentRegistry();
            const initializer = new GameInitializer(registryRef.current, { addMessage: addMessageRef.current });
            playerRef.current = initializer.initializeGame();
            inputSystemRef.current = new InputSystem(registryRef.current, playerRef.current);
            setIsInitialized(true);
        }
    }, []); // Empty dependency array - only run once

    // Always compute context value, but handle null case gracefully
    const contextValue = React.useMemo(() => {
        if (!registryRef.current || !playerRef.current || !inputSystemRef.current) {
            return null;
        }
        
        return {
            registry: registryRef.current,
            player: playerRef.current,
            inputSystem: inputSystemRef.current
        };
    }, [isInitialized]); // Depend on initialization state

    // Show loading state if not initialized
    if (!isInitialized || !contextValue) {
        console.log('🔄 Still loading...', { isInitialized, hasRegistry: !!registryRef.current, hasPlayer: !!playerRef.current, hasInputSystem: !!inputSystemRef.current });
        return <div>Loading game... Initializing ECS system...</div>;
    }

    return (
        <ECSContext.Provider value={contextValue}>
            {children}
        </ECSContext.Provider>
    );
};

export const useECS = (): ECSContextType => {
    const context = useContext(ECSContext);
    if (context === null) {
        throw new Error('useECS must be used within an ECSProvider');
    }
    return context;
};
