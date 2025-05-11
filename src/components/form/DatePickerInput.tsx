import React, { useState, useEffect } from 'react';
import './DatePickerInput.css';

interface DatePickerInputProps {
  label: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  helpText?: string;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  selected,
  onChange,
  error,
  helpText,
}) => {
  // State for individual date components
  const [day, setDay] = useState<string>(selected ? selected.getDate().toString() : '');
  const [month, setMonth] = useState<string>(selected ? (selected.getMonth() + 1).toString() : '');
  const [year, setYear] = useState<string>(selected ? selected.getFullYear().toString() : '');

  // Generate arrays for options
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Generate days array based on selected month and year
  const getDaysArray = () => {
    if (!month || !year) return Array.from({ length: 31 }, (_, i) => i + 1);
    const daysInMonth = getDaysInMonth(parseInt(month), parseInt(year));
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Update the date whenever individual components change
  useEffect(() => {
    if (day && month && year) {
      const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      onChange(newDate);
    } else {
      onChange(null);
    }
  }, [day, month, year, onChange]);

  // Update component state if selected prop changes
  useEffect(() => {
    if (selected) {
      setDay(selected.getDate().toString());
      setMonth((selected.getMonth() + 1).toString());
      setYear(selected.getFullYear().toString());
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [selected]);

  // Handle individual changes
  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDay(e.target.value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(e.target.value);
    
    // Adjust day if new month has fewer days
    if (day && year) {
      const daysInNewMonth = getDaysInMonth(parseInt(e.target.value), parseInt(year));
      if (parseInt(day) > daysInNewMonth) {
        setDay(daysInNewMonth.toString());
      }
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(e.target.value);
    
    // Adjust day for February in leap years
    if (day && month === '2') {
      const daysInNewMonth = getDaysInMonth(2, parseInt(e.target.value));
      if (parseInt(day) > daysInNewMonth) {
        setDay(daysInNewMonth.toString());
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block mb-2 text-sm font-medium text-white">
        {label}
      </label>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Month Select */}
        <div className="relative">
          <select
            value={month}
            onChange={handleMonthChange}
            className={`
              block w-full py-2.5 px-4 bg-mystic-800 text-white rounded-lg border 
              ${error ? 'border-red-500' : 'border-mystic-600'} 
              focus:outline-none focus:border-cosmic-500
            `}
          >
            <option value="" disabled>Month</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        
        {/* Day Select */}
        <div className="relative">
          <select
            value={day}
            onChange={handleDayChange}
            className={`
              block w-full py-2.5 px-4 bg-mystic-800 text-white rounded-lg border 
              ${error ? 'border-red-500' : 'border-mystic-600'} 
              focus:outline-none focus:border-cosmic-500
            `}
            disabled={!month || !year}
          >
            <option value="" disabled>Day</option>
            {getDaysArray().map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        
        {/* Year Select */}
        <div className="relative">
          <select
            value={year}
            onChange={handleYearChange}
            className={`
              block w-full py-2.5 px-4 bg-mystic-800 text-white rounded-lg border 
              ${error ? 'border-red-500' : 'border-mystic-600'} 
              focus:outline-none focus:border-cosmic-500
            `}
          >
            <option value="" disabled>Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-400">{helpText}</p>
      )}
    </div>
  );
};

export default DatePickerInput;