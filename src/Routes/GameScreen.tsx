import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSettings } from '../Context/SettingsContext';
import { useECS } from '../Context/ECSContext';
import { useGameConsole } from '../Context/GameConsoleContext';
import { CommandFactory } from '../ECS/Commands';
import styles from '../styles/GameScreen.module.css';
import Button from '../components/Button';

export default function GameScreen() {
    const navigate = useNavigate();
    const { textSettings } = useSettings();
    const { registry, player, inputSystem } = useECS();
    const { messages, addMessage, clearMessages } = useGameConsole();
    
    const [inputValue, setInputValue] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    const consoleContentRef = useRef<HTMLDivElement>(null);

    // Extract command history from existing console messages (chronological order, with duplicates)
    const getCommandHistory = () => {
        return messages
            .filter(msg => msg.isPlayer)
            .map(msg => msg.text);
    };

    useEffect(() => {
        if (consoleContentRef.current) {
            consoleContentRef.current.scrollTop = consoleContentRef.current.scrollHeight;
        }
    }, [messages]);

    const handleConsoleSubmit = () => {
        if (inputValue.trim() === '') return;
        
        // Add player's command to console (this automatically adds to history via localStorage)
        addMessage({ text: inputValue, isPlayer: true });
        
        // Process the command through InputSystem - returns command descriptors
        const commandDescriptors = inputSystem.processCommand(inputValue);
        
        // Create actual commands from descriptors using CommandFactory
        const commands = CommandFactory.createCommands(
            commandDescriptors, 
            addMessage, 
            clearMessages
        );
        
        // Execute all commands
        commands.forEach(command => {
            command.execute();
        });
        
        // Reset input and history index
        setInputValue('');
        setHistoryIndex(-1);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConsoleSubmit();
            return;
        }
        
        // Handle arrow key navigation for command history
        const commandHistory = getCommandHistory();
        
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;
            
            const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex <= 0) {
                setHistoryIndex(-1);
                setInputValue('');
                return;
            }
            
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
        } else if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
            // Reset history index when typing new characters
            setHistoryIndex(-1);
        }
    };

    return (
        <div >
            <h1>Game Screen</h1>
            <Button onClick={() => navigate("/")} >Back to Menu</Button>
            <Button onClick={() => navigate("/settings")}>Settings</Button>

            <div className={styles.consoleContainer}>
                <div ref={consoleContentRef} className={styles.consoleContent}>
                    {messages.map((message, index) => (
                        <div key={index} className={styles.consoleMessage}>
                            <span className={styles.consolePrefix} style={{
                                fontSize: `${textSettings.textSize}px`,
                                fontWeight: textSettings.textWeight,
                                color: message.isPlayer ? textSettings.playerTextColor : textSettings.gameTextColor
                            }}>&gt;</span>
                            <span className={styles.consoleMessageText} style={{
                                fontSize: `${textSettings.textSize}px`,
                                fontWeight: textSettings.textWeight,
                                color: message.isPlayer ? textSettings.playerTextColor : textSettings.gameTextColor
                            }}>{message.text}</span>
                        </div>
                    ))}
                    <div className={styles.consoleInputContainer}>
                        <span className={styles.consolePrefix} style={{
                                fontSize: `${textSettings.textSize}px`,
                                fontWeight: textSettings.textWeight,
                                color: textSettings.playerTextColor
                            }}>&gt;</span>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder=""
                            className={styles.consoleInput}
                            style={{
                                fontSize: `${textSettings.textSize}px`,
                                fontWeight: textSettings.textWeight,
                                color: textSettings.playerTextColor
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}