const { useState, useEffect } = React;

function App() {
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const [actionPendingId, setActionPendingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '', description: '', category: '', price: '', status: 'available', rating: 5
  });

  // 1. Загрузка списка
  const loadList = () => {
    setListLoading(true);
    setListError(null);
    // Используем метод из fakeApi.js
    fakeApi.getItems()
      .then(setItems)
      .catch((err) => setListError(err.message))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  // 2. Загрузка деталей с ЗАЩИТОЙ ОТ RACE CONDITION
  useEffect(() => {
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }

    let isCancelled = false; // Флаг отмены
    setDetailsLoading(true);
    setDetailsError(null);

    fakeApi.getItemById(selectedId)
      .then((data) => {
        if (!isCancelled) setSelectedItem(data);
      })
      .catch((err) => {
        if (!isCancelled) setDetailsError(err.message);
      })
      .finally(() => {
        if (!isCancelled) setDetailsLoading(false);
      });

    return () => {
      isCancelled = true; // Cleanup функция предотвращает перезапись при быстром переключении
    };
  }, [selectedId]);

  // 3. Изменение статуса с ЗАЩИТОЙ ОТ STALE CLOSURES
  const handleToggleStatus = (targetId, currentStatus) => {
    setActionPendingId(targetId);
    const newStatus = currentStatus === 'available' ? 'archived' : 'available';

    fakeApi.updateItem(targetId, { status: newStatus })
      .then(() => {
        setItems((prev) => prev.map((item) => (item.id === targetId ? { ...item, status: newStatus } : item)));
        setSelectedItem((prev) => (prev && prev.id === targetId ? { ...prev, status: newStatus } : prev));
      })
      .catch((err) => alert(err.message))
      .finally(() => setActionPendingId(null));
  };

  // 4. Удаление элемента
  const handleDelete = (targetId) => {
    setActionPendingId(targetId);
    fakeApi.deleteItem(targetId)
      .then(() => {
        setItems((prev) => prev.filter((i) => i.id !== targetId));
        if (selectedId === targetId) setSelectedId(null);
      })
      .catch((err) => alert(err.message))
      .finally(() => setActionPendingId(null));
  };

  // 5. Обработка формы (Create / Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData, price: Number(formData.price), rating: Number(formData.rating) };

    if (editingId) {
      fakeApi.updateItem(editingId, payload).then((updated) => {
        loadList();
        if (selectedId === editingId) setSelectedItem(updated);
        resetForm();
      });
    } else {
      fakeApi.createItem(payload).then(() => {
        loadList();
        resetForm();
      });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', category: '', price: '', status: 'available', rating: 5 });
    setEditingId(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Items App (Effects & API)</h1>

      {/* Форма создания/редактирования */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        <input placeholder="Название" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
        <input placeholder="Категория" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
        <input type="number" placeholder="Цена" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
        <input type="number" step="0.1" placeholder="Рейтинг" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} required />
        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
          <option value="available">available</option>
          <option value="archived">archived</option>
        </select>
        <input placeholder="Описание" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required style={{ flex: '1 1 100%' }} />
        <button type="submit">{editingId ? 'Сохранить' : 'Создать'}</button>
        {editingId && <button type="button" onClick={resetForm}>Отмена</button>}
      </form>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Список товаров */}
        <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2>Список</h2>
            <button onClick={loadList} disabled={listLoading}>Reload List 🔄</button>
          </div>

          {listLoading && <p>Загрузка списка...</p>}
          {listError && <p style={{ color: 'red' }}>Ошибка: {listError}</p>}
          {!listLoading && items.length === 0 && <p>Список пуст</p>}

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: selectedId === item.id ? '#e6f7ff' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span><b>{item.title}</b> — ${item.price} [{item.status}]</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button disabled={actionPendingId === item.id} onClick={(e) => { e.stopPropagation(); handleToggleStatus(item.id, item.status); }}>
                    Status
                  </button>
                  <button disabled={actionPendingId === item.id} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Детали товара */}
        <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h2>Детали</h2>
          {!selectedId && <p>Выберите элемент из списка</p>}
          {detailsLoading && <p>Загрузка деталей...</p>}
          {detailsError && <p style={{ color: 'red' }}>Ошибка: {detailsError}</p>}

          {!detailsLoading && selectedItem && (
            <div>
              <h3>{selectedItem.title}</h3>
              <p><b>ID:</b> {selectedItem.id}</p>
              <p><b>Категория:</b> {selectedItem.category}</p>
              <p><b>Цена:</b> ${selectedItem.price}</p>
              <p><b>Рейтинг:</b> ⭐ {selectedItem.rating}</p>
              <p><b>Статус:</b> {selectedItem.status}</p>
              <p><b>Дата:</b> {selectedItem.createdAt}</p>
              <p><b>Описание:</b> {selectedItem.description}</p>
              <button onClick={() => {
                setEditingId(selectedItem.id);
                setFormData({
                  title: selectedItem.title,
                  description: selectedItem.description,
                  category: selectedItem.category,
                  price: selectedItem.price,
                  status: selectedItem.status,
                  rating: selectedItem.rating
                });
              }}>Редактировать</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Рендерим компонент в HTML
ReactDOM.render(<App />, document.getElementById('root'));
