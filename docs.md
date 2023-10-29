# Base JS Engine
This document explains the important features and uses of the **Base JS Engine**.

-------------------
## Getting Started
### Creating A New Project
A new project can be created by duplicating the file `app.js` and plugging it into an 
html file that contains a `<canvas>` element. The following code should be added to the 
document head:

```html
<script src="base.js" defer></script>
```

### Getting Started
A simple program can be created with this engine by calling `Systems.start()` in a
new js file. Passing a callback function into it makes for an easy way to initalize
the main loop. The following code creates a new entity and starts the main loop:
```js
Systems.start(() => {
    const entity = new Entity();
    Systems.instantiate(entity);
});
```

### Extending `Entity`

-------------------
## Classes
This engine contains numerous useful classes, and this section of the documentation
lists them.

## Systems

## Draw

## Entity

## Process


## Vector

## Random
Provides utilities for random numbers.

### Methods

### static get `.random`
Returns a random value between zero and one using `Math.random()`.

### static `.range(min, max)`
Returns an integer value between `min` and `max`, inclusive.

| Parameter | Type    | Description                               |
| --------- | ------- | ----------------------------------------- |
| min       | integer | The smallest possible value in the range. |
| max       | integer | The largest possible value in the range.  |

### static `.rangeFloat(min, max)`
Returns a decimal value between `min` and `max`, inclusive.

| Parameter | Type    | Description                               |
| --------- | ------- | ----------------------------------------- |
| min       | float   | The smallest possible value in the range. |
| max       | float   | The largest possible value in the range.  |

-------------------
## To Do
The following list are features that need to/should be added to this engine and/or problems
that need to be solved.

 - [x] Have a canvas be automatically created in the `Draw` class if one does not already exist
 - [ ] Calculate delta time and implement it correctly (Reference 'Fixing your timestep') 
 - [x] Fix the bug with the automatic canvas not being properly created
 - [x] Make a system to let `Systems` run subprocesses
 - [x] Make a system to let entities run subprocesses
