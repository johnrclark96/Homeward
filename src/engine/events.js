// Pub/sub event bus. Architecture doc §6.

const listeners = {};

export function on(event, callback) {
    (listeners[event] ||= []).push(callback);
    return () => off(event, callback);
}

export function off(event, callback) {
    listeners[event] = (listeners[event] || []).filter(cb => cb !== callback);
}

export function emit(event, ...args) {
    (listeners[event] || []).forEach(cb => cb(...args));
}
