const { useState, useEffect, createElement: e } = React;

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

  const loadList = () => {
    setListLoading(true);
    setListError(null);
    window.fakeApi.getItems()
      .then(setItems)
      .catch((err) => setListError(err.message))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  // Загрузка деталей + Защита от Race Conditions
  useEffect(() => {
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }

    let isCancelled = false;
    setDetailsLoading(true);
    setDetailsError(null);

    window.fakeApi.getItemById(selectedId)
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
      isCancelled = true;
    };
  }, [selectedId]);

  // Изменение статуса + Защита от Stale Closures
  const handleToggleStatus = (targetId, currentStatus) => {
    setActionPendingId(targetId);
    const newStatus = currentStatus === 'available' ? 'archived' : 'available';

    window.fakeApi.updateItem(targetId, { status: newStatus })
      .then(() => {
        setItems((prev) => prev.map((item) => (item.id === targetId ? { ...item, status: newStatus } : item)));
        setSelectedItem((prev) => (prev && prev.id === targetId ? { ...prev, status: newStatus } : prev));
      })
      .catch((err) => alert(err.message))
      .finally(() => setActionPendingId(null));
  };

  const handleDelete = (targetId) => {
    setActionPendingId(targetId);
    window.fakeApi.deleteItem(targetId)
      .then(() => {
        setItems((prev) => prev.filter((i) => i.id !== targetId));
        if (selectedId === targetId) setSelectedId(null);
      })
      .catch((err) => alert(err.message))
      .finally(() => setActionPendingId(null));
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const payload = { ...formData, price: Number(formData.price), rating: Number(formData.rating) };

    if (editingId) {
      window.fakeApi.updateItem(editingId, payload).then((updated) => {
        loadList();
        if (selectedId === editingId) setSelectedItem(updated);
        resetForm();
      });
    } else {
      window.fakeApi.createItem(payload).then(() => {
        loadList();
        resetForm();
      });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', category: '', price: '', status: 'available', rating: 5 });
    setEditingId(null);
  };

  return e('div', { style: { padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' } },
    e('h1', null, 'Items App (Async React & Effects)'),

    // Форма
    e('form', { onSubmit: handleSubmit, style: { marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#f5f5f5', padding: '15px', borderRadius: '8px' } },
      e('input', { placeholder: 'Название', value: formData.title, onChange: (ev) => setFormData({ ...formData, title: ev.target.value }), required: true }),
      e('input', { placeholder: 'Категория', value: formData.category, onChange: (ev) => setFormData({ ...formData, category: ev.target.value }), required: true }),
      e('input', { type: 'number', placeholder: 'Цена', value: formData.price, onChange: (ev) => setFormData({ ...formData, price: ev.target.value }), required: true }),
      e('input', { type: 'number', step: '0.1', placeholder: 'Рейтинг', value: formData.rating, onChange: (ev) => setFormData({ ...formData, rating: ev.target.value }), required: true }),
      e('select', { value: formData.status, onChange: (ev) => setFormData({ ...formData, status: ev.target.value }) },
        e('option', { value: 'available' }, 'available'),
        e('option', { value: 'archived' }, 'archived')
      ),
      e('input', { placeholder: 'Описание', value: formData.description, onChange: (ev) => setFormData({ ...formData, description: ev.target.value }), required: true, style: { flex: '1 1 100%' } }),
      e('button', { type: 'submit' }, editingId ? 'Сохранить' : 'Создать'),
      editingId && e('button', { type: 'button', onClick: resetForm }, 'Отмена')
    ),

    // Контент
    e('div', { style: { display: 'flex', gap: '20px' } },
      // Список
      e('div', { style: { flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' } },
        e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } },
          e('h2', null, 'Список'),
          e('button', { onClick: loadList, disabled: listLoading }, 'Reload List 🔄')
        ),
        listLoading && e('p', null, 'Загрузка списка...'),
        listError && e('p', { style: { color: 'red' } }, 'Ошибка: ' + listError),
        !listLoading && items.length === 0 && e('p', null, 'Список пуст'),
        e('ul', { style: { listStyle: 'none', padding: 0 } },
          items.map((item) =>
            e('li', {
              key: item.id,
              onClick: () => setSelectedId(item.id),
              style: {
                padding: '10px', marginBottom: '8px', border: '1px solid #eee', borderRadius: '4px',
                cursor: 'pointer', background: selectedId === item.id ? '#e6f7ff' : '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }
            },
              e('span', null, e('b', null, item.title), ` — $${item.price} [${item.status}]`),
              e('div', { style: { display: 'flex', gap: '5px' } },
                e('button', { disabled: actionPendingId === item.id, onClick: (ev) => { ev.stopPropagation(); handleToggleStatus(item.id, item.status); } }, 'Status'),
                e('button', { disabled: actionPendingId === item.id, onClick: (ev) => { ev.stopPropagation(); handleDelete(item.id); } }, 'Delete')
              )
            )
          )
        )
      ),

      // Детали
      e('div', { style: { flex: 1, border: '1px solid #ddd', padding: '15px', borderRadius: '8px' } },
        e('h2', null, 'Детали'),
        !selectedId && e('p', null, 'Выберите элемент из списка'),
        detailsLoading && e('p', null, 'Загрузка деталей...'),
        detailsError && e('p', { style: { color: 'red' } }, 'Ошибка: ' + detailsError),
        !detailsLoading && selectedItem && e('div', null,
          e('h3', null, selectedItem.title),
          e('p', null, e('b', null, 'ID: '), selectedItem.id),
          e('p', null, e('b', null, 'Категория: '), selectedItem.category),
          e('p', null, e('b', null, 'Цена: '), `$${selectedItem.price}`),
          e('p', null, e('b', null, 'Рейтинг: '), `⭐ ${selectedItem.rating}`),
          e('p', null, e('b', null, 'Статус: '), selectedItem.status),
          e('p', null, e('b', null, 'Дата: '), selectedItem.createdAt),
          e('p', null, e('b', null, 'Описание: '), selectedItem.description),
          e('button', {
            onClick: () => {
              setEditingId(selectedItem.id);
              setFormData({
                title: selectedItem.title, description: selectedItem.description,
                category: selectedItem.category, price: selectedItem.price,
                status: selectedItem.status, rating: selectedItem.rating
              });
            }
          }, 'Редактировать')
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(e(App));
