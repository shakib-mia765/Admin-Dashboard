import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
const DEFAULT_PAGE_SIZE = 10;
const INTERACTIVE = 'a,button,input,select,textarea,[role="button"]';
const SORT = Object.freeze({ ASC: 'asc', DESC: 'desc' });
const ALIGN = Object.freeze({ left: 'text-left', center: 'text-center', right: 'text-right' });
const cx = (...classes) => classes.filter(Boolean).join(' ');
const valueOf = (row, column) =>
  typeof column.accessor === 'function' ? column.accessor(row) : row?.[column.accessor];
const normalizeValue = value => {
  if (value == null) return '';
  if (value instanceof Date) return value.getTime();
  return typeof value === 'string' ? value.trim().toLocaleLowerCase() : value;
};
const compareValues = (left, right, direction) => {
  const a = normalizeValue(left);
  const b = normalizeValue(right);
  const result =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  return direction === SORT.ASC ? result : -result;
};
const prepareColumns = columns =>
  columns.map((column, index) => ({
    id: column.id ?? String(column.accessor ?? index),
    header: column.header ?? '',
    accessor: column.accessor ?? column.id,
    align: column.align ?? 'left',
    sortable: column.sortable !== false,
    searchable: column.searchable !== false,
    ...column,
  }));

const Spinner = () => (
  <span
    aria-hidden="true"
    className="size-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400"
  />
);

const Skeleton = ({ columns, rows }) => (
  <tbody aria-busy="true">
    {Array.from({ length: rows }, (_, rowIndex) => (
      <tr key={rowIndex} className="border-t border-slate-800">
        {columns.map(column => (
          <td key={column.id} className="px-4 py-3">
            <div className="h-4 animate-pulse rounded bg-slate-800" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

const Pagination = ({ page, pageCount, pageSize, total, onChange }) => {
  const start = total ? page * pageSize + 1 : 0;
  const end = Math.min((page + 1) * pageSize, total);
  const actions = [
    { label: 'Previous', target: page - 1, disabled: page === 0 },
    { label: 'Next', target: page + 1, disabled: !pageCount || page >= pageCount - 1 },
  ];
  return (
    <footer className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="text-sm text-slate-400">
        Showing {start}-{end} of {total}
      </p>
      <nav aria-label="Table pagination" className="flex items-center gap-2">
        {actions.map(action => (
          <button
            key={action.label}
            type="button"
            disabled={action.disabled}
            onClick={() => onChange(action.target)}
            className="h-9 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
        <span className="min-w-16 text-center text-sm text-slate-400">
          {pageCount ? page + 1 : 0}/{pageCount}
        </span>
      </nav>
    </footer>
  );
};

const DataTable = ({
  columns = [], data = [], loading = false, searchable = true, paginated = true,
  pageSize = DEFAULT_PAGE_SIZE, skeletonRows = 5, caption = 'Data table',
  emptyMessage = 'No records found.', searchPlaceholder = 'Search records...',
  rowKey = 'id', onRefresh, onRefreshError, onRowClick,
}) => {
  const mounted = useRef(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState({ columnId: null, direction: SORT.ASC });
  const safeData = Array.isArray(data) ? data : [];
  const safeColumns = Array.isArray(columns) ? columns : [];
  const size = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const prepared = useMemo(() => prepareColumns(safeColumns), [safeColumns]);
  const searchableColumns = useMemo(() => prepared.filter(column => column.searchable), [prepared]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return safeData;
    return safeData.filter(row =>
      searchableColumns.some(column =>
        String(valueOf(row, column) ?? '').toLocaleLowerCase().includes(term),
      ),
    );
  }, [query, safeData, searchableColumns]);
  const sorted = useMemo(() => {
    const column = prepared.find(item => item.id === sort.columnId);
    if (!column) return filtered;
    return [...filtered].sort((left, right) => {
      const result =
        typeof column.sort === 'function'
          ? column.sort(left, right, sort.direction)
          : compareValues(valueOf(left, column), valueOf(right, column), sort.direction);
      return Number.isFinite(result) ? result : 0;
    });
  }, [filtered, prepared, sort]);
  const pageCount = paginated ? Math.ceil(sorted.length / size) : Number(Boolean(sorted.length));
  const visibleRows = useMemo(() => {
    if (!paginated) return sorted;
    const start = page * size;
    return sorted.slice(start, start + size);
  }, [page, paginated, size, sorted]);
  useEffect(() => () => { mounted.current = false; }, []);
  useEffect(() => {
    setPage(current => Math.min(current, Math.max(pageCount - 1, 0)));
  }, [pageCount]);
  const handleSort = useCallback(column => {
    if (!column.sortable) return;
    setSort(current => ({
      columnId: column.id,
      direction: current.columnId === column.id && current.direction === SORT.ASC ? SORT.DESC : SORT.ASC,
    }));
    setPage(0);
  }, []);
  const handleRefresh = useCallback(async () => {
    if (typeof onRefresh !== 'function' || refreshing) return;
    setRefreshing(true);
    try { await Promise.resolve(onRefresh()); }
    catch (error) { onRefreshError?.(error); }
    finally { if (mounted.current) setRefreshing(false); }
  }, [onRefresh, onRefreshError, refreshing]);
  const changePage = useCallback(next => {
    setPage(Math.min(Math.max(next, 0), Math.max(pageCount - 1, 0)));
  }, [pageCount]);
  const activateRow = useCallback((event, row) => {
    if (!onRowClick || event.target.closest(INTERACTIVE)) return;
    onRowClick(row);
  }, [onRowClick]);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
      {(searchable || onRefresh) && (
        <header className="flex gap-3 border-b border-slate-800 p-4">
          {searchable && (
            <input
              type="search" value={query} aria-label="Search table" placeholder={searchPlaceholder}
              onChange={event => { setQuery(event.target.value); setPage(0); }}
              className="h-10 w-full max-w-sm rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          )}
          {onRefresh && (
            <button type="button" disabled={refreshing} onClick={handleRefresh}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50">
              {refreshing && <Spinner />}{refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </header>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-950/70"><tr>
            {prepared.map(column => {
              const active = sort.columnId === column.id;
              const ariaSort = column.sortable ? active ? sort.direction === SORT.ASC ? 'ascending' : 'descending' : 'none' : undefined;
              return (
                <th key={column.id} scope="col" aria-sort={ariaSort}
                  className={cx('px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400', ALIGN[column.align] ?? ALIGN.left)}>
                  {column.sortable ? (
                    <button type="button" onClick={() => handleSort(column)} className="inline-flex items-center gap-2 hover:text-slate-100">
                      {column.header}<span aria-hidden="true">{active && sort.direction === SORT.DESC ? '↓' : '↑'}</span>
                    </button>
                  ) : column.header}
                </th>
              );
            })}
          </tr></thead>
          {loading ? <Skeleton columns={prepared} rows={Math.max(skeletonRows, 1)} /> : visibleRows.length ? (
            <tbody>{visibleRows.map((row, rowIndex) => (
              <tr key={typeof rowKey === 'function' ? rowKey(row, rowIndex) : row?.[rowKey] ?? `${page}-${rowIndex}`}
                tabIndex={onRowClick ? 0 : undefined} onClick={event => activateRow(event, row)}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateRow(event, row); } }}
                className={cx('border-t border-slate-800 transition', onRowClick ? 'cursor-pointer hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400' : 'hover:bg-slate-800/30')}>
                {prepared.map(column => {
                  const value = valueOf(row, column);
                  return <td key={column.id} className={cx('px-4 py-3 text-sm text-slate-300', ALIGN[column.align] ?? ALIGN.left)}>
                    {typeof column.cell === 'function' ? column.cell({ value, row, rowIndex }) : value ?? '—'}
                  </td>;
                })}
              </tr>
            ))}</tbody>
          ) : <tbody><tr><td colSpan={Math.max(prepared.length, 1)} className="px-4 py-14 text-center text-sm text-slate-400">{emptyMessage}</td></tr></tbody>}
        </table>
      </div>
      {paginated && !loading && <Pagination page={page} pageCount={pageCount} pageSize={size} total={sorted.length} onChange={changePage} />}
    </section>
  );
};

export default DataTable;