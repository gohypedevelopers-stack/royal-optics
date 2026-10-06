"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { passwordChangeSchema } from "@/lib/validators";

export default function AdminPasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setSuccess(false);
    const form = event.currentTarget;
    const parsed = passwordChangeSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(response.status === 401 ? "Your session has expired. Please sign in again." : result.error || "Unable to change password.");
        return;
      }
      form.reset();
      setVisiblePasswords({});
      setSuccess(true);
    } catch {
      setError("Unable to change password. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update your admin password. Use at least 8 characters.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={pending} className="space-y-4">
            {[
              { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
              { name: "newPassword", label: "New password", autoComplete: "new-password" },
              { name: "confirmNewPassword", label: "Confirm new password", autoComplete: "new-password" },
            ].map((field) => (
              <div key={field.name} className="space-y-2">
                <label htmlFor={field.name} className="text-sm font-medium">{field.label}</label>
                <div className="relative">
                  <Input id={field.name} name={field.name} type={visiblePasswords[field.name] ? "text" : "password"} autoComplete={field.autoComplete} required minLength={8} className="pr-12" />
                  <button
                    type="button"
                    aria-label={`${visiblePasswords[field.name] ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                    aria-controls={field.name}
                    aria-pressed={Boolean(visiblePasswords[field.name])}
                    onClick={() => setVisiblePasswords((current) => ({ ...current, [field.name]: !current[field.name] }))}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    {visiblePasswords[field.name] ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>
            ))}
          </fieldset>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p role="status" className="text-sm text-green-700 dark:text-green-400">Password changed successfully. Use your new password next time you sign in.</p>}
          <Button type="submit" disabled={pending}>{pending ? "Updating..." : "Update password"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
