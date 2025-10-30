import { useState, useEffect } from "react";
import axiosInstance from "../../services/api/axiosInstance";
import toast from "react-hot-toast";
import API_ENDPOINTS from "../../services/api/endpoints";
import { Building2, MapPin, X, Briefcase } from "lucide-react";
import { formatTimestamp } from "../../utils/dateUtils";

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.COMPANIES.LIST);
      setCompanies(response.data.companies || []);
    } catch (error) {
      toast.error("Failed to load companies");
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
      toast.error("Failed to load company details");
      console.error(error);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCompany(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Companies
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage companies extracted from your conversations
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No companies found yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              onClick={() => fetchCompanyDetails(company.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {company.name}
                    </h3>
                    {company.industry && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {company.industry}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {company.location && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-2" />
                    {company.location}
                  </div>
                )}
              </div>

              {company.events && company.events.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {company.events.length} related event(s)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedCompany.name}
                    </h2>
                    {selectedCompany.industry && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedCompany.industry}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseDetailsModal}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedCompany.location && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedCompany.location}
                  </p>
                </div>
              )}

              {selectedCompany.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedCompany.notes}
                  </p>
                </div>
              )}

              {selectedCompany.events && selectedCompany.events.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Related Events
                  </label>
                  <div className="space-y-2">
                    {selectedCompany.events.map((ec) => (
                      <div
                        key={ec.event.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ec.event.title}
                        </p>
                        {ec.event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {ec.event.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
