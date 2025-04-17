import {GetTodos, PostTodo, DeleteTodo, PutTodo} from "./gen/Todo";
import {wirespecClient} from "./wirespec";

export const client = wirespecClient(
    GetTodos.api,
    PostTodo.api,
    PutTodo.api,
    DeleteTodo.api
)


