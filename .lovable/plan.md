

# TossUp – IPL Match Prediction Platform

A modern, mobile-first fantasy sports web app where users create groups, bet virtual coins on IPL match outcomes, and compete on leaderboards. Dark sports theme with purple/orange/blue accents.

---

## Pages & Features

### 1. Authentication (Login & Signup)
- Centered card layout with sports-themed dark background
- Logo + tagline "Predict. Compete. Win Coins."
- Login: email, password, Google placeholder button
- Signup: name, email, password, confirm password
- Form validation with error toasts

### 2. Dashboard
- **Navbar**: Logo, nav links (Dashboard, Groups, Leaderboard, Profile), coin balance display, avatar dropdown
- **Upcoming Matches**: Horizontal scrollable match cards with team logos, names, countdown timer, "Place Bet" button
- **Your Groups**: Group cards showing name, bet price, member count, invite code, "Open Group" button
- **Quick Leaderboard**: Top 5 users table with rank, player, coins

### 3. Create & Join Group
- Create: form with group name, bet price, generates invite code with copy/share buttons
- Join: simple invite code input + join button

### 4. Group Detail Page (Tabbed)
- Header with group name, bet amount, invite code (copyable)
- **Matches Tab**: Bet-enabled match list
- **Members Tab**: Username, coins, wins
- **Leaderboard Tab**: Full table with medal highlights for top 3

### 5. Match Betting Page
- Large match card: Team A vs Team B with logos, time, countdown
- Two large team selection buttons with highlight on select
- Bet amount display + confirmation modal
- Auto-disable betting when < 15 min to start with "Betting closed" message

---

## State & API Layer
- **Zustand stores**: user, groups, matches, bets
- **Axios API layer** with mock/placeholder endpoints for auth, matches, groups, bets, leaderboard
- All data mocked locally for demo purposes (no backend needed initially)

## Design System
- Dark background with purple/orange/blue accent colors
- Card-based layouts, smooth animations (fade-in, hover scale)
- Loading skeletons, toast notifications
- Countdown timers on match cards
- Mobile-first responsive design
- Sports-inspired typography and iconography

## Key Components
- Navbar, MatchCard, GroupCard, LeaderboardTable, BetSelector, CountdownTimer, InviteModal, ConfirmBetModal, AvatarDropdown, ToastNotification

