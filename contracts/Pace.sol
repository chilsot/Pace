// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Pace {
    struct DayRecord {
        uint32 steps;
        uint16 waterMl;
        uint16 reps;
        uint64 recordedAt;
    }

    struct Profile {
        uint64 recordedDays;
        uint64 totalSteps;
        uint64 totalWaterMl;
        uint64 totalReps;
        uint64 checkIns;
        uint64 lastCheckInDay;
        uint64 bestDayScore;
        uint16 streak;
    }

    mapping(address => mapping(uint64 => DayRecord)) private records;
    mapping(address => Profile) private profiles;

    uint64 public globalRecordedDays;
    uint64 public globalCheckIns;

    event DayRecorded(address indexed user, uint64 indexed day, uint32 steps, uint16 waterMl, uint16 reps);
    event DailyCheckIn(address indexed user, uint64 indexed day, uint16 streak);

    function recordDay(uint32 steps, uint16 waterMl, uint16 reps) external {
        require(steps <= 200000, "Steps too high");
        require(waterMl <= 20000, "Water too high");
        require(reps <= 10000, "Reps too high");
        require(steps > 0 || waterMl > 0 || reps > 0, "Nothing to record");

        uint64 today = uint64(block.timestamp / 1 days);
        require(records[msg.sender][today].recordedAt == 0, "Day already recorded");

        records[msg.sender][today] = DayRecord(steps, waterMl, reps, uint64(block.timestamp));

        Profile storage profile = profiles[msg.sender];
        profile.recordedDays += 1;
        profile.totalSteps += steps;
        profile.totalWaterMl += waterMl;
        profile.totalReps += reps;

        uint64 score = uint64(steps) + uint64(waterMl) * 4 + uint64(reps) * 100;
        if (score > profile.bestDayScore) profile.bestDayScore = score;

        globalRecordedDays += 1;
        emit DayRecorded(msg.sender, today, steps, waterMl, reps);
    }

    function dailyCheckIn() external {
        uint64 today = uint64(block.timestamp / 1 days);
        Profile storage profile = profiles[msg.sender];
        require(profile.lastCheckInDay != today, "Already checked in today");

        profile.streak = profile.lastCheckInDay + 1 == today ? profile.streak + 1 : 1;
        profile.lastCheckInDay = today;
        profile.checkIns += 1;
        globalCheckIns += 1;

        emit DailyCheckIn(msg.sender, today, profile.streak);
    }

    function recordOf(address user, uint64 day) external view returns (DayRecord memory) {
        return records[user][day];
    }

    function profileOf(address user) external view returns (Profile memory) {
        return profiles[user];
    }
}
