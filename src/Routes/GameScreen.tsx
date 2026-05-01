import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSettings } from '../Context/SettingsContext';
import styles from '../styles/GameScreen.module.css';
import Button from '../components/Button';

export default function GameScreen() {
    const navigate = useNavigate();
    const { textSettings } = useSettings();
    
    // Load console messages from localStorage on mount
    const [consoleMessages, setConsoleMessages] = useState<Array<{text: string, isPlayer: boolean}>>(() => {
        const saved = localStorage.getItem('consoleMessages');
        return saved ? JSON.parse(saved) : [];
    });

    const [inputValue, setInputValue] = useState('');
    const consoleContentRef = useRef<HTMLDivElement>(null);

    // Save console messages to localStorage whenever they change
    const addConsoleMessage = (message: {text: string, isPlayer: boolean}) => {
        setConsoleMessages(prev => {
            const newMessages = [...prev, message];
            localStorage.setItem('consoleMessages', JSON.stringify(newMessages));
            return newMessages;
        });
    };

    useEffect(() => {
        if (consoleContentRef.current) {
            consoleContentRef.current.scrollTop = consoleContentRef.current.scrollHeight;
        }
    }, [consoleMessages]);

    const handleConsoleSubmit = () => {
        addConsoleMessage({ text: inputValue, isPlayer: true });
        setInputValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConsoleSubmit();
        } else if (e.key === 'g' || e.key === 'G') {
            addConsoleMessage({ text: 'I am the Game Overlord, who is summoning me?', isPlayer: false });
        }
    };

    return (
        <div >
            <h1>Game Screen</h1>
            <Button onClick={() => navigate("/")} >Back to Menu</Button>
            <Button onClick={() => navigate("/settings")}>Settings</Button>

            <div className={styles.consoleContainer}>
                <div ref={consoleContentRef} className={styles.consoleContent}>
                    {consoleMessages.map((message, index) => (
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