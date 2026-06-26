"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args: Record<string, any>;
  state: string;
  result?: any;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function getToolCallLabel(toolName: string, args: Record<string, any>): string {
  if (toolName === "str_replace_editor") {
    const { command, path } = args;
    if (command === "create" && path) return `Creating ${path}`;
    if (command === "str_replace" && path) return `Editing ${path}`;
    if (command === "insert" && path) return `Editing ${path}`;
    if (command === "view" && path) return `Viewing ${path}`;
  }

  if (toolName === "file_manager") {
    const { command, path, new_path } = args;
    if (command === "rename" && path && new_path) return `Renaming ${path} → ${new_path}`;
    if (command === "delete" && path) return `Deleting ${path}`;
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const label = getToolCallLabel(toolName, args);
  const isDone = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
