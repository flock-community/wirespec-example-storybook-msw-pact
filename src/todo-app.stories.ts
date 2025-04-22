import type {Meta, StoryObj} from '@storybook/web-components';
import {expect, userEvent} from '@storybook/test';

import './todo-app'
import {getWorker} from "msw-storybook-addon";
import {DeleteTodo, GetTodos, PostTodo, PutTodo, Todo} from "./gen/todo/Todo";
import {wirespecMsw} from "./wirespec";
import {Canvas} from "@storybook/csf";

import {html} from "lit";
import {within} from "shadow-dom-testing-library";
import { TodoApp } from './todo-app';
import {GetCurrentUser, User} from "./gen/user/User";

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

const user: User = {
    id: 1,
    email: "pieter@mail.com",
    username: "pietter"
}
const todos: Todo[] = [
    {"id": 1, "description": "Todo 1", "done": true, "date": "01-01-2022"},
    {"id": 2, "description": "Todo 2", "done": false, "date": "01-02-2022"}
]

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

export const FetchError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response500({body: {reason: "server error"}})),
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const error = await canvas.findByShadowText("Cannot fetch todos: server error")
        await expect(error).toBeVisible()
    }
};

export const CreateTodo: Story = {
    async beforeEach() {
        const newTodo: Todo =
            {"id": 3, "description": "Todo1", "done": true, "date": "01-03-2022"}

        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PostTodo.api, async (req) => {
                await expect(req.body).toEqual({
                    date: "01-01-2022",
                    description: "new Todo",
                    done: false
                })
                return PostTodo.response200({body: newTodo});
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
                return PostTodo.response500({body: {reason: "Server sleeps"}});
            }),
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const input = await canvas.findByShadowLabelText('Todo text');
        const button = await canvas.findByShadowRole('button', {name: "Add"});
        await userEvent.type(input, "new Todo")
        await userEvent.click(button)

        const error = await canvas.findByShadowText("Cannot create todo: Server sleeps")
        await expect(error).toBeVisible()
    }
};

export const RemoveTodo: Story = {
    async beforeEach() {
        const todo = {"id": 2, "description": "Todo1", "done": true, "date": "01-03-2022"}
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(DeleteTodo.api, async (req) => {
                await expect(req.path).toEqual({id: "2"})
                return DeleteTodo.response200({body: todo})
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
        const todo = {"id": 2, "description": "Todo1", "done": true, "date": "01-03-2022"}
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PutTodo.api, async (req) => {
                await expect(req.path).toEqual({id: "2"})
                await expect(req.body).toEqual({description: 'Todo 2', done: true, date: '01-02-2022'})
                return PostTodo.response200({body: todo})
            })
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const toggle = await canvas.findByShadowLabelText("Todo 2");
        await toggle.click();
    }
};

export const ToggleError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PutTodo.api, async (req) => {
                await expect(req.path).toEqual({id: "2"})
                await expect(req.body).toEqual({description: 'Todo 2', done: true, date: '01-02-2022'})
                return PutTodo.response500({body: {reason: "Server error during toggle"}})
            })
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const toggle = await canvas.findByShadowLabelText("Todo 2");
        await toggle.click();

        const error = await canvas.findByShadowText("Cannot toggle todo: Server error during toggle")
        await expect(error).toBeVisible()
    }
};

export const RemoveTodoError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetCurrentUser.api, async () => GetCurrentUser.response200({body: user})),
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(DeleteTodo.api, async (req) => {
                await expect(req.path).toEqual({id: "2"})
                return DeleteTodo.response500({body: {reason: "Server error during deletion"}})
            })
        )
    },
    play: async ({mount}) => {
        const canvas = await mount() as unknown as Canvas;
        const todoItems = await canvas.findAllByShadowRole('listitem');
        const deleteButton = await within(todoItems[1]).findByShadowRole("button");
        await deleteButton.click();

        const error = await canvas.findByShadowText("Error updating todo: Server error during deletion")
        await expect(error).toBeVisible()
    }
};
