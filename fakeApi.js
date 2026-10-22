import { API_CONFIG, DATA_KEY } from "./settings.js";
import { initialDataSample } from "./initial-data-sample.js";

function fakeRequest(operation, options = {}) {
  const {
    minDelay = API_CONFIG.minDelay,
    maxDelay = API_CONFIG.maxDelay,
    errorChance = API_CONFIG.errorChance,
  } = options;

  return new Promise((resolve, reject) => {
    const delayMS =
      Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    setTimeout(() => {
      if (Math.random() < errorChance) {
        reject(new Error("Simulated server Error"));
        return;
      }

      try {
        resolve(operation());
      } catch (error) {
        reject(error);
      }
    }, delayMS);
  });
}

function initializeDatabase() {
  if (!localStorage.getItem(DATA_KEY)) {
    localStorage.setItem(DATA_KEY, JSON.stringify(initialDataSample));
  }
}

function readData() {
  return JSON.parse(localStorage.getItem(DATA_KEY) || "[]");
}

function writeData(items) {
  localStorage.setItem(DATA_KEY, JSON.stringify(items));
}

initializeDatabase();

export async function getItemsList(query = "") {
  return fakeRequest(() => {
    const params = new URLSearchParams(query);
    const search = params.get("search");
    const sort = params.get("sort") || "name";

    let items = readData();

    if (search) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    items = [...items].sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return {
      data: items,
      total: items.length,
    };
  });
}

export async function getItem(id) {
  return fakeRequest(() => {
    const items = readData();
    const item = items.find((item) => item.id === Number(id));

    if (!item) {
      throw new Error("Item not found");
    }

    return item;
  });
}

export async function createItem(data) {
  return fakeRequest(() => {
    const items = readData();
    const nextId =
      items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;

    const newItem = {
      id: nextId,
      name: data.name || "Unnamed",
      description: data.description || "",
      role: data.role || "Member",
      status: data.status || "Available",
      level: Number(data.level) || 1,
      email: data.email || "user@example.com",
      active: data.active !== undefined ? Boolean(data.active) : true,
    };

    writeData([...items, newItem]);
    return newItem;
  });
}

export async function updateItem(id, changes) {
  return fakeRequest(() => {
    const numericId = Number(id);
    const items = readData();

    const exists = items.some((item) => item.id === numericId);
    if (!exists) {
      throw new Error("Item not found");
    }

    const updatedItems = items.map((item) =>
      item.id === numericId
        ? {
            ...item,
            ...changes,
            id: numericId,
          }
        : item
    );

    writeData(updatedItems);
    return updatedItems.find((item) => item.id === numericId);
  });
}

export async function deleteItem(id) {
  return fakeRequest(() => {
    const numericId = Number(id);
    const items = readData();

    const exists = items.some((item) => item.id === numericId);
    if (!exists) {
      throw new Error("Item not found");
    }

    const updatedItems = items.filter((item) => item.id !== numericId);
    writeData(updatedItems);

    return { success: true, id: numericId };
  });
}
