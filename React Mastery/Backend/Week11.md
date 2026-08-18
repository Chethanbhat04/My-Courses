# Week 11 — Databases: MongoDB + Mongoose

# The Complete Deep-Dive Lesson

> **By the end of this week you will understand how MongoDB stores data differently
> from SQL, how to define schemas and models with Mongoose, perform all CRUD
> operations, model relationships between data, and apply basic indexing for
> performance.**

---

## Table of Contents

1. [MongoDB — Documents vs Rows](#1-mongodb--documents-vs-rows)
2. [Setting Up MongoDB Atlas (Cloud)](#2-setting-up-mongodb-atlas-cloud)
3. [Mongoose — Connecting to MongoDB](#3-mongoose--connecting-to-mongodb)
4. [Schemas & Models](#4-schemas--models)
5. [CRUD Operations with Mongoose](#5-crud-operations-with-mongoose)
6. [Querying — Filters, Sort, Pagination](#6-querying--filters-sort-pagination)
7. [Data Relationships — Embed vs Reference](#7-data-relationships--embed-vs-reference)
8. [Validation & Middleware in Mongoose](#8-validation--middleware-in-mongoose)
9. [Indexing for Performance](#9-indexing-for-performance)
10. [Exercises](#10-exercises)
11. [Milestone Project](#11-milestone-project)
12. [Sources](#12-sources)

---

## 1. MongoDB — Documents vs Rows

- **MongoDB stores data as BSON documents (Binary JSON) in collections, not as
  rows in tables** — A document is a JSON-like object. A collection is like a
  table, but without a fixed schema — each document can have different fields.

  ```
  SQL (relational):              MongoDB (document):
  ┌─────────────────────────┐    {
  │ users table             │      _id: ObjectId("..."),
  │ id | name | email       │      name: "Chethan",
  │ 1  | Chethan | c@x.com  │      email: "c@x.com",
  └─────────────────────────┘      role: "admin",
                                   createdAt: ISODate("2024-01-15")
                                 }
  ```

- **MongoDB's schemaless nature is both a feature and a risk** — You can store
  heterogeneous data without migrations. But without structure, data becomes
  inconsistent. Mongoose adds schemas on top to enforce structure.

- **Key MongoDB concepts to know** — Before writing code, understand the vocabulary.

  | SQL Term    | MongoDB Term |
  |-------------|-------------|
  | Database    | Database    |
  | Table       | Collection  |
  | Row         | Document    |
  | Column      | Field       |
  | Primary Key | `_id` (ObjectId) |
  | JOIN        | `$lookup` (or embedding) |

- **ObjectId is MongoDB's auto-generated unique ID** — Every document gets an
  `_id` field automatically. ObjectId is a 12-byte value that encodes the creation
  timestamp, machine ID, and a random counter — guaranteed unique across the cluster.

  ```js
  const { ObjectId } = require('mongoose').Types;
  const id = new ObjectId();
  console.log(id.toString()); // "507f1f77bcf86cd799439011"
  console.log(id.getTimestamp()); // Date the ID was created
  ```

---

## 2. Setting Up MongoDB Atlas (Cloud)

MongoDB Atlas is MongoDB's free cloud hosting (no local installation needed).

```
1. Go to https://cloud.mongodb.com
2. Create a free account → create a free M0 cluster (512MB, always free)
3. Database Access → create a user with password
4. Network Access → add your IP (or 0.0.0.0/0 for development)
5. Clusters → Connect → Connect your application → copy the connection string
```

Your connection string looks like:
```
mongodb+srv://username:password@cluster0.abcdef.mongodb.net/databaseName?retryWrites=true&w=majority
```

Store this in your `.env` file as `MONGO_URI`.

---

## 3. Mongoose — Connecting to MongoDB

```bash
npm install mongoose
```

- **`mongoose.connect()` establishes the connection — do it once at startup** —
  Mongoose automatically handles reconnection. Call it before starting the Express
  server to ensure the database is ready before accepting requests.

  ```js
  // db.js — connection setup
  const mongoose = require('mongoose');

  async function connectDB() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected ✅');
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1); // exit if DB fails — no point running without it
    }
  }

  module.exports = connectDB;
  ```

  ```js
  // server.js — connect before listening
  require('dotenv').config();
  const connectDB = require('./db');
  const app = require('./app');

  connectDB().then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log('Server running');
    });
  });
  ```

---

## 4. Schemas & Models

Mongoose adds structure to MongoDB through schemas.

- **A Schema defines the shape of documents in a collection** — field names, types,
  validations, and defaults. Think of it as the blueprint for a document.

  ```js
  const mongoose = require('mongoose');
  const { Schema } = mongoose;

  const userSchema = new Schema(
    {
      name: {
        type: String,
        required: [true, 'Name is required'],  // validation with custom error message
        trim: true,                             // strip whitespace
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters'],
      },
      email: {
        type: String,
        required: true,
        unique: true,      // creates a unique index in MongoDB
        lowercase: true,   // automatically convert to lowercase before saving
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      },
      password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,     // never include in query results by default (security!)
      },
      role: {
        type: String,
        enum: ['user', 'admin', 'moderator'], // only these values allowed
        default: 'user',
      },
      age: {
        type: Number,
        min: [0, 'Age cannot be negative'],
        max: [120, 'Age seems unrealistic'],
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true, // automatically adds createdAt and updatedAt fields
    }
  );
  ```

- **A Model is a constructor compiled from a Schema** — You use the model to
  create, read, update, and delete documents in that collection. Convention:
  Model names are PascalCase; Mongoose automatically pluralizes the collection
  name (`User` → `users` collection).

  ```js
  const User = mongoose.model('User', userSchema);
  // Now User is a class you can use like: new User({...}), User.find(), User.findById(), etc.

  module.exports = User;
  ```

---

## 5. CRUD Operations with Mongoose

### Create

- **`new Model({...}).save()` or `Model.create({...})` creates a new document** —
  Both validate against the schema before writing. `create()` is shorthand.

  ```js
  // Method 1: instantiate + save
  const user = new User({ name: "Chethan", email: "c@x.com", password: "hashed123" });
  await user.save(); // validates + writes to MongoDB

  // Method 2: Model.create() shorthand (preferred)
  const user = await User.create({ name: "Chethan", email: "c@x.com", password: "hashed123" });
  console.log(user._id); // the auto-generated ObjectId
  ```

### Read

- **`Model.find(filter)` returns an array of documents matching the filter** —
  Pass an empty object `{}` to get all documents. Returns Mongoose Query objects
  (chainable) — don't forget to `await`.

  ```js
  const allUsers    = await User.find({});                       // all users
  const admins      = await User.find({ role: 'admin' });        // filter
  const activeAdmins = await User.find({ role: 'admin', isActive: true }); // multiple filters
  ```

- **`Model.findById(id)` finds a single document by its `_id`** — Returns the
  document or `null` if not found.

  ```js
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
  ```

- **`Model.findOne(filter)` finds the first matching document** — Useful when
  querying by a unique field like email.

  ```js
  const user = await User.findOne({ email: req.body.email });
  ```

### Update

- **`Model.findByIdAndUpdate(id, update, options)` finds and updates in one call** —
  Use the `$set` operator to update specific fields without replacing the whole document.
  Always pass `{ new: true }` to get the updated document back (not the old one).

  ```js
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { name: req.body.name, role: req.body.role } }, // only update these fields
    { new: true, runValidators: true }  // return new doc, run schema validations
  );
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
  ```

  Without `$set`, the entire document is replaced (like PUT). With `$set`, only
  specified fields change (like PATCH).

### Delete

- **`Model.findByIdAndDelete(id)` finds and deletes in one operation** — Returns
  the deleted document (or null if not found).

  ```js
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
  ```

---

## 6. Querying — Filters, Sort, Pagination

- **Mongoose query methods chain to build up a query** — `.select()`, `.sort()`,
  `.limit()`, `.skip()` all return the query object, so you chain them.

  ```js
  // Combining filters, field selection, sorting, and pagination:
  const { page = 1, limit = 10, sort = 'name', search } = req.query;

  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' }; // case-insensitive search
  }

  const users = await User
    .find(filter)
    .select('-password -__v')           // exclude password and __v fields
    .sort({ [sort]: 1 })               // sort by field (1 = asc, -1 = desc)
    .skip((Number(page) - 1) * Number(limit)) // skip previous pages
    .limit(Number(limit));              // limit results per page

  const total = await User.countDocuments(filter);

  res.json({
    data:       users,
    total,
    page:       Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
  ```

- **MongoDB comparison operators** — Use these inside `.find()` filters.

  ```js
  User.find({ age: { $gt: 18, $lte: 65 } });  // age > 18 AND age <= 65
  User.find({ role: { $in: ['admin', 'moderator'] } }); // role is one of these
  User.find({ name: { $regex: 'chethan', $options: 'i' } }); // case-insensitive search
  User.find({ $or: [{ email: query }, { name: query }] }); // OR condition
  ```

---

## 7. Data Relationships — Embed vs Reference

MongoDB offers two ways to model related data. Choosing the right one matters for performance.

### Embedding

- **Embedding stores related data directly inside the parent document** — Best
  when the related data is always accessed with the parent and does not need to
  be queried independently.

  ```js
  // Embedded: a post with its comments stored inside
  const postSchema = new Schema({
    title: String,
    body:  String,
    comments: [
      {
        text:      String,
        author:    String,
        createdAt: { type: Date, default: Date.now },
      }
    ]
  });
  // ✅ Fast reads — one query gets post + comments
  // ❌ Can't query comments independently
  // ❌ Document size limit: 16MB (embeds must stay small)
  ```

### Referencing

- **Referencing stores the ID of the related document** — Like a foreign key in SQL.
  Use `populate()` to load the referenced data. Best when related data is large,
  shared between many documents, or queried independently.

  ```js
  // Reference: posts store the author's userId
  const postSchema = new Schema({
    title:  String,
    body:   String,
    author: { type: Schema.Types.ObjectId, ref: 'User' }, // stores user's _id
    tags:   [String],
  });

  const Post = mongoose.model('Post', postSchema);

  // Reading — use populate() to join the referenced document:
  const post = await Post.findById(id)
    .populate('author', 'name email avatar'); // fetch only these fields from User
  console.log(post.author.name); // "Chethan" — fully populated

  // Without populate:
  console.log(post.author); // ObjectId("507f...") — just the ID
  ```

  **Embedding vs Referencing rule of thumb:**
  - Embed: data belongs to one parent (address in a user), always loaded together
  - Reference: data is shared (posts reference a User), large collections, queried independently

---

## 8. Validation & Middleware in Mongoose

- **Mongoose schema middleware (hooks) run before or after operations** —
  The most useful hook is `pre('save')` for hashing passwords before storing.

  ```js
  const bcrypt = require('bcrypt');

  userSchema.pre('save', async function(next) {
    // `this` refers to the document being saved
    if (!this.isModified('password')) return next(); // only hash if password changed

    this.password = await bcrypt.hash(this.password, 12); // 12 salt rounds
    next();
  });

  // Instance method — add to schema for cleaner code:
  userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Usage:
  const user = await User.findOne({ email }).select('+password'); // override select:false
  const isMatch = await user.comparePassword(inputPassword);
  ```

- **Virtual fields are computed properties that are not stored in MongoDB** —
  Useful for derived values like `fullName` from `firstName` + `lastName`.

  ```js
  userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
  });

  // Include virtuals in JSON output:
  userSchema.set('toJSON', { virtuals: true });

  const user = await User.findById(id);
  console.log(user.fullName); // "Chethan Bhat" — not stored, computed on the fly
  ```

---

## 9. Indexing for Performance

- **An index is a data structure that makes lookups on a field fast** — Without an
  index, MongoDB scans every document in the collection (O(n) — slow for large data).
  With an index, it jumps directly to matching documents (O(log n) — fast).

  ```js
  // Schema-level indexes (preferred way):
  const productSchema = new Schema({
    name:  { type: String, index: true },       // single field index
    email: { type: String, unique: true },       // unique index (enforces uniqueness too)
    price: Number,
    category: String,
  });

  // Compound index — for queries that filter on BOTH fields together:
  productSchema.index({ category: 1, price: -1 }); // 1 = ascending, -1 = descending

  // Text index — for full-text search:
  productSchema.index({ name: 'text', description: 'text' });
  // Usage: Product.find({ $text: { $search: 'laptop gaming' } })
  ```

- **Only index fields you actually query on** — Every index costs write performance
  and storage. A general rule: index fields used in `.find()` filters, `.sort()`,
  and join (`populate`) fields.

---

## 10. Exercises

1. **Connection** — Set up a MongoDB Atlas cluster. Connect with Mongoose. Write
   a small script that inserts 5 users and logs them to the console. Disconnect cleanly.

2. **Schema** — Create a `Product` schema with: `name` (required), `price` (required,
   min 0), `category` (enum), `description`, `inStock` (boolean, default true),
   `tags` (array of strings), timestamps.

3. **CRUD** — Replace the in-memory store from Week 10 with MongoDB. Implement all
   5 CRUD routes for the books API using Mongoose.

4. **Relationships** — Add a `Comment` model that references a `Post`. Build endpoints:
   `GET /posts/:id/comments`, `POST /posts/:id/comments`. Use `populate()` to
   include the author's name in comment responses.

5. **Search + Pagination** — Add `?search=`, `?page=`, `?limit=`, `?sort=` support
   to the books API. The search should match title OR author (case-insensitive).
   Response must include `{ data, total, page, totalPages }`.

---

## 11. Milestone Project

### MongoDB-backed Notes API

Build a complete notes REST API backed by MongoDB:

1. **Models**: `User` (name, email, password, avatar) and `Note` (title, content,
   tags[], color, pinned, authorId ref)
2. **All CRUD for notes** — create, read, update, delete
3. **Filtering**: `GET /notes?tag=work&pinned=true&search=meeting`
4. **Pagination**: page + limit
5. **Relationships**: each note's response includes author's name and avatar via `populate()`
6. **Schema validation**: all required fields, enums for color, proper error messages
7. **Pre-save hook**: set `updatedAt` on every save
8. **Index**: compound index on `{ authorId, pinned }` for fast "show my pinned notes" queries

---

## 12. Sources

| Resource | What to Search |
|----------|---------------|
| MongoDB docs | https://www.mongodb.com/docs/manual/introduction |
| Mongoose docs | https://mongoosejs.com/docs/guide.html |
| YouTube | `"Web Dev Simplified — MongoDB Crash Course"`, `"Traversy Media — Mongoose Tutorial"` |
| MongoDB Atlas | https://cloud.mongodb.com |