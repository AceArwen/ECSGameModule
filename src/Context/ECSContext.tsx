import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ComponentRegistry, EntityManager } from '../ECS/Core';
import { GameInitializer } from '../ECS/Game';
import { InputSystem, InventorySystem, UsableSystem } from '../ECS/Systems';
import { ObjectManager } from '../ECS/Data';
import { useGameConsole } from './GameConsoleContext';
import type { Entity } from '../ECS/Core';

interface ECSContextType {
    registry: ComponentRegistry;
    player: Entity;
    chest: Entity;
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
    const chestRef = useRef<Entity | null>(null);
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
            const entityManager = new EntityManager();
            const objectManager = new ObjectManager(registryRef.current, entityManager);
            const inventorySystem = new InventorySystem(registryRef.current, entityManager);
            const usableSystem = new UsableSystem(registryRef.current, inventorySystem);
            const initializer = new GameInitializer(entityManager, objectManager, inventorySystem, { addMessage: addMessageRef.current });
            const { player, chest } = initializer.initializeGame();
            playerRef.current = player;
            chestRef.current = chest;
            inputSystemRef.current = new InputSystem(registryRef.current, inventorySystem, usableSystem, playerRef.current, chestRef.current);
            setIsInitialized(true);
        }
    }, []); // Empty dependency array - only run once

    // Always compute context value, but handle null case gracefully
    const contextValue = React.useMemo(() => {
        if (!registryRef.current || !playerRef.current || !chestRef.current || !inputSystemRef.current) {
            return null;
        }
        
        return {
            registry: registryRef.current,
            player: playerRef.current,
            chest: chestRef.current,
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
