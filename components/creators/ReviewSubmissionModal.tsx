"use client";

import React, { useState } from "react";
import { FiExternalLink } from "react-icons/fi";
import type { CreatorSubmission } from "@/lib/services/adminService";

interface ReviewSubmissionModalProps {
  open: boolean;
  submission: CreatorSubmission | null;
  onClose: () => void;
  onReview: (
    submissionId: string,
    status: "approved" | "rejected",
    notes: string
  ) => Promise<void>;
}

export default function ReviewSubmissionModal({
  open,
  submission,
  onClose,
  onReview,
}: ReviewSubmissionModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !submission) return null;

  const isPending = submission.status === "pending";

  const handleReview = async (status: "approved" | "rejected") => {
    setIsSubmitting(true);
    try {
      await onReview(submission.id, status, notes);
      setNotes("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="admin-panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--admin-text)]">
            Review submission
          </h2>
          <p className="mt-2 text-sm text-[color:var(--admin-text-soft)]">
            {submission.creator?.name ?? "Creator"} —{" "}
            {submission.brief?.title ?? "Content submission"}
          </p>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="admin-eyebrow">Content URL</dt>
            <dd className="mt-1">
              <a
                href={submission.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[color:var(--admin-accent-strong)] hover:underline"
              >
                {submission.contentUrl}
                <FiExternalLink size={14} />
              </a>
            </dd>
          </div>
          {submission.captionText ? (
            <div>
              <dt className="admin-eyebrow">Caption</dt>
              <dd className="mt-1 text-[color:var(--admin-text-soft)]">
                {submission.captionText}
              </dd>
            </div>
          ) : null}
          {submission.brief ? (
            <div>
              <dt className="admin-eyebrow">Points reward</dt>
              <dd className="mt-1 text-[color:var(--admin-accent-strong)]">
                {submission.brief.pointsReward} pts
              </dd>
            </div>
          ) : null}
          {!isPending && submission.reviewerNotes ? (
            <div>
              <dt className="admin-eyebrow">Previous notes</dt>
              <dd className="mt-1 text-[color:var(--admin-text-soft)]">
                {submission.reviewerNotes}
              </dd>
            </div>
          ) : null}
        </dl>

        {isPending ? (
          <div className="admin-field-stack mt-5">
            <label className="admin-field-label" htmlFor="review-notes">
              Reviewer notes
            </label>
            <textarea
              id="review-notes"
              className="admin-textarea min-h-[80px]"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Feedback for the creator..."
            />
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="admin-button admin-button-ghost flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {isPending ? "Cancel" : "Close"}
          </button>
          {isPending ? (
            <>
              <button
                type="button"
                className="admin-button admin-button-secondary flex-1"
                onClick={() => handleReview("rejected")}
                disabled={isSubmitting}
              >
                Reject
              </button>
              <button
                type="button"
                className="admin-button admin-button-primary flex-1"
                onClick={() => handleReview("approved")}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Working..." : "Approve"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
