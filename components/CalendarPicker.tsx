import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function todayStr() {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

export default function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const today = todayStr();
  const initial = value || today;
  const [viewYear, setViewYear] = useState(
    Number(initial.slice(0, 4)) || new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    Number(initial.slice(5, 7)) - 1 // 0-indexed
  );

  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-US", {
    month: "long",
  });

  // Calendar grid data
  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const rows: (number | null)[][] = [];
    let week: (number | null)[] = new Array(firstDay).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) {
        rows.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      rows.push(week);
    }
    return rows;
  }, [viewYear, viewMonth]);

  function goPrev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function handleDayPress(day: number) {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    if (dateStr < today) return; // ignore past dates
    onChange(dateStr);
  }

  return (
    <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
      {/* Month nav */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          onPress={goPrev}
          className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
        >
          <Text className="text-light-100 text-lg font-bold">‹</Text>
        </TouchableOpacity>
        <Text className="text-light-100 font-bold text-base">
          {monthName} {viewYear}
        </Text>
        <TouchableOpacity
          onPress={goNext}
          className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
        >
          <Text className="text-light-100 text-lg font-bold">›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week header */}
      <View className="flex-row mb-1">
        {DAYS.map((d) => (
          <View key={d} className="flex-1 items-center py-1">
            <Text className="text-light-300 text-[10px] font-semibold">{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {cells.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} className="flex-1 items-center py-2" />;
            }
            const dateStr = toDateStr(viewYear, viewMonth, day);
            const isPast = dateStr < today;
            const isSelected = dateStr === value;
            const isToday = dateStr === today;

            return (
              <TouchableOpacity
                key={di}
                onPress={() => handleDayPress(day)}
                disabled={isPast}
                className={`flex-1 items-center py-2 mx-0.5 rounded-xl ${
                  isSelected
                    ? "bg-accent"
                    : isToday
                    ? "bg-white/10"
                    : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-white font-bold"
                      : isPast
                      ? "text-light-300/30"
                      : "text-light-100"
                  }`}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
