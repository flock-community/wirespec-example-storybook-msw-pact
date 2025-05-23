import {html, LitElement, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {todoClient, userClient} from "./todoClient";
import {DeleteTodo, GetTodos, PostTodo, PutTodo} from "./gen/todo/Todo";
import {withTailwind} from "./tailwind-utils";
import {GetCurrentUser} from "./gen/user/User";


type LoggedInUser = {
    name: string;
}

type TodoItem = {
    id: string;
    text: string;
    date: string;
    completed: boolean;
}

@customElement('todo-app')
export class TodoApp extends withTailwind(LitElement) {

    @property({type: Boolean, reflect: true})
    darkMode = false;

    @state()
    private todos: TodoItem[] = [];

    @state()
    private user?: LoggedInUser = undefined;

    @state()
    private message: string | undefined = undefined;

    @state()
    private error: string | undefined = undefined;

    @state()
    private newTodoText: string = '';

    async connectedCallback() {
        super.connectedCallback();
        await Promise.all([
            this.loadTodo(),
            this.loadUser()
        ])
    }

    private async loadUser(){
        const req = GetCurrentUser.request()
        const res = await userClient.getCurrentUser(req)
        if (res.status == 200) {
            this.user = {
                name: res.body.username
            }
        } else {
            this.error = `Cannot fetch current user`
        }
    }

    private async loadTodo(){
        const req = GetTodos.request({
            limit: 10,
            offset: 0,
        })
        const res = await todoClient.getTodos(req)
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

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.requestUpdate();
    }

    render() {
        const containerClass = this.darkMode ? 'dark' : '';

        if (this.error) {
            return html`<div class="${containerClass}">
                <div class="p-4 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <h1 class="text-xl font-bold text-red-600 dark:text-red-400">${this.error}</h1>
                </div>
            </div>`
        }
        return html`
            <div class="${containerClass}">
                <div class="p-4 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h1 class="text-2xl font-bold text-blue-600 dark:text-blue-400">Todo App</h1>
                            ${this.user ? html`
                                <p class="text-sm text-gray-600 dark:text-gray-400">Welcome, ${this.user.name}</p>
                            ` : nothing}
                        </div>
                        <button 
                            class="p-2 bg-gray-200 dark:bg-gray-600 rounded-full"
                            @click=${this.toggleDarkMode}
                        >
                            ${this.darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>

                    ${this.message ? html`
                        <div class="p-2 mb-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">${this.message}</div>` : nothing}

                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" for="todoText">Todo text</label>
                        <div class="flex">
                            <input
                                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline"
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

                    <ul class="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 w-full text-gray-900 dark:text-gray-100">
                        ${this.todos.map(todo => html`
                            <li class="px-6 py-2 border-b border-gray-200 dark:border-gray-600 w-full rounded-t-lg flex items-center">
                            <input
                                    class="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400"
                                    type="checkbox"
                                    .checked=${todo.completed}
                                    @change=${() => this.toggleTodo(todo)}
                                    id="todo-${todo.id}"
                            >
                            <label class="ml-2 ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}" for="todo-${todo.id}">${todo.text}</label>
                            <button class="ml-auto bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline" @click=${() => this.deleteTodo(todo.id)}>✕</button>
                            </li>
                        `)}
                    </ul>
                </div>
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
        const res = await todoClient.postTodo(req)
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
        const res = await todoClient.putTodo(req)
        if (res.status === 200) {
            await this.loadTodo()
        } else if(res.status === 500) {
            this.message = `Cannot toggle todo: ${res.body.reason}`
        } else {
            this.message = `Cannot toggle todo`
        }
    }

    private async deleteTodo(id: string) {
        const req = DeleteTodo.request({id: parseInt(id)})
        const res = await todoClient.deleteTodo(req)
        if (res.status === 200) {
            this.message = "Successfully deleted todo"
        } else {
            this.message = `Error updating todo: ${res.body.reason}`
        }
    }
}
