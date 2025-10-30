import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";

const DateRangePicker = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}) => {
  return (
    <div className="flex items-center gap-3">
      {/* Start Date */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1f2e] border border-gray-300 dark:border-gray-700 rounded-lg">
        <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Start:
        </label>
        <DatePicker
          selected={startDate ? new Date(startDate) : null}
          onChange={(date) =>
            onStartChange(date ? date.toISOString().split("T")[0] : "")
          }
          dateFormat="dd-MM-yyyy"
          placeholderText="dd-mm-yyyy"
          className="bg-transparent border-none text-gray-900 dark:text-gray-300 text-sm focus:outline-none w-[110px] cursor-pointer"
          wrapperClassName="datepicker-wrapper"
          calendarClassName="custom-calendar"
        />
      </div>

      <span className="text-gray-600 dark:text-gray-500">-</span>

      {/* End Date */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1f2e] border border-gray-300 dark:border-gray-700 rounded-lg">
        <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          End:
        </label>
        <DatePicker
          selected={endDate ? new Date(endDate) : null}
          onChange={(date) =>
            onEndChange(date ? date.toISOString().split("T")[0] : "")
          }
          dateFormat="dd-MM-yyyy"
          placeholderText="dd-mm-yyyy"
          minDate={startDate ? new Date(startDate) : null}
          className="bg-transparent border-none text-gray-900 dark:text-gray-300 text-sm focus:outline-none w-[110px] cursor-pointer"
          wrapperClassName="datepicker-wrapper"
          calendarClassName="custom-calendar"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
