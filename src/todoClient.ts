import {GetTodos, PostTodo, DeleteTodo, PutTodo} from "./gen/todo/Todo";
import {GetCurrentUser} from "./gen/user/User";
import {wirespecClient} from "./wirespec";

export const userClient = wirespecClient(
    GetCurrentUser.api,
)

export const todoClient = wirespecClient(
    GetTodos.api,
    PostTodo.api,
    PutTodo.api,
    DeleteTodo.api
)


