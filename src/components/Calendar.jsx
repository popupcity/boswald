import { useState, useEffect, useMemo, useRef } from 'react'; // useRef toegevoegd
import { DayPicker } from 'react-day-picker';
import { nl } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { differenceInDays, format } from 'date-fns';
import { getTranslations } from '../translations/index.ts';

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
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // 'arrival' of 'departure'

  // Referenties voor de kalender en de inputvelden
  const calendarContainerRef = useRef(null); // Ref voor de div die de DayPicker bevat
  const arrivalInputRef = useRef(null); // Ref voor het aankomstdatum input-div
  const departureInputRef = useRef(null); // Ref voor het vertrekdatum input-div

  const t = getTranslations(locale);

  const currentMinDays = useMemo(() => {
    if (!selected?.from || !pricingRules.length) return 1;
    const applicableRule = pricingRules.find(
      (rule) =>
        selected.from >= new Date(rule.start_date) &&
        selected.from <= new Date(rule.end_date)
    );
    return applicableRule?.min_days || 1;
  }, [selected?.from, pricingRules]);

  const selectedLocale = locale !== 'en' ? localeMap[locale] : undefined;

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Effect om buiten de kalender te klikken
  useEffect(() => {
    function handleClickOutside(event) {
      // Controleer of de klik buiten de kalender EN buiten de inputvelden was
      if (
        calendarContainerRef.current &&
        !calendarContainerRef.current.contains(event.target) &&
        arrivalInputRef.current &&
        !arrivalInputRef.current.contains(event.target) &&
        departureInputRef.current &&
        !departureInputRef.current.contains(event.target)
      ) {
        // Alleen sluiten als de kalender zichtbaar is
        if (datePickerVisible) {
          setDatePickerVisible(false);
        }
      }
    }

    // Voeg de event listener toe
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup functie: verwijder de event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [datePickerVisible]); // Dependency array, zodat het effect opnieuw runt als datePickerVisible verandert

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

        const bookedDatesList = [];
        bookingsResponse.data.forEach(({ start_date, end_date }) => {
          const start = new Date(start_date);
          const end = new Date(end_date);
          const betweenDates = getDatesInRange(
            new Date(start.getTime() + 86400000),
            new Date(end.getTime() - 86400000)
          );
          bookedDatesList.push(...betweenDates);
        });
        setBookedDates(bookedDatesList);

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

  const isDateBooked = (date) => {
    return bookedDates.some(
      (bookedDate) => bookedDate.toDateString() === date.toDateString()
    );
  };

  const getNextBookedDate = (fromDate) => {
    return bookedDates.filter((d) => d > fromDate).sort((a, b) => a - b)[0];
  };

  const isDateDisabled = (date) => {
    if (date < today || isDateBooked(date)) {
      return true;
    }
    if (!selected?.from) {
      return false;
    }
    if (date > selected.from) {
      const nextBookedDate = getNextBookedDate(selected.from);
      if (nextBookedDate && date > nextBookedDate) {
        return true;
      }
      const daysDifference = differenceInDays(date, selected.from) + 1;
      if (daysDifference < currentMinDays) {
        return true;
      }
    }
    return false;
  };

  const rangeContainsDisabledDate = (from, to) => {
    if (!from || !to) return false;
    const startDate = from < to ? from : to;
    const endDate = from < to ? to : from;
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      if (d < today || isDateBooked(d)) {
        return true;
      }
    }
    return false;
  };

  const handleRangeSelect = (range) => {
    if (!range) {
      setSelected(null);
      // Overweeg of de picker hier gesloten moet worden of open moet blijven voor een nieuwe selectie.
      // Voor nu laten we het sluiten zoals het was, maar je kunt dit aanpassen.
      // setDatePickerVisible(false); // Optioneel: direct sluiten
      return;
    }

    if (!range.to) {
      // Alleen 'from' datum is geselecteerd
      if (activeInput === 'arrival') {
        setSelected({ from: range.from, to: null });
        setActiveInput('departure'); // Schakel naar vertrek input
        // Houd de kalender open voor de selectie van de vertrekdatum
      } else if (activeInput === 'departure' && selected?.from) {
        if (range.from < selected.from) {
          // Als nieuwe datum voor de bestaande 'from' is
          setSelected({ from: range.from, to: selected.from });
        } else {
          setSelected({ ...selected, to: range.from });
        }
        // Sluit de kalender als een volledige range is geselecteerd
        if (selected.from && range.from) {
          // Zorg ervoor dat beide datums geldig zijn
          setDatePickerVisible(false);
        }
      } else {
        // Fallback of als 'departure' als eerste wordt geklikt zonder 'from'
        setSelected({ from: range.from, to: null });
        setActiveInput('departure');
        // Houd de kalender open
      }
      return;
    }

    // 'from' en 'to' zijn beide geselecteerd
    if (rangeContainsDisabledDate(range.from, range.to)) {
      const mostRecentlyClickedDate =
        activeInput === 'arrival' ? range.from : range.to;

      setSelected({
        from: mostRecentlyClickedDate,
        to: null, // Reset 'to' zodat de gebruiker opnieuw kan kiezen
      });
      setActiveInput(activeInput === 'arrival' ? 'departure' : 'arrival'); // Wissel naar de andere input
      // Houd de kalender open
      return;
    }

    setSelected(range);
    setDatePickerVisible(false); // Sluit na een succesvolle volledige range selectie
  };

  const handleInputClick = (inputType) => {
    setActiveInput(inputType);
    setDatePickerVisible(true); // Altijd openen bij klik op input
  };

  const handleClearDates = () => {
    setSelected(null);
    setDatePickerVisible(false);
  };

  const formattedArrivalDate = selected?.from
    ? format(selected.from, 'dd/MM/yyyy')
    : '';
  const formattedDepartureDate = selected?.to
    ? format(selected.to, 'dd/MM/yyyy')
    : '';

  const footerContent = useMemo(() => {
    if (!selected?.from) return null;
    const isSingleDaySelected =
      !selected.to ||
      selected.from.toDateString() === selected.to.toDateString();
    return (
      <div className="text-center mt-2 text-sm text-gray-600">
        {isSingleDaySelected ? (
          <p>{t.calendar.minimumStay.replace('{days}', currentMinDays)}</p>
        ) : (
          <p>
            {t.calendar.selectedDays.replace(
              '{days}',
              differenceInDays(selected.to, selected.from) + 1
            )}
          </p>
        )}
      </div>
    );
  }, [selected, currentMinDays, t]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Aankomst datumvakje met ref */}
        <div className="flex-1" ref={arrivalInputRef}>
          <div
            className="border rounded-lg p-3 cursor-pointer hover:border-green focus:border-green"
            onClick={() => handleInputClick('arrival')}
            tabIndex={0}
          >
            <div className="text-xs text-gray-500 font-medium">
              {t.calendar.arrival}
            </div>
            <div
              className={`text-base mt-1 ${
                !formattedArrivalDate ? 'text-gray-400' : 'text-gray-800'
              }`}
            >
              {formattedArrivalDate || t.calendar.selectDate}
            </div>
          </div>
        </div>
        {/* Vertrek datumvakje met ref */}
        <div className="flex-1" ref={departureInputRef}>
          <div
            className="border rounded-lg p-3 cursor-pointer hover:border-green focus:border-green"
            onClick={() => handleInputClick('departure')}
            tabIndex={0}
          >
            <div className="text-xs text-gray-500 font-medium">
              {t.calendar.departure}
            </div>
            <div
              className={`text-base mt-1 ${
                !formattedDepartureDate ? 'text-gray-400' : 'text-gray-800'
              }`}
            >
              {formattedDepartureDate || t.calendar.selectDate}
            </div>
          </div>
        </div>
      </div>

      {(selected?.from || selected?.to) && (
        <div className="flex justify-end">
          <button
            className="text-sm text-green hover:underline"
            onClick={handleClearDates}
          >
            {t.calendar.clearDates}
          </button>
        </div>
      )}

      {/* Kalender met ref op de container div */}
      {datePickerVisible && (
        <div
          ref={calendarContainerRef}
          className="mt-2 border rounded-lg p-4 shadow-md"
        >
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
                const daysDifference =
                  differenceInDays(date, selected.from) + 1;
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
      )}
    </div>
  );
}
