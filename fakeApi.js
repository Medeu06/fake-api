const STORAGE_KEY = 'items_app_data';

const initialItems = [
  {
    id: '1',
    title: 'MacBook Pro 16',
    description: 'Мощный ноутбук для разработки и работы с графикой.',
    category: 'Электроника',
    price: 2400,
    status: 'available',
    rating: 4.9,
    createdAt: '2026-01-15'
  },
  {
    id: '2',
    title: 'Механическая клавиатура',
    description: 'Беспроводная клавиатура с Gateron Yellow переключателями.',
    category: 'Периферия',
    price: 120,
    status: 'available',
    rating: 4.7,
    createdAt: '2026-02-10'
  }
];

const getStored = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialItems));
    return initialItems;
  }
  return JSON.parse(data);
};

const saveStored = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

window.fakeApi = {
  getItems: async () => {
    await delay(500);
    return getStored().map(({ id, title, price, status }) => ({ id, title, price, status }));
  },

  getItemById: async (id) => {
    await delay(800);
    const item = getStored().find((i) => i.id === id);
    if (!item) throw new Error('Элемент не найден');
    return item;
  },

  createItem: async (data) => {
    await delay(500);
    const items = getStored();
    const newItem = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] };
    items.push(newItem);
    saveStored(items);
    return newItem;
  },

  updateItem: async (id, fields) => {
    await delay(500);
    const items = getStored();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Не найден');
    items[index] = { ...items[index], ...fields };
    saveStored(items);
    return items[index];
  },

  deleteItem: async (id) => {
    await delay(400);
    saveStored(getStored().filter((i) => i.id !== id));
    return true;
  }
};
