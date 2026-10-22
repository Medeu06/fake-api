import React, { useState, useEffect } from "react";
import {
  getItemsList,
  getItem,
  createItem,
  updateItem,
  deleteItem,
} from "./fakeApi.js";
import "./App.css";

export default function App() {
  // Список и общий статус
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Выбранный элемент и его подробности
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Формы создания и редактирования
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    role: "Guardian",
    status: "Available",
    level: 1,
    email: "",
    active: true,
  });

  // 1. ЗАГРУЗКА СПИСКА ЭЛЕМЕНТОВ (useEffect + Cleanup)
  useEffect(() => {
    let isCancelled = false;
    setListLoading(true);
    setListError(null);

    getItemsList()
      .then((res) => {
        if (!isCancelled) {
          setItems(res.data);
          setListLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setListError(err.message);
          setListLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [reloadTrigger]);

  // 2. ЗАГРУЗКА ПОДРОБНОСТЕЙ ЭЛЕМЕНТА (Защита от Race Conditions)
  useEffect(() => {
    if (!selectedId) {
      setSelectedDetails(null);
      return;
    }

    let isCancelled = false;
    setDetailsLoading(true);
    setDetailsError(null);

    getItem(selectedId)
      .then((data) => {
        if (!isCancelled) {
          setSelectedDetails(data);
          setDetailsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setDetailsError(err.message);
          setDetailsLoading(false);
        }
      });

    // Cleanup предотвращает отображение устаревших данных при быстрой смене карточек
    return () => {
      isCancelled = true;
    };
  }, [selectedId]);

  // Хэндлеры для формы
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Перезагрузка списка
  const handleReload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  // СОЗДАНИЕ или РЕДАКТИРОВАНИЕ
  const handleSubmitForm = (e) => {
    e.preventDefault();
    setActionLoading(true);

    if (editingId) {
      // Защита от stale closures — явно передаем targetId
      const targetId = editingId;
      updateItem(targetId, formData)
        .then((updated) => {
          setItems((prev) =>
            prev.map((item) => (item.id === targetId ? updated : item))
          );
          if (selectedId === targetId) {
            setSelectedDetails(updated);
          }
          resetForm();
        })
        .catch((err) => alert(`Error updating: ${err.message}`))
        .finally(() => setActionLoading(false));
    } else {
      createItem(formData)
        .then((created) => {
          setItems((prev) => [...prev, created]);
          resetForm();
        })
        .catch((err) => alert(`Error creating: ${err.message}`))
        .finally(() => setActionLoading(false));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      role: "Guardian",
      status: "Available",
      level: 1,
      email: "",
      active: true,
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      role: item.role || "Guardian",
      status: item.status || "Available",
      level: item.level || 1,
      email: item.email || "",
      active: item.active !== undefined ? item.active : true,
    });
  };

  // УДАЛЕНИЕ ЭЛЕМЕНТА
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setActionLoading(true);

    deleteItem(id)
      .then(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
          setSelectedDetails(null);
        }
      })
      .catch((err) => alert(`Error deleting: ${err.message}`))
      .finally(() => setActionLoading(false));
  };

  // ОБНОВЛЕНИЕ СТАТУСА (Быстрое действие, Защита от Stale Closure)
  const handleToggleStatus = (targetItem) => {
    const targetId = targetItem.id; // Захватываем ID на момент клика
    const newStatus = targetItem.status === "Available" ? "Busy" : "Available";

    setActionLoading(true);
    updateItem(targetId, { status: newStatus })
      .then((updated) => {
        setItems((prev) =>
          prev.map((item) => (item.id === targetId ? updated : item))
        );
        if (selectedId === targetId) {
          setSelectedDetails(updated);
        }
      })
      .catch((err) => alert(`Error updating status: ${err.message}`))
      .finally(() => setActionLoading(false));
  };

  return (
    <div className="container">
      <h1>Async React: Items Manager</h1>

      <div className="top-bar">
        <button onClick={handleReload} disabled={listLoading || actionLoading}>
          🔄 Reload List
        </button>
      </div>

      <div className="layout">
        {/* ЛЕВАЯ КОЛОНКА: Список элементов */}
        <div className="card">
          <h2>Items List</h2>

          {listLoading && <p className="loading">Loading items...</p>}
          {listError && <p className="error">Error: {listError}</p>}

          {!listLoading && !listError && items.length === 0 && (
            <p className="empty">No items found. Create one!</p>
          )}

          <ul className="item-list">
            {items.map((item) => (
              <li
                key={item.id}
                className={selectedId === item.id ? "active" : ""}
                onClick={() => setSelectedId(item.id)}
              >
                <div>
                  <strong>{item.name}</strong> — {item.status}
                </div>
                <div className="actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(item);
                    }}
                    disabled={actionLoading}
                  >
                    Toggle Status
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(item);
                    }}
                    disabled={actionLoading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* СРЕДНЯЯ КОЛОНКА: Детали выбранного элемента */}
        <div className="card">
          <h2>Item Details</h2>
          {!selectedId && <p>Select an item to view details.</p>}

          {detailsLoading && (
            <p className="loading">Loading details for ID {selectedId}...</p>
          )}
          {detailsError && <p className="error">Error: {detailsError}</p>}

          {!detailsLoading && !detailsError && selectedDetails && (
            <div className="details-box">
              <p>
                <strong>1. ID:</strong> {selectedDetails.id}
              </p>
              <p>
                <strong>2. Name:</strong> {selectedDetails.name}
              </p>
              <p>
                <strong>3. Description:</strong> {selectedDetails.description}
              </p>
              <p>
                <strong>4. Role:</strong> {selectedDetails.role}
              </p>
              <p>
                <strong>5. Status:</strong> {selectedDetails.status}
              </p>
              <p>
                <strong>6. Level:</strong> {selectedDetails.level}
              </p>
              <p>
                <strong>7. Email:</strong> {selectedDetails.email}
              </p>
              <p>
                <strong>8. Active:</strong>{" "}
                {selectedDetails.active ? "Yes" : "No"}
              </p>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: Форма Создания/Редактирования */}
        <div className="card">
          <h2>{editingId ? "Edit Item" : "Create New Item"}</h2>
          <form onSubmit={handleSubmitForm}>
            <label>Name:</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />

            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />

            <label>Role:</label>
            <input
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            />

            <label>Status:</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Offline">Offline</option>
            </select>

            <label>Level:</label>
            <input
              type="number"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              min="1"
            />

            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
              />
              Active Status
            </label>

            <div className="form-buttons">
              <button type="submit" disabled={actionLoading}>
                {editingId ? "Update Item" : "Create Item"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
