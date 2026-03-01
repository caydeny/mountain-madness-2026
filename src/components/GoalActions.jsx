import { useState, useEffect, useRef, useCallback } from "react";
import "./GoalActions.css";

const STORAGE_KEY = "rbc_active_goal";

function loadGoal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveGoal(goal) {
  if (goal === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goal));
  }
}

/* ─── tiny modal wrapper ─────────────────────────────────── */
function Modal({ onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="ga-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ga-modal" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

/* ─── Add Goal Modal ─────────────────────────────────────── */
function AddGoalModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState({ name: false, amount: false });
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const nameErr = touched.name && name.trim() === "" ? "Goal name is required." : "";
  const amountErr =
    touched.amount && (isNaN(Number(amount)) || Number(amount) <= 0)
      ? "Enter a valid amount greater than 0."
      : "";
  const valid = name.trim() !== "" && !isNaN(Number(amount)) && Number(amount) > 0;

  const handleCreate = () => {
    setTouched({ name: true, amount: true });
    if (!valid) return;
    onCreate({ name: name.trim(), targetAmount: Number(amount), currentAmount: 0, status: "active" });
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="ga-modal-title">Set a New Goal</h2>
      <p className="ga-modal-subtitle">What are you saving up for?</p>
      <div className="ga-form-group">
        <label className="ga-label">Goal Name</label>
        <input
          ref={nameRef}
          className={`ga-input${nameErr ? " ga-input-error" : ""}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="e.g. New Laptop"
        />
        {nameErr && <span className="ga-error-text">{nameErr}</span>}
      </div>
      <div className="ga-form-group">
        <label className="ga-label">Estimated Cost ($)</label>
        <input
          className={`ga-input${amountErr ? " ga-input-error" : ""}`}
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
          placeholder="e.g. 1200"
        />
        {amountErr && <span className="ga-error-text">{amountErr}</span>}
      </div>

      <div className="ga-modal-footer">
        <button className="ga-btn ga-btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="ga-btn ga-btn-primary"
          onClick={handleCreate}
          disabled={!valid && Object.values(touched).some(Boolean)}
        >
          Create Goal
        </button>
      </div>
    </Modal>
  );
}

/* ─── Confirm Modal ──────────────────────────────────────── */
function ConfirmModal({ onClose, title, body, confirmLabel, confirmClass, onConfirm }) {
  const confirmRef = useRef(null);
  useEffect(() => { confirmRef.current?.focus(); }, []);

  return (
    <Modal onClose={onClose}>
      <h2 className="ga-modal-title">{title}</h2>
      <p className="ga-modal-subtitle">{body}</p>
      <div className="ga-modal-footer">
        <button className="ga-btn ga-btn-ghost" onClick={onClose}>Cancel</button>
        <button ref={confirmRef} className={`ga-btn ${confirmClass}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ─── GoalActions ────────────────────────────────────────── */
export default function GoalActions({ currentAmount: externalCurrent, onGoalChange }) {
  const [goal, setGoal] = useState(loadGoal);
  const [modal, setModal] = useState(null); // null | "add" | "giveup" | "finish"

  // allow simulating savings progress locally if no external source drives currentAmount
  const [simExtra, setSimExtra] = useState(0);
  const effectiveCurrent =
    externalCurrent !== undefined ? externalCurrent : (goal?.currentAmount ?? 0) + simExtra;

  const closeModal = useCallback(() => setModal(null), []);

  useEffect(() => {
    onGoalChange?.(goal);
  }, []);

  const updateGoal = (next) => {
    setGoal(next);
    saveGoal(next);
    onGoalChange?.(next);
  };

  const handleCreate = (newGoal) => {
    setSimExtra(0);
    updateGoal(newGoal);
    closeModal();
  };

  const handleGiveUp = () => {
    updateGoal(null);
    setSimExtra(0);
    closeModal();
  };

  const handleFinish = (status) => {
    updateGoal({ ...goal, status, currentAmount: effectiveCurrent });
    closeModal();
  };

  const handleStartNew = () => {
    updateGoal(null);
    setSimExtra(0);
    setModal("add");
  };

  const isCompleted = goal && effectiveCurrent >= goal.targetAmount;
  const isActive = goal?.status === "active";
  const isDone = goal && (goal.status === "completed" || goal.status === "failed");

  return (
    <>
      <div className="goal-actions-bar">
        {/* ── No goal ── */}
        {!goal && (
          <button className="ga-btn ga-btn-primary" onClick={() => setModal("add")}>
            + Add a Goal
          </button>
        )}

        {/* ── Active goal ── */}
        {isActive && (
          <>
            <button className="ga-btn ga-btn-danger" onClick={() => setModal("giveup")}>
              Give Up Goal
            </button>

            <button
              className={`ga-btn ${isCompleted ? "ga-btn-success" : "ga-btn-danger"}`}
              onClick={() => setModal("finish")}
            >
              {isCompleted ? "✓ Completed Goal" : "✗ Failed Goal"}
            </button>
          </>
        )}

        {/* ── Completed / Failed ── */}
        {isDone && (
          <>
            <span className={`ga-status-pill ${goal.status === "completed" ? "ga-pill-completed" : "ga-pill-failed"}`}>
              {goal.status === "completed" ? "✦ Completed" : "✗ Failed"}
            </span>
            <button className="ga-btn ga-btn-primary" onClick={handleStartNew}>
              Start New Goal
            </button>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modal === "add" && (
        <AddGoalModal onClose={closeModal} onCreate={handleCreate} />
      )}

      {modal === "giveup" && (
        <ConfirmModal
          onClose={closeModal}
          title="Give Up Goal?"
          body="Are you sure you want to remove this goal? Your progress will be lost."
          confirmLabel="Remove Goal"
          confirmClass="ga-btn-danger"
          onConfirm={handleGiveUp}
        />
      )}

      {modal === "finish" && goal && (
        <ConfirmModal
          onClose={closeModal}
          title={isCompleted ? "Mark as Completed?" : "Mark as Failed?"}
          body={
            isCompleted
              ? "You reached your savings goal. Mark it as completed?"
              : "You bought the item before reaching the goal. Mark this goal as failed?"
          }
          confirmLabel={isCompleted ? "Mark Completed" : "Mark Failed"}
          confirmClass={isCompleted ? "ga-btn-success" : "ga-btn-danger"}
          onConfirm={() => handleFinish(isCompleted ? "completed" : "failed")}
        />
      )}
    </>
  );
}
