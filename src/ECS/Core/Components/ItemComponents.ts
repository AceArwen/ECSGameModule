// Item components
export type StackableComponent = {
    maxStack: number;
};

export type WeaponComponent = {
    damage: number;
};

export type HealComponent = {
    amount: number;
};

export type HealthComponent = {
    health: number;
    maxHealth: number;
    onDeath?: () => void; // Optional callback for when health reaches 0
};
