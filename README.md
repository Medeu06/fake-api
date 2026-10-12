# Fake API for Async Requests Practice

A simple fake API for practicing asynchronous requests.

The API simulates a real server using JavaScript Promises, random delays, and occasional errors. Data is stored in the browser's `localStorage`, so changes remain after refreshing the page.

**No backend, database server, or additional libraries are required.**

## 1. Features

- Get a list of items with search, sorting, and pagination.
- Get an item by ID.
- Create, update, and delete items.
- Simulate network delays and server errors.
- Save data in `localStorage`.

Each item has the following structure:

```json
{
  "id": 1,
  "name": "Vendor The Vendest",
  "description": "Restores customers buying power to the space stations benefits",
}
```

## 2. Adding the API to Your React Project

You can use this fake API in your existing React application.

**Step 1.** Copy the fake API files into your React project's `src` directory.

For example:

```text
my-react-app/
├── src/
│   ├── api/
│   │   ├── fakeApi.js
│   │   ├── settings.js
│   │   └── initial-data-sample.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── index.html
```

Keep the original file structure or update the import paths accordingly.

**Step 2.** Import the API functions into your React components.

```jsx
import { getItemsList, getItem, updateItem } from "./api/fakeApi";
```

**Step 3.** Call the API functions like regular asynchronous requests.

```js
const result = await getItemsList();
console.log(result.data);
```

You do not need to start a separate server.

## 3. Available API Functions

| Function | Description | Simulated HTTP request |
|---|---|---|
| `getItemsList(query)` | Get items with search, sorting, and pagination | GET /items |
| `getItem(id)` | Get one item | GET /items/:id |
| `createItem(data)` | Create an item | POST /items |
| `updateItem(id, changes)` | Update an item | PATCH /items/:id |
| `deleteItem(id)` | Delete an item | DELETE /items/:id |

### Get Items

```js
const result = await getItemsList("?page=1&limit=10");

console.log(result.data);
```

The response contains:

```js
{
  data: [...],
  total: 45,
  page: 1,
  limit: 10,
  totalPages: 5
}
```

Search and sorting:

```js
await getItemsList("?search=john");

await getItemsList("?sort=name-desc");

await getItemsList("?search=robot&page=2&limit=5");
```

### Get One Item

```js
const item = await getItem(1);
```

### Create an Item

```js
const item = await createItem({
  name: "Patrick",
  description: "A star",
});
```

### Update an Item

```js
const updated = await updateItem(1, {
  completed: true,
});
```

### Delete an Item

```js
await deleteItem(1);
```



## 4. Simulating Network Conditions

Open `settings.js`:

```js
export const API_CONFIG = {
  minDelay: 500,
  maxDelay: 3000,
  errorChance: 0.05,
};

export const DATA_KEY = "fake-api-data";
```

Configuration:

| Setting | Description |
|---|---|
| `minDelay` | Minimum request delay in milliseconds |
| `maxDelay` | Maximum request delay in milliseconds |
| `errorChance` | Probability of a simulated server error (0–1) |
| `DATA_KEY` | Key used to store data in localStorage |

For example:

```js
errorChance: 0.3
```

Approximately 30% of requests will fail.

To disable random errors:

```js
errorChance: 0
```

To experiment with race conditions, increase the difference between minimum and maximum delays.

## 5. Handling Errors

Every API function returns a Promise and may reject with an error.

Use `try/catch`:

```js
try {
  const item = await getItem(999);
  console.log(item);
} catch (error) {
  console.error(error.message);
}
```

Possible errors include:

```text
Simulated server Error
Item not found
```

## 6. How localStorage Works

The API uses `initial-data-sample.js` to initialize its database.

On the first request, the data is already available in `localStorage`.

When you create, update, or delete items, changes are saved automatically.

Refreshing the page does not reset the data.

To restore the original data:

1. Open browser Developer Tools.
2. Go to Application → Local Storage (or Storage in Firefox).
3. Delete the entry corresponding to `DATA_KEY`.
4. Refresh the page.

The API will initialize the database again using `initial-data-sample.js`.

**Important:** Data is stored separately in each browser. It is not shared between users or devices.

## 7. Rules for the Homework

Use the provided API as if it were a real backend.

- Call API functions asynchronously.
- Use `useEffect` for loading data and reacting to changes.
- Handle loading, error, empty, and success states.
- Implement cleanup and prevent race conditions.
- Do not access `localStorage` directly from React components.
- Do not modify the fake API implementation.
- Do not use custom hooks or debouncing for this task.

The purpose is to practice **React state, Effects, asynchronous operations, and cleanup**, not backend development.
