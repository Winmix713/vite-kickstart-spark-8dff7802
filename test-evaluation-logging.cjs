#!/usr/bin/env node

/**
 * Node.js test script for evaluation logging system
 * Tests the CSV creation and basic functionality
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOG_FILE_PATH = '/tmp/evaluation_log.csv';
const CSV_HEADER = 'prediction_id,timestamp,model_version,team_a,team_b,predicted_result,actual_result,confidence';

function generatePredictionId() {
  return crypto.randomUUID();
}

function formatTimestamp() {
  return new Date().toISOString();
}

function escapeCsvField(field) {
  if (field === null || field === undefined) {
    return '';
  }
  
  const str = String(field);
  
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

function ensureLogFile() {
  try {
    fs.statSync(LOG_FILE_PATH);
  } catch (error) {
    if (error.code === 'ENOENT') {
      fs.writeFileSync(LOG_FILE_PATH, CSV_HEADER + '\n');
      console.log('✅ Created evaluation log file with header');
    } else {
      throw error;
    }
  }
}

function logPredictionEvent(
  prediction_id,
  team_a,
  team_b,
  confidence,
  predicted_result,
  actual_result = null,
  model_version = "v1.0"
) {
  try {
    // Validate confidence
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be a number between 0 and 1');
    }
    
    // Ensure log file exists
    ensureLogFile();
    
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
    
    // Append to file
    fs.writeFileSync(LOG_FILE_PATH, row + '\n', { flag: 'a' });
    
    console.log(`✅ Logged prediction event: ${prediction_id} (${predicted_result}, ${confidence})`);
    
  } catch (error) {
    console.error('❌ Error logging prediction event:', error);
    throw error;
  }
}

function readEvaluationLog() {
  try {
    ensureLogFile();
    
    const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    const lines = content.trim().split('\n');
    
    // Skip header line
    if (lines.length <= 1) {
      return [];
    }
    
    const entries = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
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

// Test functions
async function testPredictionLogging() {
  console.log("1️⃣ Testing initial prediction logging...");
  
  try {
    const predictionId = generatePredictionId();
    
    console.log(`   Generated prediction ID: ${predictionId}`);
    
    logPredictionEvent(
      predictionId,
      "Manchester United",
      "Liverpool",
      0.75,
      "home_win",
      null, // actual_result is null at prediction time
      "v1.0"
    );
    
    console.log("   ✅ Initial prediction logged successfully\n");
    return predictionId;
    
  } catch (error) {
    console.error("   ❌ Failed to log initial prediction:", error);
    throw error;
  }
}

async function testResultReconciliation(predictionId) {
  console.log("2️⃣ Testing result reconciliation...");
  
  try {
    logPredictionEvent(
      predictionId,
      "Manchester United",
      "Liverpool", 
      0.75,
      "home_win",
      "away_win", // actual result
      "v1.0"
    );
    
    console.log("   ✅ Result reconciliation logged successfully\n");
    
  } catch (error) {
    console.error("   ❌ Failed to log result reconciliation:", error);
    throw error;
  }
}

async function testLogReading() {
  console.log("3️⃣ Testing log file reading...");
  
  try {
    const entries = readEvaluationLog();
    console.log(`   Found ${entries.length} log entries`);
    
    if (entries.length >= 2) {
      const latestEntry = entries[entries.length - 1];
      console.log(`   Latest entry: ${latestEntry.prediction_id} - ${latestEntry.predicted_result} vs ${latestEntry.actual_result}`);
    }
    
    console.log("   ✅ Log file reading successful\n");
    
  } catch (error) {
    console.error("   ❌ Failed to read log file:", error);
    throw error;
  }
}

async function testConfidenceValidation() {
  console.log("4️⃣ Testing confidence validation...");
  
  try {
    const predictionId = generatePredictionId();
    
    // Test invalid confidence (too high)
    try {
      logPredictionEvent(
        predictionId,
        "Team A",
        "Team B",
        1.5, // Invalid confidence > 1
        "home_win"
      );
      console.log("   ❌ Should have failed with confidence > 1");
    } catch (error) {
      console.log("   ✅ Correctly rejected confidence > 1");
    }
    
    // Test invalid confidence (negative)
    try {
      logPredictionEvent(
        predictionId + "-2",
        "Team A", 
        "Team B",
        -0.1, // Invalid confidence < 0
        "home_win"
      );
      console.log("   ❌ Should have failed with negative confidence");
    } catch (error) {
      console.log("   ✅ Correctly rejected negative confidence");
    }
    
    // Test valid confidence
    logPredictionEvent(
      predictionId + "-3",
      "Team A",
      "Team B", 
      0.85, // Valid confidence
      "home_win"
    );
    console.log("   ✅ Accepted valid confidence (0.85)\n");
    
  } catch (error) {
    console.error("   ❌ Confidence validation test failed:", error);
    throw error;
  }
}

function generateSummaryReport() {
  console.log("📊 Generating Summary Report...");
  
  try {
    const entries = readEvaluationLog();
    
    if (entries.length === 0) {
      console.log("   No entries found in evaluation log");
      return;
    }
    
    // Group by prediction_id to show predictions with their results
    const grouped = new Map();
    
    entries.forEach(entry => {
      if (!grouped.has(entry.prediction_id)) {
        grouped.set(entry.prediction_id, []);
      }
      grouped.get(entry.prediction_id).push(entry);
    });
    
    console.log(`   Total unique predictions: ${grouped.size}`);
    console.log(`   Total log entries: ${entries.length}`);
    
    let reconciledCount = 0;
    grouped.forEach((entries, predictionId) => {
      if (entries.length > 1) {
        reconciledCount++;
      }
    });
    
    console.log(`   Reconciled predictions: ${reconciledCount}`);
    console.log(`   Pending reconciliation: ${grouped.size - reconciledCount}\n`);
    
  } catch (error) {
    console.error("   ❌ Failed to generate summary report:", error);
  }
}

// Run all tests
async function runAllTests() {
  try {
    const predictionId = await testPredictionLogging();
    await testResultReconciliation(predictionId);
    await testLogReading();
    await testConfidenceValidation();
    await generateSummaryReport();
    
    console.log("🎉 All tests completed successfully!");
    console.log("\n📁 Evaluation log file location: /tmp/evaluation_log.csv");
    console.log("💡 To view the log file: cat /tmp/evaluation_log.csv");
    
  } catch (error) {
    console.error("\n💥 Test suite failed:", error);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  generatePredictionId,
  logPredictionEvent,
  readEvaluationLog
};