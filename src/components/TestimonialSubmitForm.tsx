"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const initialState = {
  name: "",
  email: "",
  rating: 5,
  message: "",
};

export default function TestimonialSubmitForm() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.message.trim().length < 12) {
      toast.error("Message should be at least 12 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          rating: Number(form.rating),
          message: form.message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit testimonial.");
      }

      toast.success(data.message || "Testimonial submitted.");
      setForm(initialState);
    } catch (error: any) {
      toast.error(error.message || "Unable to submit testimonial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <h3 className="text-xl font-semibold text-slate-900">Add Your Testimonial</h3>
      <p className="mt-1 text-sm text-slate-600">Share your experience. Review will appear after admin approval.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Name</span>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="Your name"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Email (Optional)</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="mt-3 block space-y-1">
        <span className="text-xs font-medium text-slate-600">Rating</span>
        <select
          value={form.rating}
          onChange={(event) => setForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        >
          <option value={5}>5 - Excellent</option>
          <option value={4}>4 - Very Good</option>
          <option value={3}>3 - Good</option>
          <option value={2}>2 - Average</option>
          <option value={1}>1 - Poor</option>
        </select>
      </label>

      <label className="mt-3 block space-y-1">
        <span className="text-xs font-medium text-slate-600">Message</span>
        <textarea
          required
          minLength={12}
          maxLength={600}
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          className="min-h-[128px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          placeholder="Tell others what you liked about your experience."
        />
      </label>

      <Button type="submit" disabled={submitting} className="mt-4 rounded-xl bg-blue-700 hover:bg-blue-800">
        {submitting ? "Submitting..." : "Submit Testimonial"}
      </Button>
    </form>
  );
}
