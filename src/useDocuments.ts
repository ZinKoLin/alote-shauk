import { useCallback, useEffect, useRef, useState } from "react";
import { emptyDocuments } from "./documents";
import type { Documents } from "./documents";
import {
  clearDocuments,
  DOCUMENT_SESSION_KEY,
  loadDocuments,
  saveDocuments,
  touchDocuments,
} from "./documentStorage";

export function useDocuments(updatedAt: number, onChange: () => void) {
  const [documents, setDocuments] = useState<Documents>(emptyDocuments);
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const [resetVersion, setResetVersion] = useState(0);
  const session = useRef<string | null>(null);
  const version = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const initialVersion = version.current;
    const initialize = async () => {
      try {
        let id = sessionStorage.getItem(DOCUMENT_SESSION_KEY);
        if (!id) {
          id = crypto.randomUUID();
          sessionStorage.setItem(DOCUMENT_SESSION_KEY, id);
        }
        session.current = id;
        const record = await loadDocuments(id);
        if (!cancelled && initialVersion === version.current && record)
          setDocuments(record.documents);
      } catch {
        if (!cancelled) setPersistent(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !updatedAt || !session.current) return;
    const timeout = setTimeout(() => {
      void touchDocuments(session.current!, updatedAt).catch(() =>
        setPersistent(false),
      );
    }, 600);
    return () => clearTimeout(timeout);
  }, [ready, updatedAt]);

  const replace = useCallback(
    async (next: Documents) => {
      const currentVersion = ++version.current;
      if (session.current) {
        try {
          await saveDocuments(session.current, next, Date.now());
          setPersistent(true);
        } catch {
          setPersistent(false);
        }
      }
      if (currentVersion !== version.current) return;
      setDocuments(next);
      onChange();
    },
    [onChange],
  );

  const clear = useCallback(() => {
    version.current++;
    setResetVersion((value) => value + 1);
    setDocuments(emptyDocuments());
    if (session.current)
      void clearDocuments(session.current).catch(() => setPersistent(false));
  }, []);

  return { documents, ready, persistent, resetVersion, replace, clear };
}
