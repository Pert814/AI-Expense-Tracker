// Read guest data
const GUEST_KEY = 'guest_expenses';

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

// Guest settings in CONFIG

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


// ===== 以下是「登入使用者」的本機資料快取（跟訪客資料分開，避免混在一起）=====

function cacheKey(userId) {
    return `cached_expenses:${userId}`;
}

export const expenseCacheService = {
    // 讀取某個使用者的本機快取資料，沒有快取過就回傳 null
    get: (userId) => {
        try {
            const raw = localStorage.getItem(cacheKey(userId));
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error('Failed to read expense cache:', err);
            return null;
        }
    },

    // 把雲端抓到的最新資料，存一份鏡子到本機
    set: (userId, data) => {
        try {
            localStorage.setItem(cacheKey(userId), JSON.stringify(data));
        } catch (err) {
            console.error('Failed to write expense cache:', err);
        }
    },

    clear: (userId) => localStorage.removeItem(cacheKey(userId)),
};