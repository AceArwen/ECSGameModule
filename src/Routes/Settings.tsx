import { useNavigate } from "react-router-dom";
import { useSettings } from '../Context/SettingsContext';
import styles from '../styles/Settings.module.css';
import gameStyles from '../styles/GameScreen.module.css';
import Button from '../components/Button';

export default function Settings() {
    const navigate = useNavigate();
    const { textSettings, setTextSize, setTextWeight, setGameTextColor, setPlayerTextColor } = useSettings();

    const getGameDisplay = () => {
        return `Game - Size: ${textSettings.textSize}px, Weight: ${textSettings.textWeight}, Color: ${textSettings.gameTextColor}`;
    };

    const getPlayerDisplay = () => {
        return `Player - Size: ${textSettings.textSize}px, Weight: ${textSettings.textWeight}, Color: ${textSettings.playerTextColor}`;
    };

    return (
        <div>
            <h1>Settings</h1>
            <Button onClick={() => navigate("/gamescreen")}>Back to Game</Button>
            
            <div className={`${gameStyles.consoleContainer} ${styles.consoleContainerOverride}`}>
                <div className={`${gameStyles.consoleContent} ${styles.consoleContentOverride}`}
                     style={{ 
                        fontSize: `${textSettings.textSize}px`, 
                        fontWeight: textSettings.textWeight
                    }}>
                    <div style={{ color: textSettings.gameTextColor }}>
                        {getGameDisplay()}
                    </div>
                    <div style={{ color: textSettings.playerTextColor }}>
                        {getPlayerDisplay()}
                    </div>
                </div>
            </div>

            <div className={styles.settingsControls}>
                <div className={styles.controlGroup}>
                    <label>Text Size (px):</label>
                    <input
                        type="number"
                        value={textSettings.textSize}
                        onChange={(e) => {
                            const value = e.target.value;
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                                setTextSize(value);
                            }
                        }}
                        onBlur={(e) => {
                            const value = e.target.value;
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                                const cappedValue = Math.max(10, Math.min(30, numValue));
                                setTextSize(cappedValue.toString());
                            }
                        }}
                        min="10"
                        max="30"
                    />
                </div>

                <div className={styles.controlGroup}>
                    <label>Text Weight:</label>
                    <select value={textSettings.textWeight} onChange={(e) => setTextWeight(e.target.value)}>
                        <option value="lighter">Lighter</option>
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                    </select>
                </div>

                <div className={styles.controlGroup}>
                    <label>Game Text Color:</label>
                    <input
                        type="color"
                        value={textSettings.gameTextColor}
                        onChange={(e) => setGameTextColor(e.target.value)}
                    />
                </div>

                <div className={styles.controlGroup}>
                    <label>Player Text Color:</label>
                    <input
                        type="color"
                        value={textSettings.playerTextColor}
                        onChange={(e) => setPlayerTextColor(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}