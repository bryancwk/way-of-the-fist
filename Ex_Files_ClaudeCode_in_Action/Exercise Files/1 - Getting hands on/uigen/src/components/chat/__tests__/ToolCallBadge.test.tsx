import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolCallLabel, ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolCallLabel ---

test("getToolCallLabel: str_replace_editor create", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating /App.jsx");
});

test("getToolCallLabel: str_replace_editor str_replace", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })).toBe("Editing /components/Card.jsx");
});

test("getToolCallLabel: str_replace_editor insert", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/App.jsx" })).toBe("Editing /App.jsx");
});

test("getToolCallLabel: str_replace_editor view", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Viewing /App.jsx");
});

test("getToolCallLabel: file_manager rename", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming /old.jsx → /new.jsx");
});

test("getToolCallLabel: file_manager delete", () => {
  expect(getToolCallLabel("file_manager", { command: "delete", path: "/App.jsx" })).toBe("Deleting /App.jsx");
});

test("getToolCallLabel: unknown tool falls back to toolName", () => {
  expect(getToolCallLabel("some_other_tool", { command: "unknown" })).toBe("some_other_tool");
});

test("getToolCallLabel: str_replace_editor with no args falls back to toolName", () => {
  expect(getToolCallLabel("str_replace_editor", {})).toBe("str_replace_editor");
});

// --- ToolCallBadge rendering ---

test("ToolCallBadge shows label and emerald dot when done", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  const dot = document.querySelector(".bg-emerald-500");
  expect(dot).toBeTruthy();
});

test("ToolCallBadge shows label and spinner when pending", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  const spinner = document.querySelector(".animate-spin");
  expect(spinner).toBeTruthy();
});

test("ToolCallBadge falls back to toolName for unknown args", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolName: "str_replace_editor",
        args: {},
        state: "result",
        result: "Success",
      }}
    />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
