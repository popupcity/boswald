import { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { nl } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { differenceInDays } from 'date-fns';

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
  const [bookedDates, setBookedDates] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);

  // Bereken currentMinDays op basis van de geselecteerde datum
  const currentMinDays = useMemo(() => {
    if (!selected?.from || !pricingRules.length) return 1;

    const applicableRule = pricingRules.find(
      (rule) =>
        selected.from >= rule.start_date && selected.from <= rule.end_date
    );

    return applicableRule?.min_days || 1;
  }, [selected?.from, pricingRules]);

  const selectedLocale = locale !== 'en' ? localeMap[locale] : undefined;

  // Definieer 'today' als constante, niet als component variabele
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Laad data vanuit Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingsResponse, pricingResponse] = await Promise.all([
          supabase
            .from('bookings')
            .select('start_date, end_date')
            .eq('status', 'booked'),
          supabase
            .from('pricing')
            .select('start_date, end_date, min_days, price'),
        ]);

        if (bookingsResponse.error) {
          throw new Error(
            `Fout bij ophalen van boekingen: ${bookingsResponse.error.message}`
          );
        }

        if (pricingResponse.error) {
          throw new Error(
            `Fout bij ophalen van prijzen: ${pricingResponse.error.message}`
          );
        }

        // Verwerk boekingen
        const bookedDatesList = [];
        bookingsResponse.data.forEach(({ start_date, end_date }) => {
          const start = new Date(start_date);
          const end = new Date(end_date);

          // Voeg alle datums tussen start en eind toe (exclusief start/eind zelf)
          const betweenDates = getDatesInRange(
            new Date(start.getTime() + 86400000), // +1 dag
            new Date(end.getTime() - 86400000) // -1 dag
          );
          bookedDatesList.push(...betweenDates);
        });
        setBookedDates(bookedDatesList);

        // Verwerk prijsregels
        const formattedPricingRules = pricingResponse.data.map((rule) => ({
          ...rule,
          start_date: new Date(rule.start_date),
          end_date: new Date(rule.end_date),
        }));
        setPricingRules(formattedPricingRules);
      } catch (error) {
        console.error('Fout bij gegevens ophalen:', error);
      }
    }

    fetchData();
  }, []);

  // Helper functies voor datum checks
  const isDateBooked = (date) => {
    return bookedDates.some(
      (bookedDate) => bookedDate.toDateString() === date.toDateString()
    );
  };

  const getNextBookedDate = (fromDate) => {
    return bookedDates.filter((d) => d > fromDate).sort((a, b) => a - b)[0];
  };

  const isDateDisabled = (date) => {
    // Basis checks: verleden of geboekt
    if (date < today || isDateBooked(date)) {
      return true;
    }

    // Als er geen startdatum is geselecteerd, alleen basis checks toepassen
    if (!selected?.from) {
      return false;
    }

    // Als deze datum een potentiële einddatum is (na de geselecteerde startdatum)
    if (date > selected.from) {
      // Check 1: Periodes die een boeking overspannen voorkomen
      const nextBookedDate = getNextBookedDate(selected.from);
      if (nextBookedDate && date > nextBookedDate) {
        return true;
      }

      // Check 2: Minimum aantal dagen
      const daysDifference = differenceInDays(date, selected.from) + 1;
      if (daysDifference < currentMinDays) {
        return true;
      }
    }

    return false;
  };

  // Check of een datumbereik geblokkeerde data bevat
  const rangeContainsDisabledDate = (from, to) => {
    if (!from || !to) return false;

    const startDate = from < to ? from : to;
    const endDate = from < to ? to : from;

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      // Check alleen op fundamenteel uitgeschakelde datums (verleden of geboekt)
      if (d < today || isDateBooked(d)) {
        return true;
      }
    }

    return false;
  };

  // Handler voor selectie van datumbereik
  const handleRangeSelect = (range) => {
    if (!range) {
      setSelected(null);
      return;
    }

    // Als alleen een 'from' datum is geselecteerd
    if (!range.to) {
      setSelected({ from: range.from, to: range.from });
      return;
    }

    // Als het bereik een uitgeschakelde datum bevat
    if (rangeContainsDisabledDate(range.from, range.to)) {
      // Bepaal de meest recent aangeklikte datum
      const mostRecentlyClickedDate =
        selected?.from?.toDateString() === range.from.toDateString()
          ? range.to
          : range.from;

      // Reset selectie naar alleen de meest recent aangeklikte datum
      setSelected({
        from: mostRecentlyClickedDate,
        to: mostRecentlyClickedDate,
      });
      return;
    }

    // Anders, accepteer het volledige bereik
    setSelected(range);
  };

  // Footer content op basis van de selectie
  const footerContent = useMemo(() => {
    if (!selected?.from) return null;

    const isSingleDaySelected =
      !selected.to ||
      selected.from.toDateString() === selected.to.toDateString();

    return (
      <div className="text-center mt-2 text-sm text-gray-600">
        {isSingleDaySelected ? (
          <p>Minimale verblijfsduur: {currentMinDays} dagen</p>
        ) : (
          <p>
            Geselecteerd: {differenceInDays(selected.to, selected.from) + 1}{' '}
            dagen
          </p>
        )}
      </div>
    );
  }, [selected, currentMinDays]);

  return (
    <div>
      <DayPicker
        animate
        mode="range"
        selected={selected}
        onSelect={handleRangeSelect}
        locale={selectedLocale}
        disabled={isDateDisabled}
        modifiers={{
          minDays: (date) => {
            if (!selected?.from || date <= selected.from) return false;
            const daysDifference = differenceInDays(date, selected.from) + 1;
            return daysDifference < currentMinDays;
          },
        }}
        modifiersClassNames={{
          today: 'rdp-today',
          selected: 'bg-green !text-white !opacity-100',
          range_start: 'rounded-l-full',
          range_end: 'rounded-r-full',
          range_single: 'rounded-full',
          minDays: 'rdp-min-days',
        }}
        footer={footerContent}
      />
    </div>
  );
}
