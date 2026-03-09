# 💸 RBC — Rational Budgeting Calendar

An AI-powered budgeting app that minimizes impulse spending and turns saving money into a daily game.

![DEMO](/public/demo.png)

## 📌 Table of Contents

- [🚀 What It Does](#-what-it-does)
- [🤖 How It Works](#-how-it-works)
- [🎯 Goals](#-goals)
- [🏆 Gamification](#-gamification)
- [🎯 Mission](#-mission)
- [⚙️ Setup](#-setup)

---

## 🚀 What It Does

RBC connects your **calendar** and **bank account** to create smart, adaptive daily spending limits.

Instead of fixed monthly budgets, RBC:

- Analyzes your past year of income and expenses  
- Calculates how much you *can* safely save  
- Lets you set a savings percentage per term (monthly / biweekly)  
- Converts your remaining budget into dynamic daily limits  

---

## 🤖 How It Works

### 1. Login & Connect
- Sync your calendar(s)
- Connect your bank

### 2. AI Budgeting
- LLM classifies income, mandatory, and variable spending
- Calculates maximum spending per term
- Splits that into daily limits based on:
  - Event density
  - Estimated event costs
  - Historical behavior

### 3. Daily Tracking
- Stay under your daily limit → earn a ✔
- Consecutive days → build streaks
- Unused limit → redistributed intelligently
- End of term → unused funds move to savings

---

## 🎯 Goals

Set savings goals (e.g., $800 TV).

Unused spending accumulates toward your goal via a progress bar.

When the goal is reached:
- You can purchase
- Your streak is protected

---

## 🏆 Gamification

- Daily streaks
- Friend leaderboards
- Rank system based on savings efficiency  

**Savings Efficiency = Saved ÷ Limit**

The more efficiently you save, the higher you rank.

---

## 🎯 Mission

Make saving:
- Automated  
- Adaptive  
- Motivating  
- Social  

RBC doesn’t just track your money.  
It helps you control it.

---

## ⚙️ Setup

### 1️⃣ Install Dependencies

```bash
npm install
```

Install Google OAuth package:

```bash
npm install @react-oauth/google
```

---

### 2️⃣ Environment Variables

This project uses **two environment files** in the root folder:

- `.env.local` → root
- `.env` → root

---

### 🖥 Frontend — `.env.local`

Create a file called `.env.local` in the project root:

```env
VITE_GOOGLE_CLIENT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

⚠️ Important:
- All frontend variables must start with `VITE_`
- Do NOT commit this file

---

### 🧠 Backend — `.env`

Create a file called `.env` in the project root:

```env
GEMINI_API_KEY=
```

Do not commit this file.

---

### 3️⃣ Run the App

```bash
npm run dev
```

This starts both:

- Frontend (Vite)
- Backend API server

---

### 🔐 Security Reminder

Add this to your `.gitignore`:

```
.node_modules
dist
.env
.env.local
```
