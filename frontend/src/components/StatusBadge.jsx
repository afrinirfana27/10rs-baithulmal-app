const map = {
  active: { cls: "status-active", label: "Active" },
  time_limit_exceed: { cls: "status-exceed", label: "Time Limit Exceed" },
  blocked: { cls: "status-blocked", label: "Blocked" },
  closed: { cls: "status-closed", label: "Closed" },
  pending: { cls: "status-pending", label: "Pending" },
  in_review: { cls: "status-pending", label: "Pending" },
  review: { cls: "status-pending", label: "Pending" },
  approved: { cls: "status-approved", label: "Approved" },
  rejected: { cls: "status-exceed", label: "Rejected" },
};

export default function StatusBadge({ status, testId }) {
  const normalized = String(status || "").trim().toLowerCase();
  const key = normalized === "in review" ? "in_review" : normalized;
  const m = map[key] || { cls: "status-active", label: status || "Unknown" };
  return (
    <span
      data-testid={testId || `status-${status}`}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
