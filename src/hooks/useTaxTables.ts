// Hook to load and cache tax tables from external JSON
// Shows version info and handles loading/error states

import { useState, useEffect } from 'react';
import { fetchTaxTables, getCachedTables, getCachedVersion } from '../utils/taxTables';
import type { TaxTables } from '../utils/taxTables';

export interface TaxTablesState {
  tables: TaxTables | null;
  version: string | null;
  loading: boolean;
  error: boolean;
}

export function useTaxTables(): TaxTablesState {
  const [state, setState] = useState<TaxTablesState>(() => {
    const cached = getCachedTables();
    return {
      tables: cached,
      version: cached?.version ?? getCachedVersion(),
      loading: !cached,
      error: false,
    };
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tables = await fetchTaxTables(import.meta.env.BASE_URL ?? '/');
      if (cancelled) return;

      if (tables) {
        setState({ tables, version: tables.version, loading: false, error: false });
      } else {
        // Fetch failed — use cache if available
        const cached = getCachedTables();
        setState({
          tables: cached,
          version: cached?.version ?? getCachedVersion(),
          loading: false,
          error: !cached,
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
