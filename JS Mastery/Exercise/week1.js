//////////Exercise A//////////
// A1.
console.log(a);
var a = 1;
console.log(a);
// Prediction: undefined, 1

// A2.
console.log(b);
let b = 2;
// Prediction: ReferenceError

// A3.
var c = 10;
var c = 20;
console.log(c);
// Prediction: 20

// A4.
let d = 10;
{
    let d = 20;
    console.log(d);
}
console.log(d);
// Prediction: 20, 10

// A5.
const e = { x: 1 };
e.x = 2;
console.log(e.x);
// Prediction: 2

// A6.
var f = 1;
function test() {
    console.log(f);
    var f = 2;
}
test();
// Prediction: undefined

// A7.
console.log(typeof foo);
var foo = "hello";
function foo() { }
console.log(typeof foo);
// Prediction: function, string

// A8.
for (var i = 0; i < 3; i++) { }
console.log(i);
// Prediction: 3

// A9.
for (let j = 0; j < 3; j++) { }
console.log(j);
// Prediction: ReferenceError

// A10.
var x = 1;
function outer() {
    console.log(x);
    function inner() {
        console.log(x);
        var x = 3;
    }
    inner();
}
outer();
// Prediction: 1, undefined

//////////Exercise B//////////
// B1.
var a = "global";
function outer() {
    var b = "outer";
    function inner() {
        var c = "inner";
        console.log(a, b, c);
    }
    inner();
}
outer();

// B2.
var x = "global-x";
function foo() {
    var x = "foo-x";
    function bar() {
        console.log(x);
    }
    return bar;
}
var fn = foo();
fn();  // ❓ "global-x" or "foo-x"?

// B3.
let val = "global";
function createLogger() {
    let val = "local";
    return function () {
        console.log(val);
    };
}
const logger = createLogger();
logger();

// B4.
function level1() {
    let a = 1;
    function level2() {
        let b = 2;
        function level3() {
            let c = 3;
            console.log(a + b + c);
        }
        level3();
    }
    level2();
}
level1();

//////////Exercise C//////////
// C1. The function should log "Hello, Alice"
var sayHi = function () {
    console.log("Hello, Alice");
};
sayHi();

// C2. This should print 0, 1, 2 (not 3, 3, 3)
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}

// C3. This should NOT pollute the global scope
const helperUtil = "some value";
// (After running, window.helperUtil should be undefined)

// C4. The user object should be truly immutable
const config = Object.freeze({ apiUrl: "https://api.example.com", retries: 3 });
config.retries = 10; // This should NOT be allowed

// C5. This should print "admin", not crash
function getRole() {
    if (true) {
        let role = "admin";
        return role;
    }
}
console.log(getRole());


//////////Exercise C//////////
function main() {
  console.log("main:start");
  alpha();
  console.log("main:end");
}

function alpha() {
  console.log("alpha:start");
  beta();
  console.log("alpha:end");
}

function beta() {
  console.log("beta:start");
  gamma();
  console.log("beta:end");
}

function gamma() {
  console.log("gamma");
}

main();