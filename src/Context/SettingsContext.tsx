import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface TextSettings {
    textSize: string;
    textWeight: string;
    gameTextColor: string;
    playerTextColor: string;
}

interface SettingsContextType {
    textSettings: TextSettings;
    setTextSize: (size: string) => void;
    setTextWeight: (weight: string) => void;
    setGameTextColor: (color: string) => void;
    setPlayerTextColor: (color: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [textSize, setTextSize] = useState('18');
    const [textWeight, setTextWeight] = useState('normal');
    const [gameTextColor, setGameTextColor] = useState('#62d5a3');
    const [playerTextColor, setPlayerTextColor] = useState('#ffffff');

    const textSettings: TextSettings = {
        textSize,
        textWeight,
        gameTextColor,
        playerTextColor
    };

    return (
        <SettingsContext.Provider value={{
            textSettings,
            setTextSize,
            setTextWeight,
            setGameTextColor,
            setPlayerTextColor
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
