import { useState, useEffect } from 'react';
import axiosInstance from '../../services/api/axiosInstance';
import toast from 'react-hot-toast';
import { Settings, Plus, Trash2, RotateCcw, Search, X } from 'lucide-react';
import ConfirmDeleteOptionModal from '../modals/ConfirmDeleteOptionModal';
import API_ENDPOINTS from '../../services/api/endpoints';
import Pagination from '../common/Pagination';

const Configurables = () => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('person');
  const [newOption, setNewOption] = useState({ value: '', label: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchConfigurables();
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

  const fetchConfigurables = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (debouncedSearchQuery) params.search = debouncedSearchQuery;

      const response = await axiosInstance.get(
        API_ENDPOINTS.CONFIGURABLES.GET,
        {
          params,
        },
      );

      setOptions(response.data.options || []);

      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      });
    } catch (error) {
      toast.error('Failed to load configurables');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOption((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newOption.value.trim()) {
      newErrors.value = 'Value is required';
    }
    if (!newOption.label.trim()) {
      newErrors.label = 'Label is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddOption = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await axiosInstance.post(
        API_ENDPOINTS.CONFIGURABLES.ADD_OPTION(selectedEntity),
        {
          value: newOption.value,
          label: newOption.label,
        },
      );
      toast.success('Option added successfully');
      setNewOption({ value: '', label: '' });
      setErrors({});
      setShowAddModal(false);
      fetchConfigurables();
    } catch (error) {
      toast.error('Failed to add option');
      console.error(error);
    }
  };

  const handleDeleteOption = async (optionId) => {
    setOptionToDelete(optionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteOption = async () => {
    if (!optionToDelete) return;

    try {
      await axiosInstance.delete(
        API_ENDPOINTS.CONFIGURABLES.DELETE_OPTION(optionToDelete),
      );
      toast.success('Option deleted successfully');
      fetchConfigurables();
    } catch (error) {
      toast.error('Failed to delete option');
      console.error(error);
    } finally {
      setShowDeleteModal(false);
      setOptionToDelete(null);
    }
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewOption({ value: '', label: '' });
    setErrors({});
  };

  // Flatten all options for table display
  const allOptions = options;

  return (
    <div className="flex flex-col h-full bg-bgColor">
      {/* Header */}
      <div className="bg-navBgColor border-b border-borderColor px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configurables
            </h1>
            <p className="text-textSecondary text-sm mt-1">
              Manage your organization's configurables
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchConfigurables}
              className="flex items-center gap-2 px-4 py-2 bg-bgColor border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-navBgColor rounded-lg border border-borderColor overflow-hidden">
          {/* Search and Add Button */}
          <div className="p-4 border-b border-borderColor flex items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search configurables..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brandColor text-white rounded-lg hover:bg-brandHover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-tableHeader border-b border-borderColor">
                  <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                    Entity Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-textPrimary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-textSecondary"
                    >
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : allOptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-textSecondary"
                    >
                      {searchQuery
                        ? 'No options found matching your search'
                        : 'No options found'}
                    </td>
                  </tr>
                ) : (
                  allOptions.map((option) => (
                    <tr
                      key={option.id}
                      className="hover:bg-hoverBg transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                          {option.entityType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary capitalize">
                        {option.fieldName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary font-mono">
                        {option.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary font-medium">
                        {option.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteOption(option.id)}
                          className="p-2 text-danger hover:bg-dangerLight rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && allOptions.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>

        {/* Add Option Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-modalBackdrop flex items-center justify-center z-50 p-4">
            <div className="bg-modalBg rounded-lg shadow-custom-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-navBgColor px-6 py-4 border-b border-borderColor flex items-center justify-between sticky top-0">
                <h3 className="text-lg font-semibold text-textPrimary flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Status Option
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-textSecondary hover:text-textPrimary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-1">
                    Entity Type
                  </label>
                  <select
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value)}
                    className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  >
                    <option value="person">Person</option>
                    <option value="company">Company</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-1">
                    Value (e.g., Hot Lead)
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={newOption.value}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-inputBgColor border ${
                      errors.value
                        ? 'border-danger focus:ring-danger'
                        : 'border-inputBorderColor focus:ring-inputFocusColor'
                    } rounded-lg focus:outline-none focus:ring-2 text-textPrimary`}
                    placeholder="hot_lead"
                  />
                  {errors.value && (
                    <p className="text-danger text-xs mt-1">{errors.value}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-1">
                    Label (e.g., Hot Lead)
                  </label>
                  <input
                    type="text"
                    name="label"
                    value={newOption.label}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-inputBgColor border ${
                      errors.label
                        ? 'border-danger focus:ring-danger'
                        : 'border-inputBorderColor focus:ring-inputFocusColor'
                    } rounded-lg focus:outline-none focus:ring-2 text-textPrimary`}
                    placeholder="Hot Lead"
                  />
                  {errors.label && (
                    <p className="text-danger text-xs mt-1">{errors.label}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAddOption}
                    className="flex-1 px-4 py-2 bg-brandColor text-white rounded-lg hover:bg-brandHover transition-colors"
                  >
                    Add Option
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmDeleteOptionModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setOptionToDelete(null);
        }}
        onConfirm={confirmDeleteOption}
        isDeleting={false}
      />
    </div>
  );
};

export default Configurables;
