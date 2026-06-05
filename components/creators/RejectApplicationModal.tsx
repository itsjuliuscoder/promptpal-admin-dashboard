"use client";

import React, { useState } from "react";

interface RejectApplicationModalProps {
  open: boolean;
  email?: string;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
}

export default function RejectApplicationModal({
  open,
  email,
  onClose,
  onConfirm,
}: RejectApplicationModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(notes);
      setNotes("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="admin-panel w-full max-w-md p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--admin-text)]">
            Reject application
          </h2>
          {email ? (
            <p className="mt-2 text-sm text-[color:var(--admin-text-soft)]">
              {email} will not receive an invite.
            </p>
          ) : null}
        </div>

        <div className="admin-field-stack">
          <label className="admin-field-label" htmlFor="reject-notes">
            Reviewer notes (optional)
          </label>
          <textarea
            id="reject-notes"
            className="admin-textarea min-h-[100px]"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Reason for rejection..."
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="admin-button admin-button-ghost flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-button admin-button-primary flex-1 !bg-[color:var(--admin-danger)] hover:opacity-90"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
