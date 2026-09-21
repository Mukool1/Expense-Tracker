import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  ShieldAlert,
  ScanLine,
  Trash2,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useTransactionStore } from "../store/transactionStore";
import { useCategoryStore } from "../store/categoryStore";
import { toast } from "../store/toastStore";
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  Skeleton,
  EmptyState,
  PageHeader,
  Modal,
} from "../components/ui";
import CategoryBadge from "../components/CategoryBadge";
import { formatINR, formatDate } from "../lib/format";

const LIMIT = 12;

function Transactions() {
  const { transactions, loading, fetchTransactions, deleteTransaction } =
    useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch categories once on mount.
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce the merchant search (~300ms); it's applied client-side.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch from the API whenever page / category / date filters change.
  useEffect(() => {
    const params = { page, limit: LIMIT };
    if (categoryId) params.category_id = categoryId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    fetchTransactions(params).catch(() =>
      toast.error("Couldn't load transactions."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryId, dateFrom, dateTo]);

  const visible = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) =>
      (t.merchant || "").toLowerCase().includes(q),
    );
  }, [transactions, debouncedSearch]);

  const filtersActive = Boolean(
    debouncedSearch || categoryId || dateFrom || dateTo,
  );

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      toast.success("Transaction deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Couldn't delete transaction.");
    } finally {
      setDeleting(false);
    }
  };

  const anomalyTitle = (t) =>
    t.anomaly_score != null
      ? `Anomaly score: ${t.anomaly_score}`
      : "Flagged as anomalous";

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every rupee, accounted for."
        actions={
          <Link to="/transactions/new">
            <Button>
              <Plus size={16} />
              Add expense
            </Button>
          </Link>
        }
      />

      {/* Filter bar */}
      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search merchants…"
              aria-label="Search merchants"
              className="pl-10"
            />
          </div>
          <Select
            value={categoryId}
            onChange={handleFilterChange(setCategoryId)}
            aria-label="Filter by category"
            className="w-auto min-w-[150px] flex-1 sm:flex-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={handleFilterChange(setDateFrom)}
            aria-label="From date"
            className="w-auto min-w-[140px] flex-1 sm:flex-none"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={handleFilterChange(setDateTo)}
            aria-label="To date"
            className="w-auto min-w-[140px] flex-1 sm:flex-none"
          />
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <Card className="divide-y divide-slate-200/70 p-4 dark:divide-white/5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={ReceiptText}
            title="No transactions found"
            description={
              filtersActive
                ? "Nothing matches your current filters. Try clearing your filters."
                : "Add your first expense to start tracking your spend."
            }
            action={
              !filtersActive && (
                <Link to="/transactions/new">
                  <Button>
                    <Plus size={16} />
                    Add expense
                  </Button>
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <>
          <Card className="divide-y divide-slate-200/70 overflow-hidden dark:divide-white/5">
            <AnimatePresence initial={false}>
              {visible.map((t, index) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(index * 0.03, 0.3),
                  }}
                  className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5"
                >
                  <div className="shrink-0">
                    <CategoryBadge
                      name={t.category?.name || "Uncategorized"}
                      size="md"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      {t.merchant || "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(t.transaction_date)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatINR(t.amount)}
                    </p>
                    <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                      {t.is_anomaly && (
                        <span title={anomalyTitle(t)}>
                          <Badge tone="red">
                            <ShieldAlert size={12} />
                            Anomaly
                          </Badge>
                        </span>
                      )}
                      {t.source === "scan" && (
                        <Badge tone="violet">
                          <ScanLine size={12} />
                          Scanned
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    aria-label={`Delete transaction ${t.merchant || ""}`}
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <Trash2 size={17} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </Card>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {visible.length} transaction
              {visible.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                Prev
              </Button>
              <span className="px-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                Page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={transactions.length < LIMIT}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => (deleting ? null : setDeleteTarget(null))}
        title="Delete transaction?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {deleteTarget?.merchant}
          </span>{" "}
          (
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatINR(deleteTarget?.amount)}
          </span>
          )? This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}

export default Transactions;
