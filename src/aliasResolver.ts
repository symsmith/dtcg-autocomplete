import type { ParsedToken } from "./tokenParser";

const ALIAS_RE = /^\{(.+)\}$/;

export function resolveValue(
  value: string,
  byDotPath: Map<string, ParsedToken>,
  depth = 0,
  maxDepth = 10,
): string {
  if (depth >= maxDepth) return value;
  const match = ALIAS_RE.exec(value);
  if (!match) return value;
  const token = byDotPath.get(match[1]);
  if (!token) return value;
  return resolveValue(token.rawValue, byDotPath, depth + 1, maxDepth);
}

export function resolveTerminalToken(
  token: ParsedToken,
  byDotPath: Map<string, ParsedToken>,
  depth = 0,
  maxDepth = 10,
): ParsedToken {
  if (depth >= maxDepth) return token;
  const match = ALIAS_RE.exec(token.rawValue);
  if (!match) return token;
  const next = byDotPath.get(match[1]);
  if (!next) return token;
  return resolveTerminalToken(next, byDotPath, depth + 1, maxDepth);
}

export function resolveChain(
  value: string,
  byDotPath: Map<string, ParsedToken>,
  depth = 0,
  maxDepth = 10,
): string[] {
  if (depth >= maxDepth) return [value];
  const match = ALIAS_RE.exec(value);
  if (!match) return [value];
  const token = byDotPath.get(match[1]);
  if (!token) return [value];
  return [value, ...resolveChain(token.rawValue, byDotPath, depth + 1, maxDepth)];
}
