const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/todo-app", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const taskSchema = new mongoose.Schema({
  text: String,
  completed: Boolean,
});

const Task = mongoose.model("Task", taskSchema);

// Add a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const newTask = new Task({
      text: req.body.text,
      completed: false,
    });
    await newTask.save();
    res.sendStatus(201);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update a task
app.put("/api/tasks/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { text, completed } = req.body;

    // Find the task by ID and update its text and completed status
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { text, completed },
      { new: true } // Return the updated task
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
