type Date /^([0-9]{2}-[0-9]{2}-[0-9]{4})$/g

type Todo {
  id: Integer,
  description: String,
  done: Boolean,
  date: Date
}

type TodoInput {
  description: String,
  done: Boolean,
  date: Date
}

type Error {
  reason: String
}

endpoint GetTodos GET /todos ? { limit:Integer, offset:Integer } -> {
    200 -> Todo[] # {total:Integer}
    500 -> Error
}

endpoint PostTodo POST TodoInput /todos -> {
    200 -> Todo
    500 -> Error
}

endpoint PutTodo PUT TodoInput /todos/{id: Integer} -> {
    200 -> Todo
    404 -> Unit
    500 -> Error
}

endpoint DeleteTodo DELETE /todos/{id: Integer} -> {
    200 -> Todo
    500 -> Error
}
