#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Test script for evaluation logging system
 * Tests both initial prediction logging and result reconciliation
 */

import { 
  generatePredictionId, 
  logPredictionEvent, 
  readEvaluationLog,
  getModelVersion 
} from "../supabase/functions/_shared/evaluation-logging.ts";

console.log("🧪 Testing Evaluation Logging System\n");

async function testPredictionLogging() {
  console.log("1️⃣ Testing initial prediction logging...");
  
  try {
    const predictionId = generatePredictionId();
    const modelVersion = await getModelVersion();
    
    console.log(`   Generated prediction ID: ${predictionId}`);
    console.log(`   Model version: ${modelVersion}`);
    
    await logPredictionEvent(
      predictionId,
      "Manchester United",
      "Liverpool",
      0.75,
      "home_win",
      null, // actual_result is null at prediction time
      modelVersion
    );
    
    console.log("   ✅ Initial prediction logged successfully\n");
    return predictionId;
    
  } catch (error) {
    console.error("   ❌ Failed to log initial prediction:", error);
    throw error;
  }
}

async function testResultReconciliation(predictionId: string) {
  console.log("2️⃣ Testing result reconciliation...");
  
  try {
    await logPredictionEvent(
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
    const entries = await readEvaluationLog();
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
      await logPredictionEvent(
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
      await logPredictionEvent(
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
    await logPredictionEvent(
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

async function testTimestampFormat() {
  console.log("5️⃣ Testing timestamp format...");
  
  try {
    const predictionId = generatePredictionId();
    
    await logPredictionEvent(
      predictionId,
      "Team A",
      "Team B",
      0.5,
      "draw"
    );
    
    const entries = await readEvaluationLog();
    const latestEntry = entries[entries.length - 1];
    
    // Check if timestamp is in ISO 8601 format
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (timestampRegex.test(latestEntry.timestamp)) {
      console.log(`   ✅ Timestamp format is correct: ${latestEntry.timestamp}\n`);
    } else {
      console.log(`   ❌ Invalid timestamp format: ${latestEntry.timestamp}\n`);
    }
    
  } catch (error) {
    console.error("   ❌ Timestamp format test failed:", error);
    throw error;
  }
}

async function generateSummaryReport() {
  console.log("📊 Generating Summary Report...");
  
  try {
    const entries = await readEvaluationLog();
    
    if (entries.length === 0) {
      console.log("   No entries found in evaluation log");
      return;
    }
    
    // Group by prediction_id to show predictions with their results
    const grouped = new Map<string, typeof entries>();
    
    entries.forEach(entry => {
      if (!grouped.has(entry.prediction_id)) {
        grouped.set(entry.prediction_id, []);
      }
      grouped.get(entry.prediction_id)!.push(entry);
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
    await testTimestampFormat();
    await generateSummaryReport();
    
    console.log("🎉 All tests completed successfully!");
    console.log("\n📁 Evaluation log file location: /tmp/evaluation_log.csv");
    console.log("💡 To view the log file: cat /tmp/evaluation_log.csv");
    
  } catch (error) {
    console.error("\n💥 Test suite failed:", error);
    Deno.exit(1);
  }
}

// Check if script is being run directly
if (import.meta.main) {
  await runAllTests();
}