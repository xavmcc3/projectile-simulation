//#region Vector
class Vector {
    x; y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    setMagnitude(magnitude) {
        const direction = this.direction;

        this.x = Math.cos(direction) * magnitude;
        this.y = Math.sin(direction) * magnitude;
        return this;
    }

    setDirection(direction) {
        const magnitude = this.magnitude;

        this.x = Math.cos(direction) * magnitude;
        this.y = Math.sin(direction) * magnitude;
        return this;
    }

    get magnitude() {
        return Math.sqrt((this.x ** 2) + (this.y ** 2));
    }

    get direction() {
        return Math.atan2(this.y, this.x);
    }

    get normal() {
        return this.copy.setMagnitude(1);
    }

    get copy() {
        return new Vector(this.x, this.y);
    }

    get arr() {
        return [ this.x, this.y ];
    }

    
    static get zero() {
        return new Vector(0, 0);
    }

    static get one() {
        return new Vector(1, 1);
    }

    static dot(a, b) {
        return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    }
}
//#endregion

//#region Random
class Random {
    static get random() {
        return Math.random();
    }

    static range(min, max) {
        return Math.floor(Random.random * (max-min+1) + min);
    }

    static rangeFloat(min, max) {
        return Random.random * (max-min+1) + min;
    }
}
//#endregion

//#region Process
class Process {
    frames = 0;
    constructor(callback, steps) {
        this.callback = callback;
        this.steps = steps ?? Infinity;

        this.startFrame = Systems.frame ?? 0;
    }

    tick() {
        this.callback(this.frames);

        this.steps -= 1;
        if(this.steps == Infinity) {
            this.frames = Systems.frame - this.startFrame;
            return;
        }

        this.frames++;
    }
}
//#endregion

//#region Entity
class Entity {
    processes = [];
    remove = false;
    _x; _y;
    constructor(x, y) {
        this._x = x ?? 0,
        this._y = y ?? 0;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }


    destroy() {
        this.remove = true
        this.onDestroy();
    }

    addProcess(process) {
        this.processes.push(process);
    }
    tick() {
        for(let i = this.processes.length - 1; i >= 0; i--) {
            const process = this.processes[i];
            process.tick();

            if(process.steps > 0) continue;
            this.processes.splice(i, 1);
        }
        
        this.onUpdate();
    }


    onStart() {}
    onUpdate() {}
    onDraw() {}
    onDestroy() {}
}
//#endregion

//#region Draw
class Draw {
    static ctx;
    static viewport = {
        width: 1200,
        height: 700
    }
    static canvas = (() => {
        const canvas =  document.querySelector('canvas') ?? (() => {
            const canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
            return canvas;
        })();
        this.ctx = canvas.getContext('2d');

        canvas.width = this.viewport.width;
        canvas.height = this.viewport.height;

        return canvas;
    })();

    static clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }


    static drawQueue = [];
    static draw(func) {
        this.drawQueue.push(func);
    }

    static tick() {
        for(let i = this.drawQueue.length - 1; i >= 0; i--) {
            const func = this.drawQueue[i];
            func();

            this.drawQueue.splice(i, 1);
        }
    }
}

Object.freeze(Draw.viewport);
//#endregion

//#region Systems
class Systems {
    static processes = [];
    static entities = [];
    static frame;

    static instantiate(entity) {
        this.entities.push(entity);
        entity.onStart();

        return entity;
    }

    static addProcess(process) {
        this.processes.push(process);
    }

    
    static start(callback) {
        callback = callback ?? (() => {});
        callback();

        this.update();
    }
    
    static update() {
        Systems.frame = requestAnimationFrame(Systems.update);

        Systems.entities.forEach(entity => entity.tick());
        for(let i = Systems.entities.length - 1; i >= 0; i--) {
            const entity = Systems.entities[i];

            if(!entity.remove) continue;
            Systems.entities.splice(i, 1);
        }

        for(let i = Systems.processes.length - 1; i >= 0; i--) {
            const process = Systems.processes[i];
            process.tick();

            if(process.steps > 0) continue;
            Systems.processes.splice(i, 1);
        }
        
        Draw.clear();
        Systems.entities.forEach(entity => entity.onDraw());
        Draw.tick();
    }
}
//#endregion
