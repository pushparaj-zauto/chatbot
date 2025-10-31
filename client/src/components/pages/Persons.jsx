import { useState, useEffect } from 'react';
import axiosInstance from '../../services/api/axiosInstance';
import toast from 'react-hot-toast';
import API_ENDPOINTS from '../../services/api/endpoints';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  X,
  Search,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import Pagination from '../common/Pagination';

const Persons = () => {
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchPersons();
  }, [pagination.page, debouncedSearch]);

  const fetchPersons = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      const response = await axiosInstance.get(API_ENDPOINTS.PERSONS.LIST, {
        params,
      });
      setPersons(response.data.persons || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load persons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonDetails = async (id) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PERSONS.GET(id));
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }
      setSelectedPerson(response.data.person);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load person details');
      console.error(error);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPerson(null);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleItemsPerPageChange = (limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col bg-bgColor">
      {/* Header */}
      <div className="bg-navBgColor border-b border-borderColor px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary">Persons</h1>
            <p className="text-sm text-textSecondary mt-1">
              Manage persons extracted from your conversations
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary h-4 w-4" />
            <input
              type="text"
              placeholder="Search persons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bgColor border border-borderColor rounded-lg text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : persons.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <User className="mx-auto h-12 w-12 text-textSecondary" />
            <p className="mt-4 text-textSecondary">
              {searchTerm
                ? 'No persons found matching your search'
                : 'No persons found yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-6">
            {persons.map((person) => (
              <div
                key={person.id}
                onClick={() => fetchPersonDetails(person.id)}
                className="bg-navBgColor border border-borderColor rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all group"
              >
                {/* Header with Icon and Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-textPrimary truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {person.name}
                    </h3>
                  </div>
                </div>

                {/* Role/Status */}
                {(person.role || person.status) && (
                  <div className="mb-3">
                    {person.status && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mr-2">
                        {person.status}
                      </span>
                    )}
                    {person.role && (
                      <span className="text-xs text-textSecondary">
                        {person.role}
                      </span>
                    )}
                  </div>
                )}

                {/* Person Details */}
                <div className="space-y-1.5 mb-3">
                  {person.email && (
                    <div className="flex items-center text-xs text-textSecondary">
                      <Mail className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{person.email}</span>
                    </div>
                  )}
                  {person.phone && (
                    <div className="flex items-center text-xs text-textSecondary">
                      <Phone className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{person.phone}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2.5 border-t border-borderColor flex items-center justify-between text-xs text-textSecondary">
                  <div className="flex items-center truncate">
                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {formatTimestamp(person.createdAt)}
                    </span>
                  </div>
                  {person.events && person.events.length > 0 && (
                    <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium ml-2 flex-shrink-0">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {person.events.length}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-auto pt-6 pb-6 px-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-navBgColor rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navBgColor border-b border-borderColor p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-textPrimary">
                  {selectedPerson.name}
                </h2>
                <button
                  onClick={handleCloseDetailsModal}
                  className="text-textSecondary hover:text-textPrimary"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedPerson.role && (
                <div>
                  <label className="text-sm font-medium text-textSecondary">
                    Role
                  </label>
                  <p className="mt-1 text-textPrimary">{selectedPerson.role}</p>
                </div>
              )}

              {selectedPerson.email && (
                <div>
                  <label className="text-sm font-medium text-textSecondary">
                    Email
                  </label>
                  <p className="mt-1 text-textPrimary">
                    {selectedPerson.email}
                  </p>
                </div>
              )}

              {selectedPerson.phone && (
                <div>
                  <label className="text-sm font-medium text-textSecondary">
                    Phone
                  </label>
                  <p className="mt-1 text-textPrimary">
                    {selectedPerson.phone}
                  </p>
                </div>
              )}

              {selectedPerson.notes && (
                <div>
                  <label className="text-sm font-medium text-textSecondary">
                    Notes
                  </label>
                  <p className="mt-1 text-textPrimary whitespace-pre-wrap">
                    {selectedPerson.notes}
                  </p>
                </div>
              )}

              {selectedPerson.events && selectedPerson.events.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-textSecondary mb-3 block">
                    Related Events
                  </label>
                  <div className="space-y-2">
                    {selectedPerson.events.map((ep) => (
                      <div
                        key={ep.event.id}
                        className="p-3 bg-bgColor rounded-lg border border-borderColor"
                      >
                        <p className="font-medium text-textPrimary">
                          {ep.event.title}
                        </p>
                        {ep.event.description && (
                          <p className="text-sm text-textSecondary mt-1">
                            {ep.event.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Persons;
