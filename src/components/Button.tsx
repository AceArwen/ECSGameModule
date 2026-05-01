import styles from '../styles/Button.module.css';

interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

export default function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
    return (
        <button onClick={onClick} className={`${styles.button} ${styles[variant]}`}>
            {children}
        </button>
    );
}
