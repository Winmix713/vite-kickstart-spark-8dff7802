import { join } from "https://deno.land/std@0.168.0/path/mod.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

export interface PredictionLogEntry {
  prediction_id: string;
  timestamp: string;
  model_version: string;
  team_a: string;
  team_b: string;
  predicted_result: string;
  actual_result: string | null;
  confidence: number;
}

const CSV_HEADER = "prediction_id,timestamp,model_version,team_a,team_b,predicted_result,actual_result,confidence";
const LOG_FILE_PATH = "/tmp/evaluation_log.csv";

/**
 * Generate a UUID v4 for prediction tracking
 */
export function generatePredictionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10
  
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/**
 * Ensure the CSV file exists with proper header
 */
async function ensureLogFile(): Promise<void> {
  try {
    // Check if file exists
    await Deno.stat(LOG_FILE_PATH);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // Create file with header
      await Deno.writeTextFile(LOG_FILE_PATH, CSV_HEADER + '\n');
    } else {
      throw error;
    }
  }
}

/**
 * Validate confidence value is between 0 and 1
 */
function validateConfidence(confidence: number): void {
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    throw new Error('Confidence must be a number between 0 and 1');
  }
}

/**
 * Format timestamp as ISO 8601 UTC string
 */
function formatTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Escape CSV fields to handle commas, quotes, and newlines
 */
function escapeCsvField(field: string | number | null): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const str = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

/**
 * Log a prediction event to the evaluation log CSV
 */
export async function logPredictionEvent(
  prediction_id: string,
  team_a: string,
  team_b: string,
  confidence: number,
  predicted_result: string,
  actual_result: string | null = null,
  model_version: string = "v1.0"
): Promise<void> {
  try {
    // Validate inputs
    if (!prediction_id || typeof prediction_id !== 'string') {
      throw new Error('prediction_id must be a non-empty string');
    }
    
    if (!team_a || typeof team_a !== 'string') {
      throw new Error('team_a must be a non-empty string');
    }
    
    if (!team_b || typeof team_b !== 'string') {
      throw new Error('team_b must be a non-empty string');
    }
    
    if (!predicted_result || typeof predicted_result !== 'string') {
      throw new Error('predicted_result must be a non-empty string');
    }
    
    if (actual_result !== null && (!actual_result || typeof actual_result !== 'string')) {
      throw new Error('actual_result must be null or a non-empty string');
    }
    
    validateConfidence(confidence);
    
    // Ensure log file exists
    await ensureLogFile();
    
    // Create CSV row
    const timestamp = formatTimestamp();
    const row = [
      escapeCsvField(prediction_id),
      escapeCsvField(timestamp),
      escapeCsvField(model_version),
      escapeCsvField(team_a),
      escapeCsvField(team_b),
      escapeCsvField(predicted_result),
      escapeCsvField(actual_result),
      escapeCsvField(confidence)
    ].join(',');
    
    // Append to file (atomic write)
    await Deno.writeTextFile(LOG_FILE_PATH, row + '\n', { append: true });
    
    console.log(`✅ Logged prediction event: ${prediction_id} (${predicted_result}, ${confidence})`);
    
  } catch (error) {
    console.error('❌ Error logging prediction event:', error);
    throw error;
  }
}

/**
 * Read all entries from the evaluation log
 */
export async function readEvaluationLog(): Promise<PredictionLogEntry[]> {
  try {
    await ensureLogFile();
    
    const content = await Deno.readTextFile(LOG_FILE_PATH);
    const lines = content.trim().split('\n');
    
    // Skip header line
    if (lines.length <= 1) {
      return [];
    }
    
    const entries: PredictionLogEntry[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV (simple parser - assumes no escaped quotes in this context)
      const fields = line.split(',');
      
      if (fields.length !== 8) {
        console.warn(`⚠️ Skipping malformed line ${i + 1}: ${line}`);
        continue;
      }
      
      entries.push({
        prediction_id: fields[0],
        timestamp: fields[1],
        model_version: fields[2],
        team_a: fields[3],
        team_b: fields[4],
        predicted_result: fields[5],
        actual_result: fields[6] || null,
        confidence: parseFloat(fields[7])
      });
    }
    
    return entries;
    
  } catch (error) {
    console.error('❌ Error reading evaluation log:', error);
    throw error;
  }
}

/**
 * Get model version from git commit hash or environment
 */
export async function getModelVersion(): Promise<string> {
  // Try to get git commit hash
  try {
    const process = Deno.run({
      cmd: ["git", "rev-parse", "HEAD"],
      stdout: "piped",
      stderr: "piped"
    });
    
    const [status, stdout, stderr] = await Promise.all([
      process.status(),
      process.output(),
      process.stderrOutput()
    ]);
    
    process.close();
    
    if (status.success && stdout.length > 0) {
      const commitHash = new TextDecoder().decode(stdout).trim();
      return commitHash.substring(0, 7); // Short hash
    }
  } catch (error) {
    console.warn('Could not get git commit hash:', error);
  }
  
  // Fallback to environment variable or default
  return Deno.env.get("MODEL_VERSION") || "v1.0";
}