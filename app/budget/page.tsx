"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardwareCard } from "@/components/ui/hardware-card";
import { LedMeter } from "@/components/ui/led-meter";
import { playHardwareClick } from "@/lib/audio-feedback";
import {
  DollarSign,
  Plus,
  Trash2,
  PieChart,
  ShoppingBag,
  Utensils,
  Car,
  Book,
  Gamepad2,
  Receipt,
  Search,
  Wallet,
  Calendar,
} from "lucide-react";

const CATEGORIES = [
  { id: "food", label: "Food & Cafeteria", icon: Utensils, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "transport", label: "Commute & Travel", icon: Car, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "books", label: "College Books & Stationary", icon: Book, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "leisure", label: "Entertainment & Outings", icon: Gamepad2, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { id: "bills", label: "Hostel & Utility Bills", icon: Receipt, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "other", label: "Other General Expenses", icon: ShoppingBag, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
];

export default function BudgetPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const currency = currentUser?.currency || "$";

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const budget = useQuery(api.budget.getBudgetOverview, { month: currentMonthStr }) || {
    month: currentMonthStr,
    monthlyLimit: 500,
    totalSpent: 0,
    remaining: 500,
    percentageUsed: 0,
    categoryBreakdown: {},
    expenses: [],
  };

  const setBudgetMutation = useMutation(api.budget.setMonthlyBudget);
  const addExpenseMutation = useMutation(api.budget.addExpense);
  const deleteExpenseMutation = useMutation(api.budget.deleteExpense);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);

  // Form State
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("food");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [newBudgetLimit, setNewBudgetLimit] = useState(budget.monthlyLimit.toString());

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;

    await addExpenseMutation({
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      date: expenseDate,
    });

    setExpenseTitle("");
    setExpenseAmount("");
    setIsAddExpenseOpen(false);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(newBudgetLimit);
    if (isNaN(limit) || limit <= 0) return;

    await setBudgetMutation({
      month: currentMonthStr,
      monthlyLimit: limit,
    });
    setIsEditBudgetOpen(false);
  };

  // Days left in month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate());
  const dailySafeSpend = Math.max(0, Math.round((budget.remaining / daysLeft) * 10) / 10);

  const filteredExpenses = budget.expenses.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <AppShell
      pageTitle="Student Budget & Allowance"
      pageDescription="Track daily spending, categorize college expenses, and manage your monthly budget."
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            indicator="emerald"
            onClick={() => setIsAddExpenseOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>LOG EXPENSE</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              playHardwareClick(900);
              setNewBudgetLimit(budget.monthlyLimit.toString());
              setIsEditBudgetOpen(true);
            }}
          >
            SET LIMIT
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards in Hardware Telemetry Chassis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <HardwareCard refId="NX-FIN-01" label="MONTHLY CAP">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-100">
                  {currency}{budget.monthlyLimit}
                </span>
                <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <button
                onClick={() => {
                  playHardwareClick(900);
                  setNewBudgetLimit(budget.monthlyLimit.toString());
                  setIsEditBudgetOpen(true);
                }}
                className="font-mono text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer block"
              >
                ADJUST CEILING →
              </button>
            </div>
          </HardwareCard>

          <HardwareCard refId="NX-FIN-02" label="TOTAL CONSUMED">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-100">
                  {currency}{budget.totalSpent}
                </span>
                <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="pt-1">
                <LedMeter value={budget.percentageUsed} segments={10} mode="budget" />
              </div>
            </div>
          </HardwareCard>

          <HardwareCard
            refId="NX-FIN-03"
            label="AVAILABLE RESERVES"
            badge={budget.remaining >= 0 ? "NOMINAL" : "DEFICIT"}
            badgeVariant={budget.remaining >= 0 ? "emerald" : "rose"}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span
                  className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                    budget.remaining >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {currency}{budget.remaining}
                </span>
                <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <PieChart className="h-4 w-4" />
                </div>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 block">
                {budget.remaining >= 0 ? "WITHIN LIMIT" : "EXCEEDED LIMIT"}
              </span>
            </div>
          </HardwareCard>

          <HardwareCard refId="NX-FIN-04" label="DAILY SAFE PACE">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-100">
                  {currency}{dailySafeSpend}
                  <span className="text-xs font-normal text-zinc-500">/day</span>
                </span>
                <div className="h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 block">
                {daysLeft} DAYS REMAINING IN CYCLE
              </span>
            </div>
          </HardwareCard>
        </div>

        {/* Burn Velocity Telemetry Rack */}
        <HardwareCard refId="NX-BURN" label="FISCAL BURN VELOCITY MONITOR">
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400 uppercase text-[11px]">
                RESERVE CONSUMPTION RATE
              </span>
              <span
                className={`${
                  budget.percentageUsed >= 90
                    ? "text-rose-400 font-bold"
                    : budget.percentageUsed >= 75
                    ? "text-amber-400 font-bold"
                    : "text-emerald-400 font-bold"
                }`}
              >
                {budget.percentageUsed}% CONSUMED
              </span>
            </div>
            <LedMeter
              value={budget.percentageUsed}
              mode="budget"
              segments={16}
              label="16-SEGMENT VELOCITY GAUGE"
              showValue
            />
          </div>
        </HardwareCard>

        {/* Category Breakdown & Ledger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Category Breakdown */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wider pb-1 border-b border-zinc-800/80">
              // Category Allocation
            </h3>

            <div className="space-y-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const catSpent = (budget.categoryBreakdown as Record<string, number>)[cat.id] || 0;
                const catPercent =
                  budget.totalSpent > 0 ? Math.round((catSpent / budget.totalSpent) * 100) : 0;

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-lg border border-zinc-800/80 bg-[#0c0c0e] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-zinc-200 block uppercase">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {catPercent}% of spend
                        </span>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-zinc-200 text-sm">
                      {currency}
                      {catSpent}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Cols: Transaction Ledger */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-800/80">
              <h3 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wider">
                // Expense Ledger
              </h3>

              <div className="relative w-full sm:w-60">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Filter transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-8 text-xs border-zinc-800 bg-zinc-900/80 text-zinc-100 placeholder-zinc-500 font-mono"
                />
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-8 rounded-xl border border-zinc-800/80 bg-[#0c0c0e] text-center">
                <ShoppingBag className="h-8 w-8 text-zinc-400 mx-auto mb-2.5" />
                <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase">No Expenses Recorded</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Log lunches, transit, course literature, and coffee to track spending telemetry.
                </p>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="mt-4 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>LOG FIRST EXPENSE</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map((exp) => {
                  const catConfig =
                    CATEGORIES.find((c) => c.id === exp.category.toLowerCase()) || CATEGORIES[5];
                  const Icon = catConfig.icon;

                  return (
                    <div
                      key={exp._id}
                      className="p-3 rounded-lg border border-zinc-800/80 bg-[#0c0c0e] hover:border-zinc-700 transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-200 text-xs truncate block uppercase">
                            {exp.title}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            {catConfig.label.toUpperCase()} • {exp.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-zinc-100 text-sm">
                          -{currency}
                          {exp.amount}
                        </span>
                        <button
                          onClick={() => deleteExpenseMutation({ id: exp._id })}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Log Expense */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Log Student Expense"
        description="Add a new expenditure to deduct from your monthly allowance."
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="expenseTitle" className="text-xs text-slate-300">
              Title / Description *
            </Label>
            <Input
              id="expenseTitle"
              placeholder="e.g. Campus Cafeteria Lunch"
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              required
              className="border-slate-800 bg-slate-950/60 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expenseAmount" className="text-xs text-slate-300">
                Amount ({currency}) *
              </Label>
              <Input
                id="expenseAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="12.50"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                required
                className="border-slate-800 bg-slate-950/60 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Category</Label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/60 px-3 text-xs text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expenseDate" className="text-xs text-slate-300">
              Date *
            </Label>
            <Input
              id="expenseDate"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
              className="border-slate-800 bg-slate-950/60 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddExpenseOpen(false)}
              className="border-slate-800 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-pink-600 hover:bg-pink-500 text-white cursor-pointer"
            >
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Set Monthly Budget */}
      <Modal
        isOpen={isEditBudgetOpen}
        onClose={() => setIsEditBudgetOpen(false)}
        title="Set Monthly Budget Limit"
        description="Configure your spending cap for this month."
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="budgetLimit" className="text-xs text-slate-300">
              Monthly Allowance / Limit ({currency}) *
            </Label>
            <Input
              id="budgetLimit"
              type="number"
              min="1"
              step="1"
              value={newBudgetLimit}
              onChange={(e) => setNewBudgetLimit(e.target.value)}
              required
              className="border-slate-800 bg-slate-950/60 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditBudgetOpen(false)}
              className="border-slate-800 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              Update Budget
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
