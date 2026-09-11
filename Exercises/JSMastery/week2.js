// A1.
console.log("5" + 3);   //53
console.log("5" - 3);   //2
console.log("5" * "3"); //15

// A2.
console.log(true + true + true);    //3
console.log(true + "hello");        //hello

// A3.
console.log([] + []);   //empty string
console.log([] + {});   //[object,object]
console.log({} + []);   //[object,object]

// A4.
console.log(null == undefined);  //true
console.log(null === undefined); //false
console.log(null == 0);          //false
console.log(null == "");         //false

// A5.
console.log("" == 0);          //true
console.log("" === 0);         //false
console.log(" " == 0);         //true

// A6.
console.log(NaN == NaN);            //false
console.log(NaN === NaN);           //false
console.log(Number.isNaN(NaN));     //true
console.log(Number.isNaN("hello")); //false

// A7.
console.log(typeof null);       //object
console.log(typeof undefined);//undefined
console.log(typeof NaN);   //number
console.log(typeof []);    //object

// A8.
console.log(Boolean("0"));   //true
console.log(Boolean(0));     //false
console.log(Boolean(""));    //false
console.log(Boolean([]));    //true
console.log(Boolean({}));    //true




// ─── C1. deepEqual ───────────────────────────────────────────────────────────
// Compares two values deeply (works for nested objects and arrays).
//
// THE CORE IDEA:
//   - Primitives (numbers, strings, etc.) can just use ===
//   - Objects/arrays need to be opened up and each piece compared one by one
//   - If any nested piece is itself an object/array, we recurse (call ourselves)
//
function deepEqual(a, b) {
    // STEP 1: Handle primitives and same-reference objects.
    // If === works (same value OR same memory address), we're done immediately.
    if (a === b) return true;

    // STEP 2: If either value is null, or not an object at all (i.e. a primitive
    // like a number or string), and === already failed above — they can't be equal.
    if (a === null || b === null) return false;
    if (typeof a !== "object" || typeof b !== "object") return false;

    // STEP 3: Arrays and plain objects both have typeof "object", but they are
    // NOT equal to each other: [1,2] !== {0:1, 1:2}
    // Check if one is an array and the other is not.
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    // STEP 4: Get all the keys (for objects) or check length (for arrays).
    // Both are the same idea — how many "slots" does each value have?
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // If they have a different number of keys/items, they can't be equal.
    if (keysA.length !== keysB.length) return false;

    // STEP 5: For every key in `a`, check if the value at that key
    // is deeply equal to the value at the same key in `b`.
    // If `b` doesn't have the key at all, b[key] → undefined,
    // which won't equal a[key], so deepEqual will return false anyway.
    // (We already know lengths match, so no extra key-existence check needed.)
    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (!deepEqual(a[key], b[key])) return false; // values don't match (recurse)
    }

    // If we got through all keys without returning false — everything matched!
    return true;
}

console.log(deepEqual({ x: 1, y: { z: 2 } }, { x: 1, y: { z: 2 } })); // true
console.log(deepEqual([1, [2, 3]], [1, [2, 3]]));                       // true
console.log(deepEqual({ x: 1 }, { x: 2 }));                             // false

// ─── C2. deepClone ────────────────────────────────────────────────────────────
// Creates a fully independent copy of an object/array (no shared references).
//
// THE CORE IDEA:
//   - Primitives can be returned as-is (they are already independent copies)
//   - For arrays: create a new [], then recursively clone each item
//   - For objects: create a new {}, then recursively clone each value
//
function deepClone(val) {
    // Primitives (number, string, boolean, null, undefined) are already values,
    // not references — just return them directly.
    if (val === null || typeof val !== "object") return val;

    // If it's an array, clone each element recursively into a new array.
    // (using a plain for loop — same idea as .map(), just written manually)
    if (Array.isArray(val)) {
        const clonedArr = [];                          // 1. start with an empty array
        for (let i = 0; i < val.length; i++) {
            clonedArr[i] = deepClone(val[i]);            // 2. clone each item (recurse)
        }
        return clonedArr;                              // 3. return the new independent array
    }

    // Otherwise it's a plain object — clone each property recursively.
    // Object.keys(val) gives us an array of all the key names: ["a", "b", "d"]
    // Then we loop through those keys using a plain for loop (like we do with arrays).
    const cloned = {};
    const keys = Object.keys(val);           // e.g. ["a", "b", "d"]
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];                 // "a", then "b", then "d"
        cloned[key] = deepClone(val[key]);   // clone the value at that key (recurse)
    }
    return cloned;
}

const original = { a: 1, b: { c: 2 }, d: [3, 4] };
const clone = deepClone(original);
clone.b.c = 99;
console.log(original.b.c); // 2 — original is untouched ✅

// ─── C3. getType ──────────────────────────────────────────────────────────────
// Returns accurate type names that typeof gets wrong.
//
// Tools available from Week 1 & 2:
//   - val === null      → catches null (typeof null gives wrong answer "object")
//   - Number.isNaN(val) → catches NaN  (typeof NaN gives wrong answer "number")
//   - Array.isArray(val)→ catches arrays (typeof [] gives wrong answer "object")
//   - typeof val        → correct for everything else
//
// ⚠️  NOTE: new Date() and /regex/ also return "object" from typeof.
//    Telling them apart from a plain {} requires `instanceof` — a concept
//    not yet introduced. So getType will return "object" for those for now.
//
function getType(val) {
    // Check null FIRST — typeof null === "object" is the famous JS bug.
    // We must catch this before typeof runs.
    if (val === null) return "null";

    // Check NaN SECOND — typeof NaN === "number" which is misleading.
    // Number.isNaN() is the reliable check (from Week 2, Section 5).
    if (typeof val === "number" && Number.isNaN(val)) return "NaN";

    // Check arrays THIRD — typeof [] === "object" which is wrong.
    // Array.isArray() is the correct check (from Week 2, Section 5).
    if (Array.isArray(val)) return "array";

    // For everything else, typeof gives the correct answer:
    // "number", "string", "boolean", "undefined", "function", "bigint", "symbol"
    // Plain objects {} → "object" (correct)
    // ⚠️  new Date() and /regex/ → also "object" (limitation — needs instanceof)
    return typeof val;
}

console.log(getType(null));       // "null"    ✅ (fixed the typeof bug)
console.log(getType([]));         // "array"   ✅ (fixed the typeof bug)
console.log(getType({}));         // "object"  ✅
console.log(getType(42));         // "number"  ✅
console.log(getType(NaN));        // "NaN"     ✅ (fixed the typeof bug)
console.log(getType(new Date())); // "object"  ⚠️  (needs instanceof — not taught yet)
console.log(getType(/regex/));    // "object"  ⚠️  (needs instanceof — not taught yet)