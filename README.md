# Aegis

**Aegis** is a web-based disaster-relief coordination platform designed to connect people affected by disasters with volunteers, relief stations, and shelters.

The platform provides a centralized way to request and coordinate assistance such as food and water, first aid, transportation, evacuation, and shelter assistance.

Aegis is being developed as a hackathon/ideathon prototype with the goal of demonstrating a practical disaster-relief coordination workflow.

---

## What Aegis Does

Aegis brings together four major participants:

* **Victims** — request assistance and track their requests.
* **Volunteers** — discover available help requests and assist victims.
* **Relief Station Operators** — manage relief stations and available resources.
* **Shelter Operators** — manage shelters, capacity, and occupancy.
* **Administrators** — handle verification and administrative operations.

The platform also provides public disaster-relief information so that users can find relevant relief locations and emergency information.

---

## Main Features

### Public Access

Users can access important information without necessarily having an Aegis account.

Features include:

* Relief station discovery
* Shelter discovery
* Emergency contact information
* Disaster alerts
* Avoid-area information
* Location-based discovery of nearby assistance

---

### Authentication & User Roles

Aegis uses **Clerk** for authentication.

After authentication, users select or receive an appropriate role and access the corresponding functionality.

Supported roles:

```text
victim
volunteer
stationOp
shelterOp
admin
```

Each role has different permissions and responsibilities.

---

### Victim

Victims can:

* Create help requests
* Select the type of assistance required
* Provide a description of their situation
* Specify the number of people requiring assistance
* Share their location
* View their submitted requests
* Track the status of requests
* View nearby relief stations and shelters

Supported assistance categories include:

* Food & Water Distribution
* First Aid
* Transportation
* Evacuation
* Shelter Assistance
* Other

---

### Volunteer

Volunteers can:

* Create a volunteer profile
* Provide their capabilities
* Set their availability
* Provide their location
* View available victim requests
* Accept requests
* Assist with the requested task
* Update their availability as required

Volunteer capabilities can include:

* Food distribution
* Water distribution
* First aid
* Transportation
* Evacuation assistance
* Shelter assistance

---

### Relief Stations

Relief station operators can:

* Register relief stations
* Provide station location and contact information
* Update station status
* Add available resources
* Update resource quantities
* View station resources
* Manage their registered stations

Relief stations can be verified by administrators before being presented as approved relief locations.

---

### Shelters

Shelter operators can:

* Register shelters
* Provide shelter information and location
* Specify shelter capacity
* Check people in
* Check people out
* Update shelter capacity
* Update shelter status
* Provide information about special assistance
* View their registered shelters

Shelters can also be verified by administrators.

---

### Administration & Verification

Administrators are responsible for platform-level operations such as:

* Verifying relief stations
* Verifying shelters
* Managing verification status
* Performing administrative backend operations

A dedicated public-facing admin dashboard is not required for the current prototype.

---

### Location Services

Aegis uses location information to improve disaster-relief coordination.

Depending on the workflow, users may:

* Use their device's current location
* Provide a location manually
* Find nearby relief stations
* Find nearby shelters
* Associate help requests with a location

Location information is used to help users find relevant assistance rather than exposing unnecessary information about other users.

---

## Technology Stack

### Frontend

* HTML
* CSS
* JavaScript
* Vite

### Authentication

* Clerk

### Backend & Database

* Convex

### Location / Maps

The project may use mapping and geolocation services for location-based functionality.

---

## Project Structure

The project is organized roughly as follows:

```text
Aegis/
│
├── index.html
├── index.css
├── loginpage.html
├── ...
│
├── src/
│   ├── clerk.js
│   ├── convex.js
│   └── ...
│
├── convex/
│   ├── schema.ts
│   ├── auth.config.ts
│   ├── users.ts
│   ├── requests.ts
│   ├── reliefStations.ts
│   ├── shelters.ts
│   └── _generated/
│
├── package.json
├── package-lock.json
├── vite.config.js
├── .gitignore
└── README.md
```

The exact frontend structure may evolve as the different Aegis modules are integrated.

---

# Running Aegis Locally

## Prerequisites

Install:

* Node.js
* npm
* A Clerk account/project
* A Convex account/project

Recommended Node.js version:

```text
Node.js 20+
```

Check your installation:

```bash
node --version
npm --version
```

---

## 1. Clone the repository

Clone the Aegis repository:

```bash
git clone <REPOSITORY_URL>
cd SCE_aiges
```

If the repository uses a different default branch, switch to the branch containing the latest integrated Aegis version.

---

## 2. Install dependencies

Run:

```bash
npm install
```

This installs all frontend and backend dependencies defined in `package.json`.

---

# Environment Configuration

Aegis requires environment variables for Clerk and Convex.

## Clerk

Create a Clerk application and obtain its publishable key.

Create a `.env` file in the project root:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

---

## Convex

Configure the Convex deployment used by the project.

Create `.env.local`:

```env
VITE_CONVEX_URL=your_convex_deployment_url
```

The Convex backend also requires the Clerk JWT issuer domain:

```text
CLERK_JWT_ISSUER_DOMAIN
```

This should be configured in the Convex deployment environment.

---

## Clerk + Convex Authentication

Aegis uses a Clerk JWT template named:

```text
convex
```

The template must have:

```text
aud = convex
```

and its issuer/domain must correspond to the Clerk instance configured for the Convex deployment.

This allows authenticated Clerk users to make authenticated requests to Convex.

---

# Running the Application

Aegis uses Vite for the frontend and Convex for the backend.

It is recommended to run them in separate terminals.

### Terminal 1 — Convex

```bash
npx convex dev
```

Keep this terminal running while developing.

You should see a successful Convex deployment/functions-ready message.

### Terminal 2 — Vite

```bash
npm run dev
```

Vite will provide a local development URL, usually:

```text
http://localhost:5173
```

Open the displayed URL in your browser.

---

# Production Build

To test whether the frontend can be built:

```bash
npm run build
```

The generated `dist/` directory is ignored by Git and should not be committed.

---

# Development Workflow

Aegis is being developed collaboratively.

Each contributor should generally work on their own branch.

Example:

```bash
git checkout -b feature-name
```

After implementing and testing a change:

```bash
git status
git add .
git commit -m "Describe the change"
git push
```

Changes can then be reviewed and integrated into the shared branch.

---

# Important Development Notes

### Do not commit credentials

Do not commit:

```text
.env
.env.local
```

These files contain environment-specific credentials and configuration.

### Backend authentication

Backend operations should verify the authenticated user's identity and role before modifying protected data.

### Location privacy

Location data should only be exposed where required for the relevant disaster-relief workflow.

For example, victims should not automatically receive the private locations of unrelated victims.

### Prototype status

Aegis is a prototype intended to demonstrate disaster-relief coordination.

It is **not a replacement for official emergency-response infrastructure** and should not be treated as a production emergency-management system.

---

# Future Scope

Potential future improvements include:

* Dedicated mobile application
* Real-time volunteer tracking
* Live location sharing after accepting a request
* Improved offline/low-connectivity support
* Advanced proximity-based matching
* Push notifications
* Expanded administrator tools
* More detailed resource tracking
* Integration with official emergency services
* Production-grade security and deployment
* Scalable infrastructure for large-scale disaster events

---

# Team Development

Aegis is developed collaboratively, with different team members responsible for different parts of the system.

The project is designed so that frontend modules, user workflows, backend services, and administrative functionality can be integrated into the same platform.

When adding a new feature, contributors should:

1. Keep the existing role and data model consistent.
2. Avoid committing secrets.
3. Test the feature locally.
4. Commit changes in logical checkpoints.
5. Push changes to their feature branch.
6. Coordinate integration with the rest of the team.

---

## Project Goal

The goal of Aegis is to provide a simple, centralized platform for coordinating disaster-relief assistance between affected people, volunteers, relief stations, and shelters.

**Aegis — connecting people to help when it matters most.**
