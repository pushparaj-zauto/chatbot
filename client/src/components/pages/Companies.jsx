import { useState, useEffect } from 'react';
import axiosInstance from '../../services/api/axiosInstance';
import toast from 'react-hot-toast';
import API_ENDPOINTS from '../../services/api/endpoints';
import {
  Building2,
  MapPin,
  X,
  Briefcase,
  Search,
  Calendar,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { formatTimestamp } from '../../utils/dateUtils';
import Pagination from '../common/Pagination';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, [pagination.page, pagination.limit, debouncedSearchQuery]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (debouncedSearchQuery) params.search = debouncedSearchQuery;

      const response = await axiosInstance.get(API_ENDPOINTS.COMPANIES.LIST, {
        params,
      });
      setCompanies(response.data.companies || []);

      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      });
    } catch (error) {
      toast.error('Failed to load companies');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (id) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.COMPANIES.GET(id));
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }
      setSelectedCompany(response.data.company);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load company details');
      console.error(error);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCompany(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  return (
    <div className="flex flex-col h-full bg-bgColor">
      {/* Header */}
      <div className="bg-navBgColor border-b border-borderColor px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Companies
            </h1>
            <p className="text-textSecondary text-sm mt-1">
              Manage companies extracted from your conversations
            </p>
          </div>
          <button
            onClick={fetchCompanies}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-bgColor border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, industry, location, or status..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary placeholder-gray-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 flex-1 flex items-center justify-center">
            <div>
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-textSecondary">
                {searchQuery
                  ? 'No companies found matching your search'
                  : 'No companies found yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {companies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => fetchCompanyDetails(company.id)}
                  className="bg-navBgColor border border-borderColor rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all group"
                >
                  {/* Header with Icon and Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                      <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-textPrimary truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {company.name}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {company.status && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {company.status}
                      </span>
                    </div>
                  )}

                  {/* Company Details */}
                  <div className="space-y-1.5 mb-3">
                    {company.industry && (
                      <div className="flex items-center text-xs text-textSecondary">
                        <Briefcase className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{company.industry}</span>
                      </div>
                    )}
                    {company.location && (
                      <div className="flex items-center text-xs text-textSecondary">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{company.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-2.5 border-t border-borderColor flex items-center justify-between text-xs text-textSecondary">
                    <div className="flex items-center truncate">
                      <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {formatTimestamp(company.createdAt)}
                      </span>
                    </div>
                    {company.events && company.events.length > 0 && (
                      <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium ml-2 flex-shrink-0">
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                        {company.events.length}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {!loading && companies.length > 0 && (
              <div className="mt-auto pt-6">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="fixed inset-0 bg-modalBackdrop flex items-center justify-center z-50 p-4">
          <div className="bg-modalBg rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-borderColor">
            <div className="sticky top-0 bg-navBgColor border-b border-borderColor p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                    <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-textPrimary">
                      {selectedCompany.name}
                    </h2>
                    {selectedCompany.status && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mt-1">
                        {selectedCompany.status}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseDetailsModal}
                  className="text-textSecondary hover:text-textPrimary transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedCompany.industry && (
                <div>
                  <label className="text-sm font-medium text-textSecondary flex items-center mb-2">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Industry
                  </label>
                  <p className="text-textPrimary font-medium">
                    {selectedCompany.industry}
                  </p>
                </div>
              )}

              {selectedCompany.location && (
                <div>
                  <label className="text-sm font-medium text-textSecondary flex items-center mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </label>
                  <p className="text-textPrimary font-medium">
                    {selectedCompany.location}
                  </p>
                </div>
              )}

              {selectedCompany.notes && (
                <div>
                  <label className="text-sm font-medium text-textSecondary mb-2 block">
                    Notes
                  </label>
                  <p className="text-textPrimary whitespace-pre-wrap bg-bgColor p-4 rounded-lg border border-borderColor">
                    {selectedCompany.notes}
                  </p>
                </div>
              )}

              {selectedCompany.events && selectedCompany.events.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-textSecondary mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Related Events ({selectedCompany.events.length})
                  </label>
                  <div className="space-y-3">
                    {selectedCompany.events.map((ec) => (
                      <div
                        key={ec.event.id}
                        className="p-4 bg-bgColor rounded-lg border border-borderColor hover:border-blue-500 transition-colors"
                      >
                        <p className="font-semibold text-textPrimary mb-1">
                          {ec.event.title}
                        </p>
                        {ec.event.description && (
                          <p className="text-sm text-textSecondary">
                            {ec.event.description}
                          </p>
                        )}
                        {ec.event.scheduledAt && (
                          <p className="text-xs text-textSecondary mt-2 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatTimestamp(ec.event.scheduledAt)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-borderColor">
                <p className="text-sm text-textSecondary flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created {formatTimestamp(selectedCompany.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
