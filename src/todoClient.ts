import {getCurrentUserClient} from "./gen/client/GetCurrentUserClient";
import {getTodosClient} from "./gen/client/GetTodosClient";
import {postTodoClient} from "./gen/client/PostTodoClient";
import {putTodoClient} from "./gen/client/PutTodoClient";
import {deleteTodoClient} from "./gen/client/DeleteTodoClient";
import {serialization, transportation} from "./wirespec";

export const userClient = {
    ...getCurrentUserClient(serialization, transportation),
};

export const todoClient = {
    ...getTodosClient(serialization, transportation),
    ...postTodoClient(serialization, transportation),
    ...putTodoClient(serialization, transportation),
    ...deleteTodoClient(serialization, transportation),
};
