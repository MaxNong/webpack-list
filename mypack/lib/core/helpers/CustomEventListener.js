class CustomEventListener {
    constructor() {
        this.handle = {};
    }
    on(eventName, cb, target) {
        if (!this.handle[eventName]) {
            this.handle[eventName] = [];
        }

        const data = { func: cb, target };
        this.handle[eventName].push(data);
    }

    off(eventName, cb, target) {
        const list = this.handle[eventName];
        if (!list || list.length <= 0) {
            return;
        }

        for (let i = 0; i < list.length; i++) {
            const event = list[i];
            if (event.func === cb && (!target || target === event.target)) {
                list.splice(i, 1);
                break;
            }
        }
    }

    dispatchEvent(eventName, ...args) {
        const list = this.handle[eventName];
        if (!list || list.length <= 0) {
            return;
        }

        for (let i = 0; i < list.length; i++) {
            const event = list[i];
            event.func.apply(event.target, args);
        }
    }
}

module.exports = {
    CustomEventListener
}