const Teams = {
    A: 0x0001,
    B: 0x0002,
    C: 0x0004
}; Teams.getColor = (team) => {
    switch(team) {
        case Teams.A:
            return '#ff0000';

        case Teams.B:
            return '#00ccff';

        case Teams.C:
            return '#ffcc00';

        default:
            return '#000000';
    }
}; Object.freeze(Teams);

class Agent extends Entity {
    _acceleration = Vector.zero;
    _velocity = Vector.zero;
    _maxCooldown = 12;
    _team = Teams.A;
    _debug = false;
    _firingSpeed = 3;

    _dodgingForce = 7; // 3
    _dodgingRange = 20; // 20
    _isGod = false;
    _bullets = 1;

    _maxLife = 3;
    _cooldown;
    _target;
    _life;
    constructor(x, y) {
        super(x, y);
        this._life = this._maxLife;
    }

    onUpdate() {
        this.target();
        if(this._target != null) {
            const t = {
                x: this._target.x + (this._target._velocity.x * (Math.abs(this._target.x - this._x) / this._firingSpeed)), 
                y: this._target.y + (this._target._velocity.y * (Math.abs(this._target.y - this._y) / this._firingSpeed))
            };
            if(this._debug) {
                Draw.draw(() => {
                    Draw.ctx.strokeStyle = '#03a1fc';
                    Draw.ctx.lineWidth = 1;
                    Draw.ctx.beginPath();
                    Draw.ctx.arc(t.x, t.y, 20, 0, Math.PI*2);
                    Draw.ctx.stroke();
                });
            }

            this.seek(this._target, 1, 1);
            this.fire(t, this._firingSpeed);
        }

        Systems.entities.filter(entity => entity instanceof Agent && entity != this).forEach(agent => {
            this.avoid(agent, 2, 50, 0);
        });

        Systems.entities.filter(entity => entity instanceof Projectile && entity._team != this._team).forEach(projectile => {
            if(this.avoid(projectile, this._dodgingForce, this._dodgingRange, 0) < 7 + 3) {
               this.damage(1);
               projectile.destroy();
            }
        });


        // Update cooldown.
        this._cooldown -= 1;

        // Apply motion.
        this._velocity.x += this._acceleration.x;
        this._velocity.y += this._acceleration.y;

        this._velocity.setMagnitude(Math.min(this._velocity.magnitude, 3));
        this._acceleration = Vector.zero;

        this._x += this._velocity.x;
        this._y += this._velocity.y;

        // Keep in bounds.
        const r = 8;
        if(this._x < -r) this._x = Draw.viewport.width + r;
        if(this._y < -r) this._y = Draw.viewport.height + r;
        if(this._x > Draw.viewport.width + r) this._x = -r;
        if(this._y > Draw.viewport.height + r) this._y = -r;
        
        // if(this._x < 0 || this._x > 400) {
        //     this._x = this._x < 0 ? 0 : 400;
        //     this._velocity.x *= -1;
        // }
        // if(this._y < 0 || this._y > 300) {
        //     this._y = this._y < 0 ? 0 : 300;
        //     this._velocity.y *= -1;
        // }
    }

    onDraw() {
        Draw.ctx.fillStyle = Teams.getColor(this._team);
        Draw.ctx.beginPath();
        Draw.ctx.arc(this._x, this._y, 7, 0, Math.PI*2);
        Draw.ctx.fill();

        Draw.ctx.fillStyle = '#000000';
        for(let i = 0; i < this._life; i++) {
            const angle = 2*Math.PI/this._life * i + (Systems.frame / 70);
            Draw.ctx.beginPath();
            Draw.ctx.arc(
                this._x + Math.cos(angle) * 7, 
                this._y + Math.sin(angle) * 7, 
                3, 0, 
                Math.PI*2
                );
            Draw.ctx.fill();
        }


        if(!this._debug) return;
        Draw.ctx.strokeStyle = '#000000';
        Draw.ctx.lineWidth = 2;
        Draw.ctx.lineCap = 'round';
        Draw.ctx.beginPath();
        Draw.ctx.moveTo(this._x, this._y);
        Draw.ctx.lineTo(
            this._x + Math.cos(this._velocity.direction) * 10, 
            this._y + Math.sin(this._velocity.direction) * 10
            );
        Draw.ctx.stroke();
    }


    damage(amt) {
        this._life -= amt;
        if(this._life <= 0) {
            this.destroy();
        }
    }

    applyForce(force) {
        this._acceleration.x += force.x;
        this._acceleration.y += force.y;
    }

    seek(target, acceleration, speed) {
        const angle = Math.atan2(target.y - this._y, target.x - this._x);
        const distance = Math.sqrt((target.x - this._x) ** 2 + (target.y - this._y) ** 2);

        if(this._debug) {
            Draw.draw(() => {
                Draw.ctx.strokeStyle = '#00ff00';
                Draw.ctx.lineWidth = 1;
                Draw.ctx.beginPath();
                Draw.ctx.arc(target.x, target.y, 7, 0, Math.PI*2);
                Draw.ctx.stroke();
            });
        }


        const v = Vector.one;
        v.setDirection(angle);
        v.setMagnitude(Math.min(acceleration, distance));
        
        // Get the velocity in the target direction
        // (Get the dot product of the target and the velocity)
        const dot = Vector.dot(v.normal.arr, this._velocity.normal.arr);
        this.applyForce(dot < 1 ? v.copy.setMagnitude(v.magnitude) : Vector.zero); // ???

        const magDiff = v.magnitude - this._velocity.magnitude;
        if(magDiff < 0 && Math.abs(Math.floor(magDiff * 10) / 10) > 0) {
            this.applyForce(
                Vector.one
                    .setDirection(this._velocity.direction + Math.PI)
                    .setMagnitude(Math.min(speed, Math.abs(magDiff)))
                );
        }

        return distance;
    }

    avoid(target, force, max, acceleration) {
        const angle = Math.atan2(target.y - this._y, target.x - this._x);
        const distance = Math.sqrt((target.x - this._x) ** 2 + (target.y - this._y) ** 2);
        if(this._debug) {
            Draw.draw(() => {
                Draw.ctx.strokeStyle = '#ff11ee';
                Draw.ctx.lineWidth = 1;
                Draw.ctx.beginPath();
                Draw.ctx.arc(target.x, target.y, max, 0, Math.PI*2);
                Draw.ctx.stroke();
            });
        }

        if(distance > max + 7) return;
        const inverseDistance = 1 - (distance-7) / max;


        const v = Vector.one;
        v.setDirection(angle + Math.PI);
        v.setMagnitude(inverseDistance*force);
        this.applyForce(v);

        Draw.draw(() => {
            Draw.ctx.strokeStyle = '#ff11ee';
            Draw.ctx.lineWidth = 2;
            Draw.ctx.lineCap = 'round';
            Draw.ctx.beginPath();
            Draw.ctx.moveTo(target.x, target.y);
            Draw.ctx.lineTo(
                target.x + Math.cos(v.direction) * v.magnitude, 
                target.y + Math.sin(v.direction) * v.magnitude
                );
            Draw.ctx.stroke();
        });

        this.approachMagnitude(v.magnitude, acceleration);
        return distance;
    }

    approachMagnitude(m, steps) {
        const magDiff = m - this._velocity.magnitude;
        this.applyForce(
            Vector.one
                .setDirection(this._velocity.direction + (magDiff < 0 ? Math.PI : 0))
                .setMagnitude(Math.min(steps, Math.abs(magDiff)))
            );
    }

    fire(target, force) {
        if(this._cooldown > 0) return;
        this._cooldown = this._maxCooldown;

        const boolets = this._bullets;
        const entity = new Projectile(this._x, this._y);
        for(let i = 0; i < boolets; i++) {
            let angle = Math.atan2(target.y - this._y, target.x - this._x);
            angle = angle + (360 * (i / boolets)) * (Math.PI / 180);

            const entity = new Projectile(this._x, this._y);
            entity.applyForce(
                Vector.one
                    .setMagnitude(force)
                    .setDirection(angle)
                );
            entity._team = this._team;

            Systems.instantiate(entity);
        }

        return entity;
    }

    target() {
        if(this._target?._life <= 0) this._target = null;
        if(this._target == null) {
            const targets = Systems.entities.filter(entity => entity instanceof Agent && entity._team != this._team);
            if(targets.length > 0)
                this._target = targets[Random.range(0, targets.length)];
        }
    }
}

class Projectile extends Entity {
    _acceleration = Vector.zero;
    _velocity = Vector.zero;
    _life = 200;
    _team;
    constructor(x, y) {
        super(x, y);
    }

    onUpdate() {
        if(this._x < -30) this._x = Draw.viewport.width + 30;
        if(this._y < -30) this._y = Draw.viewport.height + 30;
        if(this._x > Draw.viewport.width + 30) this._x = -30;
        if(this._y > Draw.viewport.height + 30) this._y = -30;

        // if(
        //     this._x < -30 || 
        //     this._y < -30 ||
        //     this._x > 400 + 30 ||
        //     this._y > 300 + 30
        //     ) this._life = 0;

        this._life -= 1;
        if(this._life <= 0) {
            this.destroy();
        }

        this._velocity.x += this._acceleration.x;
        this._velocity.y += this._acceleration.y;
        this._acceleration = Vector.zero;

        this._x += this._velocity.x;
        this._y += this._velocity.y;
    }

    onDraw() {
        Draw.ctx.fillStyle = Teams.getColor(this._team);
        Draw.ctx.beginPath();
        Draw.ctx.moveTo(this._x, this._y);
        Draw.ctx.arc(this._x, this._y, 3, 0, Math.PI*2);
        Draw.ctx.fill();

        Draw.ctx.strokeStyle = '#000000';
        Draw.ctx.lineWidth = 1;
        Draw.ctx.lineCap = '';
        Draw.ctx.beginPath();
        Draw.ctx.moveTo(this._x, this._y);
        Draw.ctx.lineTo(
            this._x + Math.cos(this._velocity.direction) * 5, 
            this._y + Math.sin(this._velocity.direction) * 5
            );
        Draw.ctx.stroke();
    }


    applyForce(force) {
        this._acceleration.x += force.x;
        this._acceleration.y += force.y;
    }
}


Systems.start(() => {
    for(let i = 0; i < 20; i++) {
        Systems.instantiate((() => {
            const entity = new Agent(Random.rangeFloat(0, Draw.viewport.width), Random.rangeFloat(0, Draw.viewport.height));
            entity._team = [Teams.A, Teams.B, Teams.C][Random.range(0, 2)];
            return entity;
        })());
    }

    {
        const god = Systems.entities[0];
        god._debug = true;
        // god._team = Teams.C;
        // god._isGod = true;
        // god._life = 1;
        // god._bullets = 69;
        // god._maxCooldown = 0;
        setInterval(() => {
            god._life = 3;
        }, 0)
    }

    {
        // const god = Systems.entities[1];
        // // god._debug = true;
        // god._team = Teams.C;
        // god._isGod = true;
        // god._life = 50;
        // god._bullets = 1;
        // god._maxCooldown = 5;
    }
});