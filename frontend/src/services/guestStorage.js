// this is for guestmode to store data in localStorage
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

function writeAll(list) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(list));
}

export const guestExpenseService = {
    getAll: () => readAll(),

    create: (data) => {
        const list = readAll();
        const record = {
            ...data,
            id: `guest_${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        list.unshift(record);
        writeAll(list);
        return record;
    },
    clear: () => localStorage.removeItem(GUEST_KEY),
    
};