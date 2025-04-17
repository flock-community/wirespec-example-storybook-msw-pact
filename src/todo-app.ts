import {html, LitElement, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {styleMap} from 'lit/directives/style-map.js';
import {client} from "./client";
import {DeleteTodo, GetTodos, PostTodo, PutTodo} from "./gen/Todo";

type TodoItem = {
    id: string;
    text: string;
    date: string;
    completed: boolean;
}

@customElement('todo-app')
export class TodoApp extends LitElement {

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
            return html`<h1>${this.error}</h1>`
        }
        return html`
            <div class="container mx-auto p-4 max-w-md">
                <h1 class="text-3xl font-bold mb-4">Todo App</h1>

                ${this.message ? html`
                    <div class="text-red-500">${this.message}</div>` : nothing}

                <div class="flex gap-2 mb-4">
                    <label for="todoText">Todo text</label>
                    <input
                            id="todoText"
                            type="text"
                            .value=${this.newTodoText}
                            @input=${(e: InputEvent) => this.newTodoText = (e.target as HTMLInputElement).value}
                            @keyup=${(e: KeyboardEvent) => e.key === 'Enter' && this.addTodo()}
                            class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Add a new todo"
                    >
                    <button
                            @click=${this.addTodo}
                            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none"
                    >
                        Add
                    </button>
                </div>

                <ul class="space-y-2">
                    ${this.todos.map(todo => html`
                        <li
                                class="flex items-center gap-2 p-2 border rounded-lg"
                                style=${styleMap({
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        backgroundColor: todo.completed ? '#f3f4f6' : 'white'
                    })}>
                        <input
                                type="checkbox"
                                .checked=${todo.completed}
                                @change=${() => this.toggleTodo(todo)}
                                class="h-5 w-5"
                                id="todo-${todo.id}"
                        >
                        <label for="todo-${todo.id}" class="flex-1">${todo.text}</label>
                        <button @click=${() => this.deleteTodo(todo.id)}
                                class="text-red-500 hover:text-red-700">✕</button>
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