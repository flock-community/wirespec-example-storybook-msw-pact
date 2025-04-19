import {html, LitElement, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';
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
            <div>
                <h1>Todo App</h1>

                ${this.message ? html`
                    <div>${this.message}</div>` : nothing}

                <div>
                    <label for="todoText">Todo text</label>
                    <input
                            id="todoText"
                            type="text"
                            .value=${this.newTodoText}
                            @input=${(e: InputEvent) => this.newTodoText = (e.target as HTMLInputElement).value}
                            @keyup=${(e: KeyboardEvent) => e.key === 'Enter' && this.addTodo()}
                            placeholder="Add a new todo"
                    >
                    <button
                            @click=${this.addTodo}
                    >
                        Add
                    </button>
                </div>

                <ul>
                    ${this.todos.map(todo => html`
                        <li>
                        <input
                                type="checkbox"
                                .checked=${todo.completed}
                                @change=${() => this.toggleTodo(todo)}
                                id="todo-${todo.id}"
                        >
                        <label for="todo-${todo.id}">${todo.text}</label>
                        <button @click=${() => this.deleteTodo(todo.id)}>✕</button>
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
