import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { addCalendarDays, getTodayDate } from '../utils/calendarDate';

export function useTodayDate(): string {
  const [today, setToday] = useState(getTodayDate);

  useEffect(() => {
    const update = () => setToday(getTodayDate());
    const nextMidnight = new Date(`${addCalendarDays(today, 1)}T00:00:00+07:00`).getTime();
    const timer = setTimeout(update, Math.max(0, nextMidnight - Date.now()) + 50);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [today]);

  return today;
}
