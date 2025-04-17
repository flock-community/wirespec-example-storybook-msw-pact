import type {Meta, StoryObj} from '@storybook/web-components';
import {expect, userEvent} from '@storybook/test';

import './todo-app'
import {getWorker} from "msw-storybook-addon";
import {DeleteTodo, GetTodos, PostTodo, PutTodo, Todo} from "./gen/Todo";
import {wirespecMsw} from "./wirespec";
import {Canvas} from "@storybook/csf";

import {html} from "lit";
import {within} from "shadow-dom-testing-library";

const msw = getWorker();

const meta = {
    title: 'Todo app',
    render: () => html`
        <todo-app></todo-app>`,
} satisfies Meta<unknown>;

export default meta;
type Story = StoryObj<unknown>;

const todos: Todo[] = [
    {"id": 1, "description": "Todo 1", "done": true, "date": "01-01-2022"},
    {"id": 2, "description": "Todo 2", "done": false, "date": "01-02-2022"}
]

export const HappyFlowStory: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
        )
    }
};

export const FetchError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetTodos.api, async () => GetTodos.response500({body: {reason: "server error"}})),
        )
    },
    play: async ({mount}) => {
        // @ts-ignore
        const canvas: Canvas = await mount();
        const error = await canvas.findByShadowText("Cannot fetch todos: server error")
        await expect(error).toBeVisible()
    }
};

export const CreateTodo: Story = {
    async beforeEach() {
        const newTodo: Todo =
            {"id": 3, "description": "Todo1", "done": true, "date": "01-03-2022"}

        msw.use(
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
        // @ts-ignore
        const canvas: Canvas = await mount();
        const input = await canvas.findByShadowLabelText('Todo text');
        const button = await canvas.findByShadowRole('button', {name: "Add"});
        await userEvent.type(input, "new Todo")
        await userEvent.click(button)
    }
};

export const CreateTodoError: Story = {
    async beforeEach() {
        msw.use(
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PostTodo.api, async (req) => {
                console.log(req.body)
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
        // @ts-ignore
        const canvas: Canvas = await mount();
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
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(DeleteTodo.api, async (req) => {
                await expect(req.path).toEqual({id: "2"})
                return DeleteTodo.response200({body: todo})
            })
        )
    },
    play: async ({mount}) => {
        // @ts-ignore
        const canvas: Canvas = await mount();
        const todoItems = await canvas.findAllByShadowRole('listitem');
        const deleteButton = await within(todoItems[1]).findByShadowRole("button");
        await deleteButton.click();
    }
};

export const Toggle: Story = {
    async beforeEach() {
        const todo = {"id": 2, "description": "Todo1", "done": true, "date": "01-03-2022"}
        msw.use(
            wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10})),
            wirespecMsw(PutTodo.api, async (req) => {
                await expect(req.path).toEqual({id: "2"})
                await expect(req.body).toEqual({description: 'Todo 2', done: true, date: '01-02-2022'})
                return PostTodo.response200({body: todo})
            })
        )
    },
    play: async ({mount}) => {
        // @ts-ignore
        const canvas: Canvas = await mount();
        const toggle = await canvas.findByShadowLabelText("Todo 2");
        await toggle.click();
    }
};
