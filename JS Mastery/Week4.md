# Week 4 — Objects, Prototypes, and the Prototype Chain

# The Complete Deep-Dive Lesson

> **JavaScript does not have classical inheritance (like Java/C++). It has
> prototypal inheritance — and the `class` keyword is just syntactic sugar over
> this system. Understanding prototypes is what separates intermediate developers
> from senior developers.**

---

## Table of Contents

1. [Object Creation Patterns](#1-object-creation-patterns)
2. [Prototypal Inheritance — The Core Mechanism](#2-prototypal-inheritance--the-core-mechanism)
3. [The Prototype Chain — Property Lookup](#3-the-prototype-chain--property-lookup)
4. [Property Descriptors and Object Configuration](#4-property-descriptors-and-object-configuration)
5. [ES6 Classes — Sugar Over Prototypes](#5-es6-classes--sugar-over-prototypes)
6. [instanceof and Type Checking](#6-instanceof-and-type-checking)
7. [Exercises](#7-exercises)
8. [Milestone Project](#8-milestone-project)
9. [Sources](#9-sources)

---

## 1. Object Creation Patterns

### The Problem: Sharing Behavior

Imagine you need to create 1,000 user objects for a game. Each user needs a `name` and a `greet()` function. 

If you just create 1,000 separate object literals, you are also creating 1,000 separate copies of the `greet()` function in memory. That is incredibly inefficient. 

What we really want is for all 1,000 users to have their own unique `name` data, but to **share a single copy** of the `greet()` function.

JavaScript gives us four main ways to solve this problem and create objects. Each approach handles sharing (prototypes) slightly differently.

### Pattern 1: Object Literal

```js
const user = {
  name: "Alice",
  age: 25,
  greet() {
    return `Hi, I'm ${this.name}`;
  }
};

// The prototype of this object is Object.prototype
console.log(Object.getPrototypeOf(user) === Object.prototype); // true
```

### Pattern 2: Object.create()

Creates a new object with a **specified prototype**:

```js
const personProto = {
  greet() {
    return `Hi, I'm ${this.name}`;
  },
  introduce() {
    return `${this.name}, age ${this.age}`;
  }
};

const alice = Object.create(personProto);
alice.name = "Alice";
alice.age = 25;

console.log(alice.greet());     // "Hi, I'm Alice"
console.log(alice.introduce()); // "Alice, age 25"

// alice's prototype IS personProto
console.log(Object.getPrototypeOf(alice) === personProto); // true

// alice does NOT own `greet` — it's on the prototype
console.log(alice.hasOwnProperty("name"));  // true
console.log(alice.hasOwnProperty("greet")); // false
```

### Pattern 3: Constructor Functions (pre-ES6)

```js
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.greet = function() {
  return `Hi, I'm ${this.name}`;
};

const bob = new Person("Bob", 30);
console.log(bob.greet()); // "Hi, I'm Bob"

// bob's prototype chain:
// bob → Person.prototype → Object.prototype → null
```

### Pattern 4: ES6 Class (syntactic sugar)

```js
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hi, I'm ${this.name}`;
  }
}

const carol = new Person("Carol", 28);
console.log(carol.greet()); // "Hi, I'm Carol"

// Under the hood, this creates the EXACT same prototype chain
// as the constructor function pattern above
```

> **Source:**
> - MDN — "Working with objects": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
> - MDN — "Object.create()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
> - JavaScript.info — "Objects": https://javascript.info/object

---

## 2. Prototypal Inheritance — The Core Mechanism

### The Key Concepts

Every object in JavaScript has a hidden internal property called `[[Prototype]]`
(accessible via `Object.getPrototypeOf()` or the deprecated `__proto__`).

Every function has a `.prototype` property — this is NOT the function's own
prototype. It's the prototype that will be assigned to objects created with
`new`.

```
IMPORTANT DISTINCTION:
  __proto__    → The object's ACTUAL prototype (what it inherits from)
  .prototype   → A property on FUNCTIONS, used when creating objects with `new`

When you do: const obj = new Foo()
  obj.__proto__ === Foo.prototype  // true
```

### How `new` Works — The 4 Steps

```js
function Car(make, model) {
  // Step 3: `this` is bound to the new object
  this.make = make;
  this.model = model;
  // Step 4: implicitly returns `this`
}

Car.prototype.drive = function() {
  return `Driving ${this.make} ${this.model}`;
};

const myCar = new Car("Toyota", "Camry");
```

What `new Car(...)` does internally:

```js
// Step 1: Create a new empty object
const obj = {};

// Step 2: Set its [[Prototype]] to Car.prototype
Object.setPrototypeOf(obj, Car.prototype);

// Step 3: Call Car() with `this` = obj
Car.call(obj, "Toyota", "Camry");

// Step 4: Return obj (unless Car explicitly returns a different object)
// myCar = obj
```

### Prototype Chain Visualization

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  return `${this.name} makes a sound`;
};

const dog = new Animal("Rex");
```

```
dog                        Animal.prototype           Object.prototype
┌──────────────┐          ┌──────────────────┐       ┌──────────────────┐
│ name: "Rex"  │          │ speak: function  │       │ toString()       │
│              │          │ constructor:     │       │ hasOwnProperty() │
│ __proto__ ───┼────────▶ │   Animal         │       │ valueOf()        │
│              │          │ __proto__ ───────┼─────▶ │ __proto__: null  │
└──────────────┘          └──────────────────┘       └──────────────────┘
```

### Inheritance with Object.create()

```js
const animal = {
  type: "Animal",
  speak() {
    return `${this.name} is a ${this.type}`;
  }
};

const dog = Object.create(animal);
dog.name = "Rex";
dog.type = "Dog";
dog.fetch = function() {
  return `${this.name} fetches the ball`;
};

const puppy = Object.create(dog);
puppy.name = "Max";

console.log(puppy.speak());  // "Max is a Dog" — speak from animal, type from dog
console.log(puppy.fetch());  // "Max fetches the ball" — fetch from dog
console.log(puppy.type);     // "Dog" — inherited from dog
```

```
puppy → dog → animal → Object.prototype → null
```

> **Source:**
> - MDN — "Inheritance and the prototype chain": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain
> - JavaScript.info — "Prototypal inheritance": https://javascript.info/prototype-inheritance
> - JavaScript.info — "F.prototype": https://javascript.info/function-prototype
> - You Don't Know JS: this & Object Prototypes, Ch 5: https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/this%20%26%20object%20prototypes/ch5.md

---

## 3. The Prototype Chain — Property Lookup

When you access a property on an object, the engine searches:

1. The object's **own** properties
2. The object's **prototype** (`__proto__`)
3. The prototype's **prototype**
4. ...continue up the chain...
5. `Object.prototype`
6. `null` → property not found → return `undefined`

### Demonstrating the Lookup

```js
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function() {
  return `Hi, I'm ${this.name}`;
};

const alice = new Person("Alice");

// Own property
console.log(alice.name);     // "Alice" — found on alice itself

// Prototype property
console.log(alice.greet());  // "Hi, I'm Alice" — found on Person.prototype

// Object.prototype property
console.log(alice.toString()); // "[object Object]" — found on Object.prototype

// Non-existent property
console.log(alice.age);      // undefined — not found anywhere in the chain
```

### Own vs Inherited Properties

```js
const parent = { a: 1, b: 2 };
const child = Object.create(parent);
child.c = 3;

// for...in — iterates over OWN + INHERITED enumerable properties
for (const key in child) {
  console.log(key); // "c", "a", "b"
}

// Object.keys — only OWN enumerable properties
console.log(Object.keys(child)); // ["c"]

// hasOwnProperty — check if property is directly on the object
console.log(child.hasOwnProperty("c")); // true
console.log(child.hasOwnProperty("a")); // false — it's inherited
```

### Property Shadowing

If you set a property that exists on the prototype, it creates a **new own
property** that **shadows** the prototype property:

```js
const proto = { x: 10 };
const obj = Object.create(proto);

console.log(obj.x);                // 10 — from prototype
console.log(obj.hasOwnProperty("x")); // false

obj.x = 20; // Creates a NEW own property, does NOT modify proto.x

console.log(obj.x);                // 20 — own property (shadows proto)
console.log(proto.x);              // 10 — unchanged
console.log(obj.hasOwnProperty("x")); // true
```

### Prototype Methods Are Live

Methods added to the prototype **after** creating instances are still available:

```js
function Car(make) {
  this.make = make;
}

const myCar = new Car("Toyota");

// Add a method AFTER creating the instance
Car.prototype.honk = function() {
  return `${this.make} goes beep!`;
};

console.log(myCar.honk()); // "Toyota goes beep!" — works!
```

This works because property lookup is performed at **call time**, walking the
live prototype chain. It doesn't create a snapshot at instance creation.

> **Source:**
> - MDN — "Inheritance and the prototype chain": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain
> - JavaScript.info — "Native prototypes": https://javascript.info/native-prototypes
> - JavaScript.info — "Prototype methods, objects without __proto__": https://javascript.info/prototype-methods

---

## 4. Property Descriptors and Object Configuration

Every property on an object has a **descriptor** — metadata that controls its
behavior.

### The Three Flags

| Flag | Default | What It Controls |
|------|---------|-----------------|
| `writable` | `true` | Can the value be changed? |
| `enumerable` | `true` | Does it show up in `for...in` and `Object.keys()`? |
| `configurable` | `true` | Can the descriptor be changed? Can the property be deleted? |

### Reading Property Descriptors

```js
const user = { name: "Alice", age: 25 };

console.log(Object.getOwnPropertyDescriptor(user, "name"));
// {
//   value: "Alice",
//   writable: true,
//   enumerable: true,
//   configurable: true
// }
```

### Defining Custom Descriptors

```js
const user = {};

Object.defineProperty(user, "id", {
  value: 12345,
  writable: false,     // cannot change the value
  enumerable: false,   // won't show in for...in or Object.keys
  configurable: false, // cannot delete or reconfigure
});

console.log(user.id);           // 12345
user.id = 99999;                // silently fails (throws in strict mode)
console.log(user.id);           // 12345 — unchanged

console.log(Object.keys(user)); // [] — id is not enumerable
console.log(user.id);           // 12345 — but still accessible directly

delete user.id;                 // silently fails
console.log(user.id);           // 12345 — still there
```

### Getters and Setters

```js
const user = {
  firstName: "Alice",
  lastName: "Smith",

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },

  set fullName(value) {
    const parts = value.split(" ");
    this.firstName = parts[0];
    this.lastName = parts[1];
  }
};

console.log(user.fullName);     // "Alice Smith" — calls the getter
user.fullName = "Bob Jones";    // calls the setter
console.log(user.firstName);    // "Bob"
console.log(user.lastName);     // "Jones"
```

### Object-Level Protections

```js
// Object.freeze — no changes at all (shallow)
const frozen = Object.freeze({ x: 1, y: 2 });
frozen.x = 10;    // silently fails
frozen.z = 3;     // silently fails
delete frozen.x;  // silently fails

// Object.seal — can modify existing, but can't add/delete
const sealed = Object.seal({ x: 1, y: 2 });
sealed.x = 10;    // ✅ works
sealed.z = 3;     // ❌ silently fails (can't add)
delete sealed.x;  // ❌ silently fails (can't delete)

// Object.preventExtensions — can't add, but can modify/delete
const restricted = Object.preventExtensions({ x: 1 });
restricted.x = 10;  // ✅ works
restricted.y = 2;   // ❌ silently fails (can't add)
delete restricted.x; // ✅ works
```

> **Source:**
> - MDN — "Object.defineProperty()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
> - MDN — "Object.freeze()": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
> - JavaScript.info — "Property flags and descriptors": https://javascript.info/property-descriptors
> - JavaScript.info — "Property getters and setters": https://javascript.info/property-accessors

---

## 5. ES6 Classes — Sugar Over Prototypes

### Class Syntax

```js
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a sound`;
  }

  static create(name) {
    return new Animal(name);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // MUST call super() before using `this`
    this.breed = breed;
  }

  speak() {
    return `${this.name} barks`;
  }

  fetch() {
    return `${this.name} fetches the ball`;
  }
}

const rex = new Dog("Rex", "Labrador");
console.log(rex.speak());  // "Rex barks" — overridden method
console.log(rex.fetch());  // "Rex fetches the ball"
```

### What's Really Happening Under the Hood

The class syntax above is equivalent to:

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  return `${this.name} makes a sound`;
};
Animal.create = function(name) {
  return new Animal(name);
};

function Dog(name, breed) {
  Animal.call(this, name); // equivalent to super(name)
  this.breed = breed;
}

// Set up the prototype chain:
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.speak = function() {
  return `${this.name} barks`;
};
Dog.prototype.fetch = function() {
  return `${this.name} fetches the ball`;
};
```

### Prototype Chain with Classes

```
rex                   Dog.prototype          Animal.prototype       Object.prototype
┌───────────────┐    ┌──────────────────┐   ┌──────────────────┐  ┌────────────────┐
│ name: "Rex"   │    │ speak: function  │   │ speak: function  │  │ toString()     │
│ breed: "Lab"  │    │ fetch: function  │   │ constructor:     │  │ valueOf()      │
│ __proto__ ────┼──▶ │ __proto__ ───────┼──▶│   Animal         │  │ __proto__: null│
└───────────────┘    └──────────────────┘   │ __proto__ ───────┼─▶└────────────────┘
                                            └──────────────────┘
```

When `rex.speak()` is called:
1. Check `rex` own properties → no `speak`
2. Check `Dog.prototype` → found `speak`! Use it (returns "Rex barks")

`Animal.prototype.speak` is **shadowed** by `Dog.prototype.speak`.

### Private Fields and Methods (ES2022)

```js
class BankAccount {
  #balance; // truly private — not accessible outside the class

  constructor(initialBalance) {
    this.#balance = initialBalance;
  }

  deposit(amount) {
    this.#validateAmount(amount);
    this.#balance += amount;
    return this.#balance;
  }

  #validateAmount(amount) { // private method
    if (amount <= 0) throw new Error("Amount must be positive");
  }

  get balance() {
    return this.#balance;
  }
}

const account = new BankAccount(100);
account.deposit(50); // 150
console.log(account.balance); // 150

// console.log(account.#balance); // [!] SyntaxError: Private field
```

> **Source:**
> - MDN — "Classes": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
> - MDN — "extends": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends
> - MDN — "Private properties": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
> - JavaScript.info — "Class basic syntax": https://javascript.info/class
> - JavaScript.info — "Class inheritance": https://javascript.info/class-inheritance

---

## 6. instanceof and Type Checking

### How `instanceof` Works

`instanceof` walks the prototype chain to check if `Constructor.prototype`
exists anywhere in the object's chain:

```js
class Animal {}
class Dog extends Animal {}

const rex = new Dog();

console.log(rex instanceof Dog);    // true — Dog.prototype is in rex's chain
console.log(rex instanceof Animal); // true — Animal.prototype is also in the chain
console.log(rex instanceof Object); // true — Object.prototype is at the top
```

### Implementing Your Own instanceof

```js
function myInstanceOf(obj, Constructor) {
  let proto = Object.getPrototypeOf(obj);

  while (proto !== null) {
    if (proto === Constructor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }

  return false;
}

console.log(myInstanceOf(rex, Dog));    // true
console.log(myInstanceOf(rex, Animal)); // true
console.log(myInstanceOf(rex, Array));  // false
```

### Symbol.hasInstance — Customizing instanceof

```js
class EvenNumber {
  static [Symbol.hasInstance](value) {
    return typeof value === "number" && value % 2 === 0;
  }
}

console.log(4 instanceof EvenNumber);  // true
console.log(5 instanceof EvenNumber);  // false
console.log("hello" instanceof EvenNumber); // false
```

> **Source:**
> - MDN — "instanceof": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof
> - MDN — "Symbol.hasInstance": https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance
> - JavaScript.info — "Class checking: 'instanceof'": https://javascript.info/instanceof

---

## 7. Exercises

### Exercise Set A: Prototypes

```js
// A1. What does this log?
function Foo() {}
Foo.prototype.x = 10;

const a = new Foo();
const b = new Foo();

a.x = 20;

console.log(a.x); // ❓
console.log(b.x); // ❓

// A2. What does this log?
function Bar() {}
Bar.prototype.arr = [1, 2, 3];

const obj1 = new Bar();
const obj2 = new Bar();

obj1.arr.push(4);

console.log(obj2.arr); // ❓

// A3. Explain the difference between A1 and A2.
// Why does changing a.x NOT affect b.x, but obj1.arr.push DOES affect obj2.arr?

// A4. Write a function that returns all properties (own + inherited) of an object
function getAllProperties(obj) {
  // YOUR CODE
}

// A5. Implement myInstanceOf(obj, Constructor) without using instanceof
```

<details>
<summary><strong>Answers</strong></summary>

```
A1: 20, 10
    a.x = 20 creates a NEW own property on a, shadowing the prototype.
    b.x still looks up the chain and finds 10 on Foo.prototype.

A2: [1, 2, 3, 4]
    obj1.arr.push(4) does NOT create a new own property — it MUTATES
    the array that lives on the prototype. Since obj1 and obj2 share
    the same prototype, obj2.arr is the same mutated array.

A3: In A1, `a.x = 20` is a PROPERTY ASSIGNMENT — creates a new own property.
    In A2, `obj1.arr.push(4)` is a METHOD CALL on the existing array —
    it reads `arr` from the prototype and mutates it in place.
    Assignment creates; method calls on references mutate.

A4:
function getAllProperties(obj) {
  const props = new Set();
  let current = obj;
  while (current !== null) {
    Object.getOwnPropertyNames(current).forEach(p => props.add(p));
    current = Object.getPrototypeOf(current);
  }
  return [...props];
}

A5: (See myInstanceOf implementation in section 6 above)
```

</details>

### Exercise Set B: Classes and Inheritance

```js
// B1. Convert this class to a constructor function
class Vehicle {
  constructor(type, speed) {
    this.type = type;
    this.speed = speed;
  }
  describe() {
    return `${this.type} going ${this.speed}mph`;
  }
}

class Truck extends Vehicle {
  constructor(speed, payload) {
    super("Truck", speed);
    this.payload = payload;
  }
  describe() {
    return `${super.describe()} carrying ${this.payload}`;
  }
}

// B2. Create a class hierarchy: Shape → Rectangle → Square
// Shape has an area() method that throws "Not implemented"
// Rectangle overrides area() to return width * height
// Square takes a single side and passes it as both width and height
```

<details>
<summary><strong>B2 Solution</strong></summary>

```js
class Shape {
  area() {
    throw new Error("Not implemented");
  }
  describe() {
    return `${this.constructor.name} with area ${this.area()}`;
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  constructor(side) {
    super(side, side);
  }
}

const r = new Rectangle(5, 10);
console.log(r.describe()); // "Rectangle with area 50"

const s = new Square(7);
console.log(s.describe()); // "Square with area 49"
console.log(s instanceof Square);    // true
console.log(s instanceof Rectangle); // true
console.log(s instanceof Shape);     // true
```

</details>

---

## 8. Milestone Project

### Build: A Schema Validator Library

> ⚠️ **Prerequisites — Complete These Before Starting**
>
> This project is built entirely with classes and OOP. Make sure you have
> finished the following before attempting it:
>
> | What you need | Where you learn it |
> |---|---|
> | `class`, `constructor`, `this` | Week 4 (this week) |
> | Inheritance with `extends` & `super()` | Week 4 (this week) |
> | Method chaining (returning `this`) | Week 4 (this week) |
> | Arrow functions in class methods | Week 2 ✅ |
> | `for...of` loop | Week 2 ✅ |
> | Template literals | Week 2 ✅ |
>
> ✅ Complete all of Week 4 before starting this project.

```js
// schema-validator.js

class BaseValidator {
  constructor() {
    this._rules = [];
    this._isRequired = false;
    this._default = undefined;
  }

  required() {
    this._isRequired = true;
    return this; // chainable
  }

  default(value) {
    this._default = value;
    return this;
  }

  validate(value) {
    if (value === undefined || value === null) {
      if (this._default !== undefined) return { valid: true, value: this._default };
      if (this._isRequired) return { valid: false, error: "Value is required" };
      return { valid: true, value };
    }

    for (const rule of this._rules) {
      const result = rule(value);
      if (!result.valid) return result;
    }

    return { valid: true, value };
  }
}

class StringValidator extends BaseValidator {
  constructor() {
    super();
    this._rules.push((val) =>
      typeof val === "string"
        ? { valid: true }
        : { valid: false, error: `Expected string, got ${typeof val}` }
    );
  }

  minLength(min) {
    this._rules.push((val) =>
      val.length >= min
        ? { valid: true }
        : { valid: false, error: `Minimum length is ${min}, got ${val.length}` }
    );
    return this;
  }

  maxLength(max) {
    this._rules.push((val) =>
      val.length <= max
        ? { valid: true }
        : { valid: false, error: `Maximum length is ${max}, got ${val.length}` }
    );
    return this;
  }

  pattern(regex) {
    this._rules.push((val) =>
      regex.test(val)
        ? { valid: true }
        : { valid: false, error: `Does not match pattern ${regex}` }
    );
    return this;
  }
}

class NumberValidator extends BaseValidator {
  constructor() {
    super();
    this._rules.push((val) =>
      typeof val === "number" && !Number.isNaN(val)
        ? { valid: true }
        : { valid: false, error: `Expected number, got ${typeof val}` }
    );
  }

  min(min) {
    this._rules.push((val) =>
      val >= min
        ? { valid: true }
        : { valid: false, error: `Minimum is ${min}, got ${val}` }
    );
    return this;
  }

  max(max) {
    this._rules.push((val) =>
      val <= max
        ? { valid: true }
        : { valid: false, error: `Maximum is ${max}, got ${val}` }
    );
    return this;
  }
}

class SchemaValidator {
  constructor(shape) {
    this._shape = shape;
  }

  validate(data) {
    const errors = {};
    const result = {};
    let valid = true;

    for (const [key, validator] of Object.entries(this._shape)) {
      const fieldResult = validator.validate(data[key]);
      if (!fieldResult.valid) {
        valid = false;
        errors[key] = fieldResult.error;
      } else {
        result[key] = fieldResult.value !== undefined ? fieldResult.value : data[key];
      }
    }

    return valid
      ? { valid: true, data: result }
      : { valid: false, errors };
  }
}

// ── Factory functions ──
const Schema = {
  string: () => new StringValidator(),
  number: () => new NumberValidator(),
  object: (shape) => new SchemaValidator(shape),
};

// ============================================================
// Test it
// ============================================================

const userSchema = Schema.object({
  name: Schema.string().required().minLength(2).maxLength(50),
  age: Schema.number().min(0).max(150),
  email: Schema.string().required().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  role: Schema.string().default("user"),
});

console.log(userSchema.validate({
  name: "Alice",
  age: 25,
  email: "alice@example.com"
}));
// { valid: true, data: { name: "Alice", age: 25, email: "alice@example.com", role: "user" } }

console.log(userSchema.validate({
  name: "A",
  age: -5,
  email: "invalid"
}));
// { valid: false, errors: { name: "Minimum length is 2...", age: "Minimum is 0...", email: "Does not match..." } }
```

**Your extensions:**
1. Add `EnumValidator` — validates value is one of a predefined list.
2. Add `ArrayValidator` — validates arrays with item type checking.
3. Add `BooleanValidator`.
4. Add a `.toJSON()` method to serialize schemas for storage/transmission.

---

## 9. Sources

| Topic | Source | URL |
|-------|--------|-----|
| Working with objects | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects |
| Object.create() | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create |
| Objects | JavaScript.info | https://javascript.info/object |
| Prototype chain | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain |
| Prototypal inheritance | JavaScript.info | https://javascript.info/prototype-inheritance |
| F.prototype | JavaScript.info | https://javascript.info/function-prototype |
| this & Object Prototypes | YDKJS (1st ed), Ch 5 | https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/this%20%26%20object%20prototypes/ch5.md |
| Native prototypes | JavaScript.info | https://javascript.info/native-prototypes |
| Prototype methods | JavaScript.info | https://javascript.info/prototype-methods |
| Object.defineProperty | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty |
| Object.freeze | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze |
| Property descriptors | JavaScript.info | https://javascript.info/property-descriptors |
| Getters/setters | JavaScript.info | https://javascript.info/property-accessors |
| Classes | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes |
| extends | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends |
| Private properties | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties |
| Class syntax | JavaScript.info | https://javascript.info/class |
| Class inheritance | JavaScript.info | https://javascript.info/class-inheritance |
| instanceof | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof |
| Symbol.hasInstance | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance |
| instanceof checking | JavaScript.info | https://javascript.info/instanceof |
