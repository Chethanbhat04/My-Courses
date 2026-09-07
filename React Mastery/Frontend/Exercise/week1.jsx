// 1. Destructuring drill — Given this object, destructure name, age, and the city from the nested address. Provide a default for role as "user".

const profile = { name: "Alex", age: 22, address: { city: "Bangalore" } };

const { name, age, address: { city }, role = "user" } = profile;

console.log(name);
console.log(age);
console.log(city);
console.log(role);


// 2. Spread immutability — Create a React-style state update: given state = { user: "Alex", theme: "dark", lang: "en" }, produce a new object with theme changed to "light" without mutating the original.

const state = { user: "Alex", theme: "dark", lang: "en" };

const newState = { ...state, theme: "light" }
console.log(state);
console.log(newState);







export { }