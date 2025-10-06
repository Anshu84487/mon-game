// --- Game State (The Value inside the Monad) ---
let currentState = 100;
let isGameOver = false;

// --- Utility Functions ---

const log = (message, isError = false) => {
    const logElement = document.getElementById('log');
    const span = document.createElement('span');
    span.innerHTML = message + '<br>';
    if (isError) {
        span.className = 'step-failure';
    } else if (message.includes("Success")) {
        span.className = 'step-success';
    } else {
        span.className = 'step-info';
    }
    logElement.appendChild(span);
    logElement.scrollTop = logElement.scrollHeight;
};

const updateDisplay = () => {
    document.getElementById('healthDisplay').textContent = currentState;
    document.getElementById('gameOverMessage').style.display = isGameOver ? 'block' : 'none';
    
    // Disable buttons if game is over
    document.querySelectorAll('.actions button').forEach(btn => {
        btn.disabled = isGameOver;
    });
};

const resetGame = () => {
    currentState = 100;
    isGameOver = false;
    document.getElementById('log').innerHTML = '';
    log("--- Game Reset. Initial Health: 100 ---", false);
    updateDisplay();
};

// --- 📦 The Maybe Monad Class 📦 ---

class Maybe {
    /**
     * The Monad Box for the game State (Health).
     * If the value is <= 0, it's considered a Monadic failure (null/Nothing).
     */
    constructor(value) {
        // If Health is 0 or less, we treat it as a Monadic failure.
        this._value = (value !== null && value !== undefined && value > 0) ? value : null;
    }

    // 1. UNIT/RETURN: Lifts a normal value into the Monad Box.
    static unit(value) {
        return new Maybe(value);
    }

    // 2. BIND (flatMap): The core chaining operation.
    // It runs the next function ONLY if the current value is NOT a failure (null).
    bind(func) {
        if (this._value === null) {
            // ❌ FAILURE (Snake): Return the current failed box, skipping 
            // the next function call. This maintains the 'Game Over' state.
            return this; 
        }
        
        // ✅ SUCCESS (Ladder): Pass the value to the next function.
        // The next function 'func' (our step) must also return a Monad Box.
        return func(this._value);
    }

    // A helper to retrieve the final result
    getValue() {
        return this._value;
    }
}

// --- 🪜 Architecture Steps (Executor Functions) 🐍 ---

/**
 * All commands go through these steps, simulating the flow:
 * 1. Impl Executor calculates new state (Pure Function).
 * 2. The Monad checks for failure (bind operation).
 * 3. Side effects (logging/display update) are done by the Driver (executeCommand).
 * @param {number} currentHealth
 * @param {number} damageOrHealAmount
 * @param {string} commandName
 * @returns {Maybe} A new Monad box with the calculated health.
 */
const executor_calculate_new_state = (currentHealth, damageOrHealAmount, commandName) => {
    log(`   (Executor) Calculating ${commandName}: ${currentHealth} ${damageOrHealAmount > 0 ? '+' : ''}${damageOrHealAmount}`);
    
    const newHealth = currentHealth + damageOrHealAmount;
    
    if (newHealth <= 0) {
        log(`   (Executor) New Health is ${newHealth}. **FATAL ERROR!**`, true);
        // Returning a Monad box that holds a failure state (null)
        return Maybe.unit(0); 
    }
    
    log(`   (Executor) Success: New Health is ${newHealth}.`, false);
    // Returning a Monad box that holds the successful new state
    return Maybe.unit(newHealth);
};


// --- 🚀 Game Loop / The Driver Execution 🚀 ---

/**
 * This acts as the DRIVER, managing the Monad Chain and handling side effects (display/log).
 * @param {string} command
 */
const executeCommand = (command) => {
    if (isGameOver) {
        log("🛑 GAME OVER. Please reset to continue.", true);
        return;
    }

    let amount = 0;
    switch (command) {
        case 'Heal': amount = 15; break;
        case 'Minor_Attack': amount = -20; break;
        case 'Major_Attack': amount = -50; break;
        case 'Critical_Attack': amount = -101; break;
        default: return;
    }

    log(`\n--- DRIVER: Executing Command: ${command} (Health: ${currentState}) ---`, false);

    // 1. DRIVER: Lifts the current state into the Monad Box.
    const initialMonad = Maybe.unit(currentState);

    // 2. DRIVER: Uses BIND to call the pure Executor function.
    // The BIND operation automatically handles the failure check (Health <= 0).
    const finalMonad = initialMonad.bind(health => 
        executor_calculate_new_state(health, amount, command)
    );

    // 3. DRIVER: Retrieves the final state and performs SIDE EFFECTS (like updating the display).
    const finalHealth = finalMonad.getValue();

    if (finalHealth === null) {
        // Monad failure detected (Health <= 0)
        currentState = 0;
        isGameOver = true;
        log("💥 MONAD CHAIN BROKEN! Game Over.", true);
    } else {
        // Monad success
        currentState = finalHealth;
        log(`✅ DRIVER: Command success. State updated to ${currentState}.`);
    }

    updateDisplay();
};

// Initialize the game when the script loads
document.addEventListener('DOMContentLoaded', resetGame);
