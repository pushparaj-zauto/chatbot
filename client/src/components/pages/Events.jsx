import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../services/api/axiosInstance';
import toast from 'react-hot-toast';
import API_ENDPOINTS from '../../services/api/endpoints';
import DeleteEventModal from '../modals/DeleteEventModal';
import Pagination from '../common/Pagination';
import CustomDropdown from '../common/CustomDropdown';
import DateRangePicker from '../common/DateRangePicker';
import {
  formatTimestamp,
  getEventDateTime,
  formatEveDate,
  formatEveTime,
} from '../../utils/dateUtils';
import { Calendar, MapPin, X, Clock, PinIcon, RefreshCw } from 'lucide-react';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // dropdowns
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState(null);

  // modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const dropdownRef = useRef(null);

  const statusOptions = ['pending', 'completed', 'cancelled'];
  const priorityOptions = ['low', 'medium', 'high'];

  useEffect(() => {
    fetchEvents();
  }, [
    statusFilter,
    priorityFilter,
    startDate,
    endDate,
    currentPage,
    itemsPerPage,
  ]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      const response = await axiosInstance.get(
        `${API_ENDPOINTS.EVENTS.LIST}?${params.toString()}`,
      );
      setEvents(response.data.events || []);
      setPaginationData(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchEvents();
      toast.success('Events refreshed');
    } catch (error) {
      toast.error('Failed to refresh events');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchEventDetails = async (id) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.EVENTS.GET(id));
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }
      setSelectedEvent(response.data.event);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load event details');
      console.error(error);
    }
  };

  const updateEvent = async (id, updateData) => {
    try {
      const response = await axiosInstance.patch(
        API_ENDPOINTS.EVENTS.UPDATE(id),
        updateData,
      );
      if (response.data.success) {
        toast.success('Event updated successfully');
        fetchEvents();
        if (selectedEvent?.id === id) {
          setSelectedEvent(response.data.event);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to update event');
      console.error(error);
    }
  };

  const deleteEvent = async (id) => {
    try {
      const response = await axiosInstance.delete(
        API_ENDPOINTS.EVENTS.DELETE(id),
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchEvents();
        if (selectedEvent?.id === id) {
          setSelectedEvent(null);
          setShowDetailsModal(false);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to delete event');
      console.error(error);
    } finally {
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const handleDeleteClick = (id) => {
    setEventToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEvent(null);
  };

  const handlePageChange = (newPage) => setCurrentPage(newPage);
  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const activeFiltersCount = [
    statusFilter !== 'pending' ? statusFilter : null,
    priorityFilter,
    startDate || endDate,
  ].filter(Boolean).length;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
      completed: 'bg-green-500/20 text-green-700 dark:text-green-400',
      cancelled: 'bg-red-500/20 text-red-700 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      medium: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
      high: 'bg-red-500/20 text-red-700 dark:text-red-400',
    };
    return (
      colors[priority] || 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
    );
  };

  const renderDateTime = (eventDate, eventTime) => {
    const { date, time, combined } = getEventDateTime({ eventDate, eventTime });
    if (date && time) return combined;
    if (date && !time) return date;
    if (!date && time) return time;
    return 'No date/time set';
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Events
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-gray-100 dark:bg-gray-800 
                     hover:bg-gray-200 dark:hover:bg-gray-700
                     text-gray-700 dark:text-gray-300
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
            aria-label="Refresh events"
          >
            <RefreshCw
              size={18}
              className={`${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}{' '}
              active
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1f2e] flex flex-wrap gap-3">
        <CustomDropdown
          label="Status"
          value={statusFilter}
          options={statusOptions}
          onChange={setStatusFilter}
          placeholder="All"
          isOpen={showStatusDropdown}
          onToggle={setShowStatusDropdown}
          className="min-w-[180px]"
        />
        <CustomDropdown
          label="Priority"
          value={priorityFilter}
          options={priorityOptions}
          onChange={setPriorityFilter}
          placeholder="All"
          isOpen={showPriorityDropdown}
          onToggle={setShowPriorityDropdown}
          className="min-w-[180px]"
        />
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
        {activeFiltersCount > 0 && (
          <button
            onClick={() => {
              setStatusFilter('pending');
              setPriorityFilter('');
              setStartDate('');
              setEndDate('');
            }}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-300 dark:border-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Calendar size={64} className="mb-4 opacity-50" />
            <p className="text-lg">
              {activeFiltersCount > 0
                ? 'No events match your filters'
                : 'Get started by creating a new event'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => fetchEventDetails(event.id)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {event.title}
                    </h3>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {event.eventDate && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <Calendar className="w-4 h-4" />
                        {formatEveDate(event.eventDate)}
                      </span>
                    )}
                    {event.eventTime && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                        <Clock className="w-4 h-4" />
                        {formatEveTime(event.eventTime)}
                      </span>
                    )}
                  </div>
                  {event.location && (
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <PinIcon className="w-4 h-4" />
                        {event.location}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span
                      className={`px-3 py-1 rounded-full text-xs capitalize ${getStatusColor(
                        event.status,
                      )}`}
                    >
                      {event.status}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(
                        event.priority,
                      )}`}
                    >
                      {event.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginationData && (
        <Pagination
          currentPage={paginationData.currentPage}
          totalPages={paginationData.totalPages || 1}
          totalItems={paginationData.totalItems || events.length}
          itemsPerPage={paginationData.itemsPerPage || itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4">
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
              onClick={handleCloseDetailsModal}
            ></div>

            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedEvent.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created {formatTimestamp(selectedEvent.createdAt)}
                  </p>
                </div>
                <button
                  onClick={handleCloseDetailsModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {selectedEvent.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Description
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Date & Time
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>
                      {renderDateTime(
                        selectedEvent.eventDate,
                        selectedEvent.eventTime,
                      )}
                    </span>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Location
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  </div>
                )}

                {/* Update status/priority */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                      Update Status
                    </label>
                    <select
                      value={selectedEvent.status}
                      onChange={(e) =>
                        updateEvent(selectedEvent.id, {
                          status: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option
                          key={status}
                          value={status}
                          className="capitalize"
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                      Update Priority
                    </label>
                    <select
                      value={selectedEvent.priority}
                      onChange={(e) =>
                        updateEvent(selectedEvent.id, {
                          priority: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorityOptions.map((priority) => (
                        <option
                          key={priority}
                          value={priority}
                          className="capitalize"
                        >
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseDetailsModal}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteClick(selectedEvent.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteEventModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEventToDelete(null);
        }}
        onConfirm={() => deleteEvent(eventToDelete)}
      />
    </div>
  );
};

export default Events;
