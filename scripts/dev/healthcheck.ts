#!/usr/bin/env node

/**
 * Health check script for WinMix TipsterHub local development environment
 * Verifies that Postgres, Supabase, and Vite services are running
 * 
 * Usage:
 *   node scripts/dev/healthcheck.ts
 *   npx ts-node scripts/dev/healthcheck.ts
 */

import { createConnection } from "net";
import http from "http";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

const results: CheckResult[] = [];

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function printSuccess(message: string): void {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function printError(message: string): void {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function printWarning(message: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function printInfo(message: string): void {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

/**
 * Check if a TCP port is open
 */
async function checkPort(
  host: string,
  port: number,
  serviceName: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port, timeout: 5000 });

    socket.on("connect", () => {
      socket.destroy();
      printSuccess(`${serviceName} is running on ${host}:${port}`);
      results.push({
        name: serviceName,
        status: "pass",
        message: `${serviceName} is running on ${host}:${port}`,
      });
      resolve(true);
    });

    socket.on("error", () => {
      printError(`${serviceName} is NOT running on ${host}:${port}`);
      results.push({
        name: serviceName,
        status: "fail",
        message: `${serviceName} is NOT running on ${host}:${port}`,
      });
      resolve(false);
    });

    socket.on("timeout", () => {
      socket.destroy();
      printError(`${serviceName} connection timeout`);
      results.push({
        name: serviceName,
        status: "fail",
        message: `${serviceName} connection timeout`,
      });
      resolve(false);
    });
  });
}

/**
 * Check HTTP endpoint health
 */
async function checkHttp(
  url: string,
  serviceName: string
): Promise<boolean> {
  return new Promise((resolve) => {
    http
      .get(url, { timeout: 5000 }, (res) => {
        const success = res.statusCode && res.statusCode < 500;
        if (success) {
          printSuccess(`${serviceName} HTTP endpoint is responding`);
          results.push({
            name: serviceName,
            status: "pass",
            message: `${serviceName} HTTP endpoint is responding`,
          });
        } else {
          printWarning(
            `${serviceName} HTTP endpoint returned status ${res.statusCode}`
          );
          results.push({
            name: serviceName,
            status: "warn",
            message: `${serviceName} returned status ${res.statusCode}`,
          });
        }
        resolve(success);
      })
      .on("error", () => {
        printError(`${serviceName} HTTP endpoint is NOT responding`);
        results.push({
          name: serviceName,
          status: "fail",
          message: `${serviceName} HTTP endpoint is NOT responding`,
        });
        resolve(false);
      });
  });
}

/**
 * Check Postgres connection
 */
async function checkPostgres(): Promise<void> {
  printInfo("Checking Postgres...");
  const host = process.env.POSTGRES_HOST || "localhost";
  const port = parseInt(process.env.POSTGRES_PORT || "5432", 10);

  await checkPort(host, port, "Postgres");
}

/**
 * Check Supabase services
 */
async function checkSupabase(): Promise<void> {
  printInfo("Checking Supabase services...");

  // Check REST API
  const restHost = process.env.SUPABASE_HOST || "localhost";
  const restPort = parseInt(process.env.SUPABASE_REST_PORT || "54321", 10);

  await checkPort(restHost, restPort, "Supabase REST API");

  // Try to check Supabase health endpoint
  await checkHttp(`http://${restHost}:${restPort}/health`, "Supabase Health");
}

/**
 * Check Vite development server
 */
async function checkVite(): Promise<void> {
  printInfo("Checking Vite development server...");

  const host = process.env.VITE_HOST || "localhost";
  const port1 = parseInt(process.env.VITE_PORT_1 || "8080", 10);
  const port2 = parseInt(process.env.VITE_PORT_2 || "5173", 10);

  const port1Ok = await checkPort(host, port1, `Vite on port ${port1}`);
  if (!port1Ok) {
    await checkPort(host, port2, `Vite on port ${port2}`);
  }
}

/**
 * Print summary
 */
function printSummary(): void {
  console.log("");
  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);

  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const warnCount = results.filter((r) => r.status === "warn").length;
  const total = results.length;

  if (failCount === 0) {
    printSuccess(`All checks passed! (${passCount}/${total})`);
  } else {
    printWarning(
      `Some checks failed (${passCount} passed, ${failCount} failed, ${warnCount} warnings)`
    );
    console.log("");
    console.log("Troubleshooting tips:");
    console.log("  1. Ensure Docker is running: docker ps");
    console.log("  2. Check Docker Compose status: docker-compose ps");
    console.log("  3. View Docker logs: docker-compose logs -f");
    console.log("  4. For manual reset: docker-compose down && docker-compose up -d");
  }

  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log(colors.blue);
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Health Check - Local Dev Environment  ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(colors.reset);
  console.log("");

  await checkPostgres();
  console.log("");
  await checkSupabase();
  console.log("");
  await checkVite();

  printSummary();

  // Exit with error code if any checks failed
  const failCount = results.filter((r) => r.status === "fail").length;
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(console.error);
