import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../utils/supabase";
import "./GoalActions.css";

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
    onCreate({ name: name.trim(), targetAmount: Number(amount) });
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
export default function GoalActions({ goal, onGoalChange, userGoogleId, currentAmount: externalCurrent }) {
  const [modal, setModal] = useState(null); // null | "add" | "giveup" | "finish"

  const effectiveCurrent = externalCurrent !== undefined ? externalCurrent : (goal?.value ?? 0);
  const closeModal = useCallback(() => setModal(null), []);

  const handleCreate = async (newGoal) => {
    if (!userGoogleId) return;

    const { data, error } = await supabase
      .from('goals')
      .insert([{
        google_id: userGoogleId,
        name: newGoal.name,
        total_cost: newGoal.targetAmount,
        value: 0,
        status: true
      }])
      .select()
      .single();

    if (!error && data) {
      onGoalChange(data);
    }
    closeModal();
  };

  const handleGiveUp = async () => {
    if (!goal || !userGoogleId) return;

    // We update status to false instead of deleting (per typical history tracking)
    // or just delete if that's what user prefers. "Remove goal" usually implies delete or status=false.
    // User said: "check if that table has the users google_id and status = false... display buttons to add".
    // So we update status to false.
    const { error } = await supabase
      .from('goals')
      .update({ status: false })
      .eq('id', goal.id);

    if (!error) {
      onGoalChange(null);
    }
    closeModal();
  };

  const handleFinish = async (isSuccess) => {
    if (!goal || !userGoogleId) return;

    const { error } = await supabase
      .from('goals')
      .update({
        status: false,
        value: isSuccess ? goal.total_cost : effectiveCurrent
      })
      .eq('id', goal.id);

    if (!error) {
      onGoalChange(null);
    }
    closeModal();
  };

  const isActive = goal?.status === true;
  const isCompleted = goal && effectiveCurrent >= goal.total_cost;

  return (
    <>
      <div className="goal-actions-bar">
        {/* ── No active goal ── */}
        {!isActive && (
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
          onConfirm={() => handleFinish(isCompleted)}
        />
      )}
    </>
  );
}
