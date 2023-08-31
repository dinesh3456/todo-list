const addTaskButton = document.getElementById("addTaskButton");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const editModal = document.getElementById("editModal");
const editTaskInput = document.getElementById("editTaskInput");
const saveEditButton = document.getElementById("saveEditButton");
const cancelEditButton = document.getElementById("cancelEditButton");

addTaskButton.addEventListener("click", addTask);

function addTask() {
  const taskText = taskInput.value;
  if (taskText) {
    fetch("http://127.0.0.1:3000/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: taskText }),
    })
      .then((response) => {
        if (response.status === 201) {
          return response.text(); // Return the response text
        } else {
          throw new Error("Error adding task");
        }
      })
      .then((responseText) => {
        // Handle the response text
        if (responseText === "Created") {
          // Task added successfully, update the UI
          const li = createTaskElement({ text: taskText }); // Assuming createTaskElement is a function to create task elements
          taskList.appendChild(li);
          taskInput.value = "";
        } else {
          throw new Error("Unexpected response");
        }
      })
      .catch((error) => console.error("Error:", error));
  }
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.dataset.taskId = task._id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", () => markTaskAsCompleted(li, checkbox));

  const taskTextElement = document.createElement("span");
  taskTextElement.classList.add("taskText");
  taskTextElement.textContent = task.text;
  if (task.completed) {
    taskTextElement.classList.add("completed");
  }

  const editButton = document.createElement("button");
  editButton.classList.add("editButton");
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => openEditModal(li));

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("deleteButton");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteTask(li));

  li.appendChild(checkbox);
  li.appendChild(taskTextElement);
  li.appendChild(editButton);
  li.appendChild(deleteButton);

  return li;
}

function openEditModal(li) {
  const span = li.querySelector(".taskText");
  const originalText = span.textContent;

  editTaskInput.value = originalText; // Set the input value
  editModal.style.display = "block";
  const saveEditHandler = async () => {
    const newText = editTaskInput.value.trim();
    if (newText !== originalText) {
      const checkbox = li.querySelector("input[type=checkbox]");
      const isCompleted = checkbox.checked;

      try {
        const taskId = li.dataset.taskId;
        const response = await fetch(
          `http://127.0.0.1:3000/api/tasks/${taskId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: newText, completed: isCompleted }),
          }
        );

        if (response.ok) {
          span.textContent = newText;
          closeEditModal();
        } else {
          console.error(
            "Error updating task in the database. Server returned:",
            response.status
          );
          const errorResponse = await response.json();
          console.error("Error details:", errorResponse);
        }
      } catch (error) {
        console.error("Error updating task:", error);
      }
    } else {
      closeEditModal();
    }

    saveEditButton.removeEventListener("click", saveEditHandler);
  };

  saveEditButton.addEventListener("click", saveEditHandler);
  cancelEditButton.addEventListener("click", closeEditModal);
}

// Rest of your code remains unchanged

taskList.addEventListener("click", (event) => {
  if (event.target.type === "checkbox") {
    // Check the type attribute
    const li = event.target.closest("li");
    const taskTextElement = li.querySelector(".taskText");
    if (event.target.checked) {
      taskTextElement.style.color = "grey";
    } else {
      taskTextElement.style.color = ""; // Reset to default color
    }
  }
});

taskList.addEventListener("change", async (event) => {
  if (event.target.type === "checkbox") {
    const li = event.target.closest("li");
    const taskId = li.dataset.taskId;
    const isCompleted = event.target.checked;

    // Update Local Storage with the task's completed status and color
    const color = isCompleted ? "grey" : "";
    localStorage.setItem(
      taskId,
      JSON.stringify({ completed: isCompleted, color: color })
    );

    // Update the task text color
    updateTaskColor(li, isCompleted);

    // Update the completed status in the backend
    try {
      const updatedTask = await saveCompletedStatusInBackend(
        taskId,
        isCompleted
      );

      if (updatedTask) {
        // Update the UI with the updated task data
        const taskTextElement = li.querySelector(".taskText");
        taskTextElement.classList.toggle("completed", updatedTask.completed);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  }
});

async function saveCompletedStatusInBackend(taskId, newCompletedStatus) {
  try {
    const response = await fetch(`http://127.0.0.1:3000/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed: newCompletedStatus }),
    });

    if (response.ok) {
      const updatedTask = await response.json();
      console.log(
        "Task completed status updated successfully in the database."
      );
      return updatedTask;
    } else {
      console.error(
        "Error updating task completed status in the database. Server returned:",
        response.status
      );
      const errorResponse = await response.json();
      console.error("Error details:", errorResponse);
      return null;
    }
  } catch (error) {
    console.error("Error updating task completed status:", error);
    return null;
  }
}

async function markTaskAsCompleted(li, checkbox) {
  try {
    const taskId = li.dataset.taskId;
    const newCompletedStatus = checkbox.checked;

    const response = await fetch(`http://127.0.0.1:3000/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed: newCompletedStatus }),
    });
    //console.log("Response:", response);

    if (response.ok) {
      const updatedTask = await response.json();
      const taskTextElement = li.querySelector(".taskText");
      taskTextElement.classList.toggle("completed", updatedTask.completed);
    } else {
      console.error(
        "Error updating task status in the database. Server returned:",
        response.status
      );
      const errorResponse = await response.json();
      console.error("Error details:", errorResponse);
    }
  } catch (error) {
    console.error("Error updating task status:", error);
  }
}

async function saveEdit(li, span, originalText, isCompleted) {
  const newText = editTaskInput.value.trim();

  if (newText !== originalText) {
    const taskId = li.dataset.taskId;

    try {
      // Update task text in backend
      await updateTaskTextInBackend(taskId, newText);

      // Update the task text directly in the frontend
      span.textContent = newText;
      closeEditModal();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  } else {
    closeEditModal();
  }
}

async function updateTaskTextInBackend(taskId, newText) {
  try {
    const response = await fetch(`http://127.0.0.1:3000/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: newText }),
    });

    if (!response.ok) {
      console.error(
        "Error updating task text in the database. Server returned:",
        response.status
      );
    }
  } catch (error) {
    console.error("Error updating task text:", error);
  }
}

function closeEditModal() {
  editModal.style.display = "none";
  saveEditButton.removeEventListener("click", saveEdit);
  cancelEditButton.removeEventListener("click", closeEditModal);
}

async function deleteTask(li) {
  const taskId = li.dataset.taskId;
  deleteTaskInBackend(taskId); // Call function to delete in backend

  // Remove the task from the UI
  taskList.removeChild(li);
}

function toggleEditMode(li) {
  const taskTextElement = li.querySelector(".taskText");
  const editInput = document.createElement("input");
  editInput.value = taskTextElement.textContent;
  editInput.classList.add("editInput");

  // Replace the task text element with the edit input
  li.replaceChild(editInput, taskTextElement);

  editInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      saveEdit(li, editInput);
    } else if (event.key === "Escape") {
      closeEditModal();
    }
  });

  editInput.focus();
}

function deleteTaskInBackend(taskId) {
  fetch(`http://127.0.0.1:3000/api/tasks/${taskId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.status !== 204) {
        console.error("Error deleting task");
      }
    })
    .catch((error) => console.error("Error:", error));
}

function updateTaskColor(li, completed) {
  const taskTextElement = li.querySelector(".taskText");
  taskTextElement.style.color = completed ? "grey" : "";
}

// Fetch and display tasks from the backend
async function fetchAndDisplayTasks() {
  try {
    const response = await fetch("http://127.0.0.1:3000/api/tasks");
    if (response.ok) {
      const tasks = await response.json();
      taskList.innerHTML = ""; // Clear the existing tasks

      tasks.forEach((task) => {
        const li = createTaskElement(task);
        taskList.appendChild(li);

        // Retrieve completed status and color from Local Storage and set checkbox state and color
        const storedData = localStorage.getItem(task._id);
        if (storedData) {
          const { completed, color } = JSON.parse(storedData);
          const checkbox = li.querySelector("input[type=checkbox]");
          checkbox.checked = completed;

          // Update the task text color
          updateTaskColor(li, completed);
        }
      });
    } else {
      console.error("Error fetching tasks:", response.statusText);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Call the fetchAndDisplayTasks function initially
fetchAndDisplayTasks();
