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


// 3. Array methods chain — Given an array of products with { name, price, inStock }, write a single chained expression to get the names of in-stock products that cost less than 500, sorted alphabetically.

const products = [
    { name: "Bag", price: 600, inStock: true },
    { name: "Shirt", price: 450, inStock: true },
    { name: "Shoes", price: 999, inStock: false },
    { name: "Watch", price: 350, inStock: true }
];

const result = products
    .filter(product => product.inStock && product.price < 500)
    .map(product => product.name)
    .sort((a, b) => a.localeCompare(b));

console.log(products);
console.log(result);


// 4. async/await with error handling — Write an async function fetchPost(id) that fetches from https://jsonplaceholder.typicode.com/posts/${id}. Handle the case where the id does not exist (non-ok response) and any network error.

async function fetchPost(id) {
    try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error("Failed to fetch post:", err.message);
        return null;
    }
}


// 5.Short-circuit gotcha — What does {0 && <span>Hello</span>} render in React? Why? How would you fix it?

// {0 && <span>Hello</span>} renders 0, because 0 is falsy. To fix this declare a variable and asign the value 0 and write the variable in place of 0 like,

const count = 0;
// Fix 1: Explicit boolean comparison
return (
    <div>
        {count > 0 && <span>Hello</span>}
    </div>
);

// Fix 2: Double negation — coerces to boolean
return (
    <div>
        {!!count && <span>Hello</span>}
    </div>
);

//Fix 3: Ternary — explicit control
return (
    <div>
        {count ? <span>Hello</span> : null}
    </div>
);


export { }