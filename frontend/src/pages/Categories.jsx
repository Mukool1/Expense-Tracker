import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Tags } from "lucide-react";
import { useCategoryStore } from "../store/categoryStore";
import { useTransactionStore } from "../store/transactionStore";
import {
  Button,
  Card,
  Input,
  Badge,
  Skeleton,
  EmptyState,
  PageHeader,
  Modal,
} from "../components/ui";
import { categoryStyle } from "../lib/categoryStyle";
import { toast } from "../store/toastStore";
import { formatINRCompact } from "../lib/format";

function CategoryCard({ category, stats, index, onDelete }) {
  const style = categoryStyle(category.name);
  const Icon = style.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
    >
      <Card hover className="relative overflow-hidden">
        <div
          className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${style.gradient}`}
        />
        <div className="p-5 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.soft}`}
            >
              <Icon size={24} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete ${category.name}`}
              onClick={() => onDelete(category)}
              className="shrink-0 !px-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 size={16} />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {category.name}
            </h3>
            {category.is_default && <Badge>Default</Badge>}
          </div>

          <div className="mt-4 flex items-center gap-6 border-t border-slate-200/70 pt-4 dark:border-white/10">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {stats.count}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stats.count === 1 ? "transaction" : "transactions"}
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatINRCompact(stats.total)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                total, all time
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function Categories() {
  const { categories, loading, fetchCategories, createCategory, deleteCategory } =
    useCategoryStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchTransactions({ limit: 500 })]).catch(() =>
      toast.error("Couldn't load categories. Please try again.")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statsByCategory = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      const id = t.category?.id;
      if (id == null) continue;
      const entry = map.get(id) || { count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(t.amount) || 0;
      map.set(id, entry);
    }
    return map;
  }, [transactions]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || adding) return;
    setAdding(true);
    try {
      await createCategory(trimmed);
      toast.success(`"${trimmed}" added`);
      setName("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Couldn't create category");
    } finally {
      setAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    const target = pendingDelete;
    try {
      await deleteCategory(target.id);
      setPendingDelete(null);
      toast.success("Category deleted");
    } catch (err) {
      setPendingDelete(null);
      if (err.response?.status === 409) {
        toast.error(
          err.response?.data?.detail ||
            "This category has transactions and can't be deleted."
        );
      } else {
        toast.error(err.response?.data?.detail || "Couldn't delete category");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Categories"
        subtitle="Organize every rupee your way."
      />

      <Card className="mb-6 p-4 sm:p-5">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New category name… e.g. Pets"
            aria-label="New category name"
            className="flex-1"
          />
          <Button
            type="submit"
            loading={adding}
            disabled={!name.trim()}
            className="sm:shrink-0"
          >
            <Plus size={16} />
            Add category
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tags}
            title="No categories yet"
            description="Create your first category above to start organizing your spending."
          />
        </Card>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {categories.map((category, i) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={i}
                stats={statsByCategory.get(category.id) || { count: 0, total: 0 }}
                onDelete={setPendingDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        title={pendingDelete ? `Delete "${pendingDelete.name}"?` : ""}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will permanently remove the category. It can't be undone.
        </p>
      </Modal>
    </div>
  );
}
