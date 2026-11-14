# Uptime Monitor

A full-stack website monitoring application built with Next.js, TypeScript, PostgreSQL, and Prisma. Track website availability, measure response times, and explore historical uptime analytics through a modern dashboard.

Built as a portfolio project to explore full-stack development, database design, background workers, and monitoring systems.

## Screenshots

### Monitoring Dashboard

![Monitoring Dashboard](docs/screenshots/dashboard.png)

View monitored websites, their current status, uptime percentage, and response time. Add new monitors and manually trigger health checks.

### Monitor Analytics

![Monitor Analytics](docs/screenshots/monitor-details.png)

Explore individual website performance, including 24-hour and 7-day uptime, average response time, and historical response-time charts.

### Health Check History

![Health Check History](docs/screenshots/health-check-history.png)

Review recent health checks, HTTP status codes, timestamps, and response times.

## Features

- **Website Monitoring:** Check website availability using HTTP requests.
- **Automated Health Checks:** Run a background worker that checks monitored websites every five minutes.
- **Real-Time Dashboard Updates:** Refresh monitoring data automatically every 30 seconds.
- **Response-Time Tracking:** Measure and visualize website response times.
- **Uptime Analytics:** Calculate uptime percentages over 24-hour and 7-day windows.
- **Health Check History:** Store monitoring results in PostgreSQL for historical analysis.
- **REST API:** Create monitors, retrieve monitoring data, and trigger health checks.
- **Responsive Dashboard:** Dark-themed interface built with Tailwind CSS.

## Tech Stack

| Category                | Technology                 |
| ----------------------- | -------------------------- |
| Frontend                | Next.js, React, TypeScript |
| Styling                 | Tailwind CSS               |
| Backend                 | Next.js API Routes         |
| Database                | PostgreSQL                 |
| ORM                     | Prisma                     |
| Charts                  | Recharts                   |
| Background Processing   | Node.js, tsx               |
| Development Environment | Docker                     |

## Architecture

```text
                 Next.js Dashboard
                        |
                        v
                  Next.js API
                        |
                        v
                     Prisma
                        |
                        v
                   PostgreSQL
                        ^
                        |
                 Monitoring Worker
                        |
                        v
                  HTTP Requests
                        |
                        v
                 Monitored Websites
```

The application consists of three main components:

**Dashboard and API:** A Next.js application for managing monitors, triggering checks, and viewing analytics.

**Monitoring Worker:** A separate Node.js process that periodically checks registered websites and records their availability and response times.

**Database:** PostgreSQL stores monitor configurations and historical health-check results, accessed through Prisma.

## Getting Started

### Prerequisites

- Node.js and npm
- Docker
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/uptime-monitor.git
cd uptime-monitor
```

If the Next.js application is inside a nested `uptime-monitor-app` directory, navigate into it before running the remaining commands.

### 2. Install dependencies

```bash
npm install
```

### 3. Start PostgreSQL

```bash
docker run --name uptime-postgres \
  -e POSTGRES_USER=uptime \
  -e POSTGRES_PASSWORD=uptime_dev_password \
  -e POSTGRES_DB=uptime_monitor \
  -p 127.0.0.1:5432:5432 \
  -v uptime_pgdata:/var/lib/postgresql/data \
  -d postgres:17
```

If the container already exists but is stopped:

```bash
docker start uptime-postgres
```

### 4. Configure environment variables

Create a `.env` file in the application directory:

```env
DATABASE_URL="postgresql://uptime:uptime_dev_password@localhost:5432/uptime_monitor?schema=public"
```

These credentials are intended for local development only.

### 5. Set up the database

```bash
npx prisma generate
npx prisma migrate deploy
```

### 6. Start the application

```bash
npm run dev
```

Open http://localhost:3000.

### 7. Start automated monitoring

In a separate terminal:

```bash
npm run worker
```

The worker immediately checks registered websites, saves results to PostgreSQL, and repeats approximately every five minutes.

The worker must remain running for automated monitoring to continue.

## API Endpoints

| Method | Endpoint                    | Description                                             |
| ------ | --------------------------- | ------------------------------------------------------- |
| GET    | `/api/monitors`             | Retrieve monitored websites and their latest statistics |
| POST   | `/api/monitors`             | Create a new website monitor                            |
| POST   | `/api/monitors/:id/check`   | Trigger and save a health check                         |
| GET    | `/api/monitors/:id/history` | Retrieve historical checks and uptime analytics         |
| POST   | `/api/check`                | Perform a standalone website check                      |

## Database Design

The application uses two primary models:

**Monitor**

- Unique identifier
- Website name and URL
- Creation and update timestamps

**HealthCheck**

- Unique identifier
- Associated monitor
- Availability status
- HTTP status code
- Response time
- Check timestamp

Each monitor can have multiple health checks, enabling historical analysis.

## Current Limitations

This project is designed for local development and portfolio demonstration rather than production monitoring.

- Website checks currently support a predefined allowlist of domains.
- Automated monitoring requires a continuously running local worker.
- Uptime percentages are based on successful health checks rather than exact outage duration.
- User authentication, notifications, and multi-user support are not implemented.
- Monitoring APIs are not intended to be exposed publicly without additional security controls.

## Potential Improvements

- Email and webhook alerts when websites become unavailable
- Configurable monitoring intervals
- Incident detection and outage-duration tracking
- Public status pages
- Authentication and multi-user support
- Scalable background job scheduling
- Additional monitoring metrics and analytics

## License

MIT License.
