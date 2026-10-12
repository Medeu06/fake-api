import {
  getItemsList,
  getItem,
  createItem,
  updateItem,
  deleteItem,
} from "./fakeApi.js";

async function getFakes() {
  const button = document.getElementById("demos");

  button.disabled = true;
  button.textContent = "Running API demo...";

  console.clear();
  console.log("=== FAKE API DEMO ===");

  try {
    // 1. GET ITEMS LIST
    console.log("\n1. GET /items");

    const list = await getItemsList("?page=1&limit=5");

    console.log("Items:", list.data);
    console.log("Pagination:", {
      total: list.total,
      page: list.page,
      totalPages: list.totalPages,
    });

    // 2. GET ITEM BY ID
    console.log("\n2. GET /items/:id");

    const firstId = list.data[0]?.id;

    if (firstId !== undefined) {
      const item = await getItem(firstId);
      console.log("Item:", item);
    }

    // 3. CREATE ITEM
    console.log("\n3. POST /items");

    const created = await createItem({
      name: "Evil Potato",
      description: "Universe has sprouted a giant potato.",
    });

    console.log("Created:", created);

    // 4. UPDATE ITEM
    console.log("\n4. PATCH /items/:id");

    const updated = await updateItem(created.id, {
      name: "Evil Potato King",
      description: "The potato has evolved!",
    });

    console.log("Updated:", updated);

    // 5. DELETE ITEM
    console.log("\n5. DELETE /items/:id");

    const deleted = await deleteItem(created.id);

    console.log("Deleted:", deleted);

    // 6. TEST ERROR HANDLING
    console.log("\n6. GET NON-EXISTING ITEM");

    try {
      await getItem(-999);
    } catch (error) {
      console.log("Expected error:", error.message);
    }

    // 7. GET ITEMS WITH SEARCH
    console.log("\n7. GET /items?search=doe");

    const searchResult = await getItemsList("?search=doe");

    console.log("Search results:", searchResult.data);

    console.log("\n=== DEMO FINISHED ===");
  } catch (error) {
    console.error("API request failed:", error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Run API Demo";
  }
}

const button = document.getElementById("demos");

button.textContent = "Run API Demo";
button.addEventListener("click", getFakes);
