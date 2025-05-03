import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { nl } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

// Map van taalcodes naar locale-objecten
const localeMap = {
  nl: nl,
};

// Functie om alle datums tussen een start- en einddatum te genereren
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

export function Calendar({ locale = 'en' }) {
  const [selected, setSelected] = useState(null);
  const [disabledDates, setDisabledDates] = useState([]);

  // Bepaal welke locale we moeten gebruiken
  const selectedLocale = locale !== 'en' ? localeMap[locale] : undefined;

  useEffect(() => {
    async function fetchBookedDates() {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('status', 'booked');

      if (error) {
        console.error('Fout bij ophalen van geboekte datums:', error);
        return;
      }

      const allDisabled = [];

      data.forEach(({ start_date, end_date }) => {
        const start = new Date(start_date);
        const end = new Date(end_date);

        // Geneer datums tussen start en eind (exclusief start- en einddatum)
        const betweenDates = getDatesInRange(
          new Date(start.getTime() + 86400000), // +1 dag
          new Date(end.getTime() - 86400000) // -1 dag
        );

        allDisabled.push(...betweenDates);
      });

      setDisabledDates(allDisabled);
    }

    fetchBookedDates();
  }, []);

  // Controleer of de geselecteerde datum in de disabledDates lijst zit
  const isDateDisabled = (date) => {
    return disabledDates.some(
      (disabledDate) => disabledDate.toDateString() === date.toDateString()
    );
  };

  // Controleer of een range geblokte dagen bevat
  const rangeContainsDisabledDate = (from, to) => {
    if (!from || !to) return false;

    // Zorg dat 'from' altijd de vroegere datum is en 'to' de latere
    const startDate = from < to ? from : to;
    const endDate = from < to ? to : from;

    const datesInRange = getDatesInRange(startDate, endDate);
    return datesInRange.some((date) => isDateDisabled(date));
  };

  // Handler voor de DayPicker onSelect event
  const handleRangeSelect = (range) => {
    if (!range) {
      setSelected(null);
      return;
    }

    // Als er geen 'to' is, maak het een enkele datum selectie
    if (!range.to) {
      setSelected({ from: range.from, to: range.from });
      return;
    }

    // Controleer of de range geblokte dagen bevat
    if (rangeContainsDisabledDate(range.from, range.to)) {
      // Bepaal welke datum als laatste is aangeklikt
      const mostRecentlyClickedDate =
        selected &&
        selected.from &&
        selected.from.toDateString() === range.from.toDateString()
          ? range.to
          : range.from;

      // Reset naar enkele datum selectie
      setSelected({
        from: mostRecentlyClickedDate,
        to: mostRecentlyClickedDate,
      });
    } else {
      // Range is geldig
      setSelected(range);
    }
  };

  return (
    <DayPicker
      animate
      mode="range"
      selected={selected}
      onSelect={handleRangeSelect}
      locale={selectedLocale}
      disabled={isDateDisabled}
      modifiersClassNames={{
        today: 'rdp-today',
        selected: 'bg-green !text-white',
        range_start: 'rounded-l-full',
        range_end: 'rounded-r-full',
        range_single: 'rounded-full',
      }}
    />
  );
}
