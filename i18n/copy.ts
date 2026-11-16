"use client";

import { useCallback, useMemo } from "react";
import { useLocale, useMessages } from "next-intl";
import sourceKeys from "../messages/source-keys.json";

const keys: Record<string, string> = sourceKeys;
export function useCopy() {
  const messages = useMessages() as Record<string, string>;
  const locale = useLocale();
  return useCallback((source: string, values: Record<string, string | number | undefined> = {}) => {
    const messageId = Object.hasOwn(messages, source) ? source : undefined;
    const key = messageId || keys[source.replace(/\s+/g, " ").trim()];
    const text = (locale === "vi" && !messageId) ? source : (key && messages[key]) || source;
    return text.replace(/\{(v\d+)\}/g, (token, name) => String(values[name] ?? token));
  }, [messages, locale]);
}

/** Only use for authored UI data, never for submitted booth or payment data. */
export function useLocalizedData<T>(source: T): T {
  const t = useCopy();
  return useMemo(() => {
    function visit(value: unknown): unknown {
      if (typeof value === "string") return t(value);
      if (Array.isArray(value)) return value.map(visit);
      if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, visit(v)]));
      return value;
    }
    return visit(source) as T;
  }, [source, t]);
}
