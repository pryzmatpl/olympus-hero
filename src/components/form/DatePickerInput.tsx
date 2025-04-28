import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="mb-4">
      <label className="block mb-2 text-sm font-medium text-white">
        {label}
      </label>
      
      <div className={`
        relative flex items-center bg-mystic-800 border 
        ${error ? 'border-red-500' : isFocused ? 'border-cosmic-500' : 'border-mystic-600'} 
        rounded-lg transition-colors
      `}>
        <DatePicker
          selected={selected}
          onChange={onChange}
          dateFormat="MMMM d, yyyy"
          showYearDropdown
          scrollableYearDropdown
          yearDropdownItemNumber={100}
          className="w-full bg-transparent py-2.5 px-4 text-white focus:outline-none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderText="Select your birth date"
        />
        <div className="absolute right-3 text-gray-400">
          <Calendar size={18} />
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