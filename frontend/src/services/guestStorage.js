const GUEST_KEY = 'guest_expenses';

// Read guest data
function readAll() {
    try {
        const raw = localStorage.getItem(GUEST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (err) {
        console.error('Failed to read guest expenses:', err);
        return [];
    }
}
// Write guest data from local storage
function writeAll(list) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(list));
}

export const guestExpenseService = {
    getAll: () => readAll(),

    create: (data) => {
        const list = readAll();
        const record = {
            ...data,
            id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
        };
        list.unshift(record);
        writeAll(list);
        return record;
    },

    update: (id, data) => {
        const list = readAll();
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) return null;
        list[idx] = { ...list[idx], ...data };
        writeAll(list);
        return list[idx];
    },

    delete: (id) => {
        const list = readAll().filter((item) => item.id !== id);
        writeAll(list);
    },

    clear: () => localStorage.removeItem(GUEST_KEY),

    hasData: () => readAll().length > 0,
};

// Guest settings

const GUEST_SETTINGS_KEY = 'guest_settings';
const PENDING_SYNC_KEY = 'guest_settings_pending_sync';

const DEFAULT_GUEST_SETTINGS = {
    name: 'GUEST',
    categories: ['Food', 'Transport', 'Shopping', 'Entertainment'],
    currency: 'TWD',
    stats_start_date: '',
};

export const guestUserService = {
    getInfo: () => {
        try {
            const raw = localStorage.getItem(GUEST_SETTINGS_KEY);
            return raw ? JSON.parse(raw) : { ...DEFAULT_GUEST_SETTINGS };
        } catch (err) {
            console.error('Failed to read guest settings:', err);
            return { ...DEFAULT_GUEST_SETTINGS };
        }
    },

    update: (data, isPending = false) => {
        localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(data));
        if (isPending) {
            localStorage.setItem(PENDING_SYNC_KEY, 'true');
        }
        return data;
    },

    hasData: () => localStorage.getItem(GUEST_SETTINGS_KEY) !== null,
    clear: () => localStorage.removeItem(GUEST_SETTINGS_KEY),

    hasPendingSync: () => localStorage.getItem(PENDING_SYNC_KEY) === 'true',
    clearPendingSync: () => localStorage.removeItem(PENDING_SYNC_KEY),
};