"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  GraduationCap,
  Percent,
  DollarSign,
  Sun,
  Moon,
  Laptop,
  Check,
  Save,
  Loader2,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateAcademicProfileMutation = useMutation(api.users.updateAcademicProfile);
  const updateThemeMutation = useMutation(api.users.updateTheme);

  // Form State
  const [college, setCollege] = useState("");
  const [major, setMajor] = useState("");
  const [semester, setSemester] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [targetAttendance, setTargetAttendance] = useState(75);
  const [currency, setCurrency] = useState("$");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setCollege(currentUser.college || "");
      setMajor(currentUser.major || "");
      setSemester(currentUser.semester || "");
      setRollNo(currentUser.rollNo || "");
      setTargetAttendance(currentUser.targetAttendance || 75);
      setCurrency(currentUser.currency || "$");
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateAcademicProfileMutation({
        college,
        major,
        semester,
        rollNo,
        targetAttendance: Number(targetAttendance),
        currency,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Save profile failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTheme = async (newTheme: string) => {
    try {
      await updateThemeMutation({ theme: newTheme });
    } catch (err) {
      console.error("Theme update failed:", err);
    }
  };

  return (
    <AppShell
      pageTitle="Settings & Academic Profile"
      pageDescription="Customize your university details, minimum attendance criteria, currency, and preferences."
    >
      <div className="max-w-4xl space-y-8">
        {/* Academic Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="p-6 rounded-md border border-zinc-800 bg-[#0c0c0e] space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
              <GraduationCap className="h-4 w-4 text-zinc-400" />
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                  University & Student Identity
                </h3>
                <p className="text-xs text-zinc-500">
                  Used across your timetable, lecture schedules, and campus records.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="college" className="text-xs text-zinc-300 font-mono">
                  College / University Name
                </Label>
                <Input
                  id="college"
                  placeholder="e.g. Stanford University / IIT Delhi"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="major" className="text-xs text-zinc-300 font-mono">
                  Major / Degree Course
                </Label>
                <Input
                  id="major"
                  placeholder="e.g. Computer Science & AI"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="semester" className="text-xs text-zinc-300 font-mono">
                  Semester / Year
                </Label>
                <Input
                  id="semester"
                  placeholder="e.g. Semester 5 (Year 3)"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rollNo" className="text-xs text-zinc-300 font-mono">
                  Roll Number / Student ID
                </Label>
                <Input
                  id="rollNo"
                  placeholder="e.g. 21BCE0429"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Academic Criteria & Customization */}
          <div className="p-6 rounded-md border border-zinc-800 bg-[#0c0c0e] space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
              <Percent className="h-4 w-4 text-zinc-400" />
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                  Thresholds & Currency Preferences
                </h3>
                <p className="text-xs text-zinc-500">
                  Define your minimum attendance target and budget currency.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="targetAttendance" className="text-xs text-zinc-300 font-mono">
                  Target Attendance Threshold (%)
                </Label>
                <Input
                  id="targetAttendance"
                  type="number"
                  min="50"
                  max="100"
                  value={targetAttendance}
                  onChange={(e) => setTargetAttendance(parseInt(e.target.value) || 75)}
                  className="border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs rounded-md"
                />
                <p className="text-[11px] font-mono text-zinc-500">
                  Standard criteria is 75% or 80%. Safe bunks are calculated against this.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs text-zinc-300 font-mono">
                  Currency Symbol
                </Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 text-xs font-mono text-white"
                >
                  <option value="$">$ (USD)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="C$">C$ (CAD)</option>
                  <option value="A$">A$ (AUD)</option>
                </select>
                <p className="text-[11px] font-mono text-zinc-500">
                  Applied to your student allowances and expense tracking.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
              {savedSuccess ? (
                <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Profile updated successfully!
                </span>
              ) : (
                <span className="text-xs font-mono text-zinc-500">
                  Changes sync immediately to your cloud profile.
                </span>
              )}

              <Button
                type="submit"
                disabled={isSaving}
                variant="default"
                className="font-mono text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> SAVING...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> SAVE PROFILE
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Appearance & Account Details */}
        <div className="p-6 rounded-md border border-zinc-800 bg-[#0c0c0e] space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
            <Shield className="h-4 w-4 text-zinc-400" />
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Theme & Authentication Security
              </h3>
              <p className="text-xs text-zinc-500">
                Connected Better Auth identity and theme settings.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-zinc-300 font-mono">Theme Mode</Label>
            <div className="grid grid-cols-3 gap-3 max-w-sm">
              {[
                { val: "light", label: "Light", icon: Sun },
                { val: "dark", label: "Dark", icon: Moon },
                { val: "system", label: "System", icon: Laptop },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = (currentUser?.theme || "system") === opt.val;

                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleUpdateTheme(opt.val)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-md border text-xs font-mono cursor-pointer transition-all ${
                      isSelected
                        ? "bg-zinc-800 border-zinc-600 text-white font-semibold shadow-sm"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-800/80 text-xs">
            <div className="p-3.5 rounded-md bg-zinc-900/50 border border-zinc-800/80">
              <span className="text-zinc-500 block mb-1 uppercase font-mono text-[10px]">
                AUTHENTICATED AS
              </span>
              <span className="font-mono text-zinc-200">{currentUser?.email}</span>
            </div>
            <div className="p-3.5 rounded-md bg-zinc-900/50 border border-zinc-800/80">
              <span className="text-zinc-500 block mb-1 uppercase font-mono text-[10px]">
                AUTH PROVIDER
              </span>
              <span className="font-mono text-zinc-200 capitalize">
                {currentUser?.provider}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
