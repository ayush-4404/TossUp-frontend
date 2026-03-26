# TossUp

TossUp is an IPL prediction and group-competition platform where users place virtual coin bets on match outcomes, compete with friends, and track performance through leaderboards and settlement views.

## Live App

- Web (Vercel): https://tossup-lemon.vercel.app
- Android APK (Drive): https://drive.google.com/file/d/1waiCmfcsmur58tuOHpsFchB9i4DyyZGs/view?usp=drive_link

## What This Project Is About

TossUp focuses on social prediction gameplay around IPL matches.

- Users create an account and verify their email.
- Users join or create groups with invite codes.
- Every group has a per-match coin stake.
- Members vote on match winners before cutoff time.
- After results, winnings/losses are reflected through transfers and net settlement.
- Group members can review bet history, member performance, and leaderboard movement.

The app is designed for both browser and Android usage, with a mobile-first interface and team-based theming.

## Product Workflow

1. Authentication
- Sign up, verify email, log in.
- Password reset flow is supported.

2. Onboarding
- User profile includes preferred IPL team.
- Theme can follow team identity or basic mode.

3. Group Lifecycle
- Create group with bet price.
- Share invite code for friends to join.
- Group owner can manage manual matches when needed.

4. Match and Betting Flow
- Upcoming matches appear on dashboard and in groups.
- Members place or update bets before betting closes.
- Poll-style visibility shows how members are voting.

5. Result and Settlement Flow
- After match completion, bet outcomes are finalized.
- Coin transfer rows are generated.
- Net payment instructions show who pays whom.
- Settlement tab gives per-member incoming, outgoing, and net balances.

6. Tracking and Competition
- Bet history keeps an activity trail for every match.
- Leaderboard ranks members by performance.
- Member cards and profile dialogs provide quick group insights.

## Core Capabilities

- Group-based IPL prediction battles
- Virtual coin economy per group
- Poll-style bet visualization
- Match-level bet history and transfer tracing
- Leaderboard and settlement analytics
- Android app distribution through APK

## Frontend Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand for client state
- TanStack Query for async data flows
- Capacitor for Android packaging
