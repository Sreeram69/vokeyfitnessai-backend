const User = require("../models/User");
const Activity = require("../models/Activity");

class GoogleFitService {
  // Helpers to get client configurations dynamically
  getGoogleCredentials() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Google Fit API credentials are not fully configured on the server");
    }

    return { clientId, clientSecret, redirectUri };
  }

  // Refreshes the access token if it's expired or near expiry (5 minute window)
  async getOrRefreshAccessToken(user) {
    const creds = user.googleFitCredentials;
    if (!creds || !creds.isConnected) {
      throw new Error("Google Fit is not integrated for this account");
    }

    if (creds.accessToken && creds.expiryDate > Date.now() + 300000) {
      return creds.accessToken;
    }

    if (!creds.refreshToken) {
      throw new Error("Google Fit refresh token is missing. Please reconnect.");
    }

    const { clientId, clientSecret } = this.getGoogleCredentials();

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: creds.refreshToken,
        grant_type: "refresh_token"
      })
    });

    const refreshedTokens = await response.json();
    if (refreshedTokens.error) {
      // If user uninstalled Fit or revoked access, set isConnected to false and alert them
      if (
        refreshedTokens.error === "invalid_grant" || 
        refreshedTokens.error_description?.includes("revoked") || 
        refreshedTokens.error_description?.includes("expired")
      ) {
        user.googleFitCredentials.isConnected = false;
        await user.save();
        
        try {
          const Notification = require("../models/Notification");
          await Notification.create({
            recipient: user._id,
            sender: "system",
            title: "Google Fit Sync Stopped",
            message: "Vokey Fitness lost access to your Google Fit account. This happens if you uninstalled the companion app or revoked permissions. Tap 'Sync' on your dashboard to reconnect.",
            type: "auth",
            priority: "medium"
          });
        } catch (notifErr) {
          console.error("Failed to generate Google Fit disconnection notification:", notifErr.message);
        }
      }
      throw new Error(`Token refresh failed: ${refreshedTokens.error_description || refreshedTokens.error}`);
    }

    const newExpiry = Date.now() + (refreshedTokens.expires_in * 1000);
    user.googleFitCredentials.accessToken = refreshedTokens.access_token;
    user.googleFitCredentials.expiryDate = newExpiry;
    await user.save();

    return refreshedTokens.access_token;
  }

  // Generic aggregate aggregator query to keep code DRY and maintain rate-limits
  async fetchMetricAggregate(accessToken, dataTypeName, dataSourceId, startTimeMillis, endTimeMillis) {
    try {
      const response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName,
              dataSourceId
            }
          ],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis
        })
      });

      const data = await response.json();
      if (data.error) {
        console.error(`Google Fit lookup for ${dataTypeName} failed:`, data.error.message);
        return 0;
      }

      let totalVal = 0;
      if (data.bucket && data.bucket[0] && data.bucket[0].dataset) {
        const points = data.bucket[0].dataset[0].point;
        if (points && points.length > 0) {
          points.forEach(point => {
            if (point.value && point.value[0]) {
              // Int values or floating values depending on data type
              totalVal += point.value[0].intVal || point.value[0].fpVal || 0;
            }
          });
        }
      }
      return totalVal;
    } catch (e) {
      console.error(`Aggregate exception for ${dataTypeName}:`, e.message);
      return 0;
    }
  }

  // Fetch heart rate average
  async fetchHeartRate(accessToken, startTimeMillis, endTimeMillis) {
    try {
      const response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: "com.google.heart_rate.bpm",
              dataSourceId: "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm"
            }
          ],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis
        })
      });
      const data = await response.json();
      let sum = 0, count = 0;
      if (data.bucket && data.bucket[0] && data.bucket[0].dataset && data.bucket[0].dataset[0]) {
        const points = data.bucket[0].dataset[0].point;
        if (points && points.length > 0) {
          points.forEach(p => {
            if (p.value && p.value[0]) {
              const val = p.value[0].fpVal || p.value[0].intVal || 0;
              if (val > 0) {
                sum += val;
                count++;
              }
            }
          });
        }
      }
      return count > 0 ? Math.round(sum / count) : 0;
    } catch (e) {
      console.error("Error fetching heart rate:", e.message);
      return 0;
    }
  }

  // Fetch sleep duration in hours
  async fetchSleepHours(accessToken, startTimeMillis, endTimeMillis) {
    try {
      const response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: "com.google.sleep.segment"
            }
          ],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis
        })
      });
      const data = await response.json();
      let totalSleepMillis = 0;
      if (data.bucket && data.bucket[0] && data.bucket[0].dataset && data.bucket[0].dataset[0]) {
        const points = data.bucket[0].dataset[0].point;
        if (points && points.length > 0) {
          points.forEach(p => {
            const startNanos = p.startTimeNanos;
            const endNanos = p.endTimeNanos;
            if (startNanos && endNanos) {
              const durMillis = (Number(endNanos) - Number(startNanos)) / 1000000;
              const type = p.value && p.value[0] ? p.value[0].intVal : 2;
              if (type === 2 || type >= 4) {
                totalSleepMillis += durMillis;
              }
            }
          });
        }
      }

      if (totalSleepMillis === 0) {
        const dataSourceId = "derived:com.google.sleep.segment:com.google.android.gms:merge_sleep_segment";
        const getUrl = `https://www.googleapis.com/fitness/v1/users/me/dataSources/${dataSourceId}/datasets/${startTimeMillis}000000-${endTimeMillis}000000`;
        const directRes = await fetch(getUrl, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const directData = await directRes.json();
        if (directData.point && directData.point.length > 0) {
          directData.point.forEach(p => {
            const start = Number(p.startTimeNanos) / 1000000;
            const end = Number(p.endTimeNanos) / 1000000;
            const type = p.value && p.value[0] ? p.value[0].intVal : 2;
            if (type === 2 || type >= 4) {
              totalSleepMillis += (end - start);
            }
          });
        }
      }

      const hours = totalSleepMillis / (1000 * 60 * 60);
      return hours > 0 ? parseFloat(hours.toFixed(1)) : 0;
    } catch (e) {
      console.error("Error fetching sleep hours:", e.message);
      return 0;
    }
  }

  // Unified production sync orchestrator that pulls all daily metrics
  async syncAllMetrics(user, dateString) {
    const accessToken = await this.getOrRefreshAccessToken(user);

    let tStart, tEnd;
    let localDate;
    if (dateString) {
      localDate = new Date(dateString);
      const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateString}T23:59:59.999Z`);
      tStart = startOfDay.getTime();
      tEnd = endOfDay.getTime();
    } else {
      localDate = new Date();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      tStart = todayStart.getTime();
      tEnd = todayEnd.getTime();
    }

    // Query steps delta, calories burned, active distance, active minutes, heart points, average heart rate, sleep hours
    const [steps, calories, distance, activeMinutes, heartPoints, averageHeartRate, sleepHours] = await Promise.all([
      this.fetchMetricAggregate(
        accessToken,
        "com.google.step_count.delta",
        "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
        tStart,
        tEnd
      ),
      this.fetchMetricAggregate(
        accessToken,
        "com.google.calories.expended",
        "derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
        tStart,
        tEnd
      ),
      this.fetchMetricAggregate(
        accessToken,
        "com.google.distance.delta",
        "derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta",
        tStart,
        tEnd
      ),
      this.fetchMetricAggregate(
        accessToken,
        "com.google.active_minutes",
        "derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes",
        tStart,
        tEnd
      ),
      this.fetchMetricAggregate(
        accessToken,
        "com.google.heart_minutes",
        "derived:com.google.heart_minutes:com.google.android.gms:merge_heart_minutes",
        tStart,
        tEnd
      ),
      this.fetchHeartRate(accessToken, tStart, tEnd),
      this.fetchSleepHours(accessToken, tStart, tEnd)
    ]);

    // Upsert into Activity collection
    let activityDate;
    if (dateString) {
      activityDate = new Date(`${dateString}T00:00:00.000Z`);
    } else {
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      activityDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    let activity = await Activity.findOne({ userId: user._id, date: activityDate });
    if (activity) {
      activity.steps = steps || activity.steps;
      activity.caloriesBurned = Math.round(calories) || activity.caloriesBurned;
      activity.timeTaken = (activeMinutes * 60000) || activity.timeTaken;
      activity.distance = Math.round(distance) || activity.distance;
      activity.heartPoints = heartPoints || activity.heartPoints;
      activity.averageHeartRate = averageHeartRate || activity.averageHeartRate;
      activity.sleepHours = sleepHours || activity.sleepHours;
      
      await activity.save();
    } else {
      activity = new Activity({
        userId: user._id,
        date: activityDate,
        steps,
        caloriesBurned: Math.round(calories),
        timeTaken: activeMinutes * 60000,
        distance: Math.round(distance),
        heartPoints,
        averageHeartRate,
        sleepHours,
        exercisesCompleted: []
      });
      await activity.save();
    }

    return {
      success: true,
      steps: activity.steps,
      caloriesBurned: activity.caloriesBurned,
      distance: activity.distance,
      activeMinutes: Math.round(activity.timeTaken / 60000),
      heartPoints: activity.heartPoints,
      averageHeartRate: activity.averageHeartRate,
      sleepHours: activity.sleepHours,
      syncedAt: new Date()
    };
  }
}

module.exports = new GoogleFitService();
