import type {Meta, StoryObj} from '@storybook/web-components';
import {expect, userEvent} from '@storybook/test';

import './todo-app'
import {getWorker} from "msw-storybook-addon";
import {DeleteTodo, GetTodos, PostTodo, PutTodo, GetCurrentUser} from "./gen/endpoint";
import type {Todo, User} from "./gen/model";
import {UserGenerator} from "./gen/generator/UserGenerator";
import {TodoGenerator} from "./gen/generator/TodoGenerator";
import {TodoErrorGenerator} from "./gen/generator/TodoErrorGenerator";
import {kotestWirespecGenerator} from "@flock/wirespec/generator";
import {wirespecMsw} from "./wirespec";
import {Canvas} from "@storybook/csf";

import {html} from "lit";
import {within} from "shadow-dom-testing-library";
import { TodoApp } from './todo-app';

const msw = getWorker();

const meta = {
    title: 'Todo app',
    component: 'todo-app',
    parameters: {
        backgrounds: {
            disable: true,
        },
    },
    render: (args, { globals: { darkMode } }) => {
        return html`<todo-app .darkMode=${darkMode === 'dark'}></todo-app>`;
    },
} satisfies Meta<TodoApp>;

export default meta;
type Story = StoryObj<TodoApp>;

// Deterministic fixtures: a single seeded Wirespec.Generator feeds every
// story so values stay stable across reloads but are sourced entirely from
// the schema-driven generators.
const gen = kotestWirespecGenerator(42);
const user: User = UserGenerator.generate(gen, ["user"]);
const todos: Todo[] = [
    TodoGenerator.generate(gen, ["todos", "0"]),
    TodoGenerator.generate(gen, ["todos", "1"]),
];

export const HappyFlowStory: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const welcomeMessage = await canvas.findByShadowText(`Welcome, ${user.username}`);
        await expect(welcomeMessage).toBeVisible();
    }
};

const fetchError    = TodoErrorGenerator.generate(gen, ["fetchTodos",  "error"]);
const createError   = TodoErrorGenerator.generate(gen, ["createTodo",  "error"]);
const toggleError   = TodoErrorGenerator.generate(gen, ["toggleTodo",  "error"]);
const deleteError   = TodoErrorGenerator.generate(gen, ["deleteTodo",  "error"]);
const createdTodo   = TodoGenerator.generate(gen,      ["createTodo",  "response"]);
const updatedTodo   = TodoGenerator.generate(gen,      ["putOrDelete", "response"]);

export const FetchError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response500({body: fetchError})),
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const error = await canvas.findByShadowText(`Cannot fetch todos: ${fetchError.reason}`)
        await expect(error).toBeVisible()
    }
};

export const CreateTodo: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PostTodo.api, async (req) => {
                // The body is produced by todo-app.ts:addTodo using the user's
                // typed input and a hardcoded date — not from any generator.
                await expect(req.body).toEqual({
                    date: "01-01-2022",
                    description: "new Todo",
                    done: false
                })
                return PostTodo.response200({body: createdTodo});
            }),
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const input = await canvas.findByShadowLabelText('Todo text');
        const button = await canvas.findByShadowRole('button', {name: "Add"});
        await userEvent.type(input, "new Todo")
        await userEvent.click(button)
    }
};

export const CreateTodoError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PostTodo.api, async (req) => {
                await expect(req.body).toEqual({
                    date: "01-01-2022",
                    description: "new Todo",
                    done: false
                })
                return PostTodo.response500({body: createError});
            }),
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const input = await canvas.findByShadowLabelText('Todo text');
        const button = await canvas.findByShadowRole('button', {name: "Add"});
        await userEvent.type(input, "new Todo")
        await userEvent.click(button)

        const error = await canvas.findByShadowText(`Cannot create todo: ${createError.reason}`)
        await expect(error).toBeVisible()
    }
};

export const RemoveTodo: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(DeleteTodo.api, async (req) => {
                await expect(req.path).toEqual({id: String(todos[1].id)})
                return DeleteTodo.response200({body: updatedTodo})
            })
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const todoItems = await canvas.findAllByShadowRole('listitem');
        const deleteButton = await within(todoItems[1]).findByShadowRole("button");
        await deleteButton.click();
    }
};

export const Toggle: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PutTodo.api, async (req) => {
                await expect(req.path).toEqual({id: String(todos[1].id)})
                await expect(req.body).toEqual({
                    description: todos[1].description,
                    done: !todos[1].done,
                    date: todos[1].date,
                })
                return PostTodo.response200({body: updatedTodo})
            })
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const toggle = await canvas.findByShadowLabelText(todos[1].description);
        await toggle.click();
    }
};

export const ToggleError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PutTodo.api, async (req) => {
                await expect(req.path).toEqual({id: String(todos[1].id)})
                await expect(req.body).toEqual({
                    description: todos[1].description,
                    done: !todos[1].done,
                    date: todos[1].date,
                })
                return PutTodo.response500({body: toggleError})
            })
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const toggle = await canvas.findByShadowLabelText(todos[1].description);
        await toggle.click();

        const error = await canvas.findByShadowText(`Cannot toggle todo: ${toggleError.reason}`)
        await expect(error).toBeVisible()
    }
};

export const RemoveTodoError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(DeleteTodo.api, async (req) => {
                await expect(req.path).toEqual({id: String(todos[1].id)})
                return DeleteTodo.response500({body: deleteError})
            })
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const todoItems = await canvas.findAllByShadowRole('listitem');
        const deleteButton = await within(todoItems[1]).findByShadowRole("button");
        await deleteButton.click();

        const error = await canvas.findByShadowText(`Error updating todo: ${deleteError.reason}`)
        await expect(error).toBeVisible()
    }
};

export const UserApiError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response401()),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10}))
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const error = await canvas.findByShadowText("Cannot fetch current user")
        await expect(error).toBeVisible()
    }
};
