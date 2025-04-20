import {html, LitElement, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {client} from "./client";
import {DeleteTodo, GetTodos, PostTodo, PutTodo} from "./gen/Todo";
import {withTailwind} from "./tailwind-utils";

type TodoItem = {
    id: string;
    text: string;
    date: string;
    completed: boolean;
}

@customElement('todo-app')
export class TodoApp extends withTailwind(LitElement) {

    @state()
    private todos: TodoItem[] = [];

    @state()
    private message: string | undefined = undefined;

    @state()
    private error: string | undefined = undefined;

    @state()
    private newTodoText: string = '';

    async connectedCallback() {
        super.connectedCallback();
        await this.load()
    }

    private async load(){
        const req = GetTodos.request({
            limit: 10,
            offset: 0,
        })
        const res = await client.getTodos(req)
        if (res.status == 200) {
            this.todos = res.body.map(it => ({
                id: it.id.toString(),
                text: it.description,
                date: it.date,
                completed: it.done
            }))
        } else {
            this.error = `Cannot fetch todos: ${res.body.reason}`
        }
    }

    render() {
        if (this.error) {
            return html`<div class="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
                <h1 class="text-xl font-bold text-red-600">${this.error}</h1>
            </div>`
        }
        return html`
            <div class="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
                <h1 class="text-2xl font-bold text-center text-blue-600 mb-4">Todo App</h1>

                ${this.message ? html`
                    <div class="p-2 mb-4 bg-blue-100 text-blue-700 rounded">${this.message}</div>` : nothing}

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="todoText">Todo text</label>
                    <div class="flex">
                        <input
                                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="todoText"
                                type="text"
                                .value=${this.newTodoText}
                                @input=${(e: InputEvent) => this.newTodoText = (e.target as HTMLInputElement).value}
                                @keyup=${(e: KeyboardEvent) => e.key === 'Enter' && this.addTodo()}
                                placeholder="Add a new todo"
                        >
                        <button
                                class="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                @click=${this.addTodo}
                        >
                            Add
                        </button>
                    </div>
                </div>

                <ul class="bg-white rounded-lg border border-gray-200 w-full text-gray-900">
                    ${this.todos.map(todo => html`
                        <li class="px-6 py-2 border-b border-gray-200 w-full rounded-t-lg flex items-center">
                        <input
                                class="form-checkbox h-5 w-5 text-blue-600"
                                type="checkbox"
                                .checked=${todo.completed}
                                @change=${() => this.toggleTodo(todo)}
                                id="todo-${todo.id}"
                        >
                        <label class="ml-2 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}" for="todo-${todo.id}">${todo.text}</label>
                        <button class="ml-auto bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline" @click=${() => this.deleteTodo(todo.id)}>✕</button>
                        </li>
                    `)}
                </ul>
            </div>
        `;
    }

    private async addTodo() {
        const req = PostTodo.request({
            body: {
                description: this.newTodoText,
                done: false,
                date: "01-01-2022"
            }
        })
        const res = await client.postTodo(req)
        if (res.status === 200) {
            this.newTodoText = '';
        } else {
            this.message = `Cannot create todo: ${res.body.reason}`
        }
    }

    private async toggleTodo(it: TodoItem) {
        const req = PutTodo.request({
            id: parseInt(it.id),
            body: {
                description: it.text,
                done: !it.completed,
                date: it.date
            }
        })
        const res = await client.putTodo(req)
        if (res.status === 200) {
            await this.load()
        } else if(res.status === 500) {
            this.message = `Cannot toggle todo: ${res.body.reason}`
        } else {
            this.message = `Cannot toggle todo`
        }
    }

    private async deleteTodo(id: string) {
        const req = DeleteTodo.request({id: parseInt(id)})
        const res = await client.deleteTodo(req)
        if (res.status === 200) {
            this.message = "Successfully deleted todo"
        } else {
            this.message = `Error updating todo: ${res.body.reason}`
        }
    }
}
