type Date = String(/^([0-9]{2}-[0-9]{2}-[0-9]{4})$/g)
type PhoneNumber = String

type Todo {
  @Seed id: Integer,
  description: String,
  done: Boolean,
  phoneNumber: PhoneNumber,
  @Generator("date") date: Date
}

type TodoInput {
  description: String,
  done: Boolean,
  date: Date
}

type TodoError {
  reason: String
}

endpoint GetTodos GET /todos ? { limit:Integer, offset:Integer } -> {
    200 -> Todo[] # {total:Integer}
    500 -> TodoError
}

endpoint PostTodo POST TodoInput /todos -> {
    200 -> Todo
    500 -> TodoError
}

endpoint PutTodo PUT TodoInput /todos/{id: Integer} -> {
    200 -> Todo
    404 -> Unit
    500 -> TodoError
}

endpoint DeleteTodo DELETE /todos/{id: Integer} -> {
    200 -> Todo
    500 -> TodoError
}
