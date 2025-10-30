import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../services/api/axiosInstance";
import toast from "react-hot-toast";
import API_ENDPOINTS from "../../services/api/endpoints";
import Pagination from "../common/Pagination";
import CustomDropdown from "../common/CustomDropdown";
import {
  User,
  Mail,
  Phone,
  Shield,
  RefreshCw,
  Plus,
  X,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";
import StatusToggle from "../common/StatusToggle";

const Teams = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // filters
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // dropdowns
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Errors
  const [errors, setErrors] = useState({});

  // form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    whatsapp: "",
    role: "user",
  });

  const roleOptions = ["admin", "user"];
  const statusOptions = ["active", "inactive"];

  // search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Add pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearchQuery,
    roleFilter,
    statusFilter,
  ]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await axiosInstance.get(API_ENDPOINTS.TEAM.LIST, {
        params,
      });
      setUsers(response.data.users || []);

      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      });
    } catch (error) {
      toast.error("Failed to load team members");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (isEdit = false) => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Email validation (only for create)
    if (!isEdit) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    // Password validation (only for create, min 6 chars)
    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    // Mobile validation (optional, but if provided must be valid)
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile must be 10 digits";
    }

    // WhatsApp validation (optional, but if provided must be valid)
    if (formData.whatsapp && !/^\d{10}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = "WhatsApp must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchUsers();
      toast.success("Team refreshed");
    } catch (error) {
      toast.error("Failed to refresh team");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Add validation check
    if (!validateForm(false)) {
      toast.error("Fill valid details");
      return;
    }

    try {
      const response = await axiosInstance.post(
        API_ENDPOINTS.TEAM.CREATE,
        formData
      );

      if (response.data.message) {
        toast.success(response.data.message);
        fetchUsers();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    // Add validation check
    if (!validateForm(true)) {
      toast.error("Fill valid details");
      return;
    }

    try {
      const { password, email, ...updateData } = formData;

      const response = await axiosInstance.put(
        API_ENDPOINTS.TEAM.UPDATE(selectedUser.id),
        updateData
      );

      if (response.data.message) {
        toast.success(response.data.message);
        fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await axiosInstance.delete(
        API_ENDPOINTS.TEAM.DELETE(userToDelete)
      );

      if (response.data.message) {
        toast.success(response.data.message);
        fetchUsers();
      }
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile || "",
      whatsapp: user.whatsapp || "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      mobile: "",
      whatsapp: "",
      role: "user",
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this specific field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      super_admin: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
      admin: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
      user: "bg-green-500/20 text-green-700 dark:text-green-400",
    };
    return colors[role] || "bg-gray-500/20 text-gray-700 dark:text-gray-400";
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
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
              <User className="w-6 h-6" />
              Teams
            </h1>
            <p className="text-textSecondary text-sm mt-1">
              Manage your organization's team members
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-bgColor border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brandColor text-white rounded-lg hover:bg-brandHover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-navBgColor border-b border-borderColor px-6 py-4">
        <div className="flex gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search name, email, mobile..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <CustomDropdown
            label="Role"
            value={roleFilter}
            options={roleOptions}
            onChange={handleRoleFilterChange}
            isOpen={showRoleDropdown}
            onToggle={setShowRoleDropdown}
          />
          <CustomDropdown
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={handleStatusFilterChange}
            isOpen={showStatusDropdown}
            onToggle={setShowStatusDropdown}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-textSecondary">Loading team members...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-textSecondary">
            <User className="w-16 h-16 mb-4 opacity-50" />
            <p>No team members found</p>
          </div>
        ) : (
          <div className="bg-navBgColor rounded-lg border border-borderColor overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-tableHeader border-b border-borderColor">
                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderColor">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-hoverBg transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-brandColor/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-brandColor" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-textPrimary">
                              {user.name}
                            </div>
                            <div className="text-xs text-textSecondary">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-textSecondary">
                          <Mail className="w-4 h-4 mr-2" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.mobile ? (
                          <div className="flex items-center text-textSecondary">
                            <Phone className="w-4 h-4 mr-2" />
                            <span className="text-sm">{user.mobile}</span>
                          </div>
                        ) : (
                          <span className="text-textTertiary text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.whatsapp ? (
                          <div className="flex items-center text-textSecondary">
                            <Phone className="w-4 h-4 mr-2" />
                            <span className="text-sm">{user.whatsapp}</span>
                          </div>
                        ) : (
                          <span className="text-textTertiary text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                            user.role
                          )}`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusToggle
                          userId={user.id}
                          currentStatus={user.status}
                          onToggle={fetchUsers}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-info hover:bg-infoLight rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-danger hover:bg-dangerLight rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-modalBackdrop flex items-center justify-center z-50 p-4">
          <div className="bg-modalBg rounded-lg shadow-custom-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-navBgColor px-6 py-4 border-b border-borderColor flex items-center justify-between sticky top-0">
              <h3 className="text-lg font-semibold text-textPrimary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New User
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-textSecondary hover:text-textPrimary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Name
                  <span className="text-red-700 dark:text-red-500 mx-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="Enter name"
                />
                {errors.name && (
                  <p className="text-danger text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Email
                  <span className="text-red-700 dark:text-red-500 mx-1">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="Enter email"
                />
                {errors.email && (
                  <p className="text-danger text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Password
                  <span className="text-red-700 dark:text-red-500 mx-1">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="Enter password (min 6 chars)"
                />
                {errors.password && (
                  <p className="text-danger text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Mobile
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="10 digit mobile number"
                />
                {errors.mobile && (
                  <p className="text-danger text-xs mt-1">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="10 digit WhatsApp number"
                />
                {errors.whatsapp && (
                  <p className="text-danger text-xs mt-1">{errors.whatsapp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Role
                  <span className="text-red-700 dark:text-red-500 mx-1">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brandColor text-white rounded-lg hover:bg-brandHover transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-modalBackdrop flex items-center justify-center z-50 p-4">
          <div className="bg-modalBg rounded-lg shadow-custom-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-navBgColor px-6 py-4 border-b border-borderColor flex items-center justify-between sticky top-0">
              <h3 className="text-lg font-semibold text-textPrimary flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Edit User
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                className="text-textSecondary hover:text-textPrimary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Name
                  <span className="text-red-700 dark:text-red-500 mx-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="Enter name"
                />
                {errors.name && (
                  <p className="text-danger text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">
                  Email (cannot be changed)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg text-textSecondary opacity-60 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Mobile
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="10 digit mobile number"
                />
                {errors.mobile && (
                  <p className="text-danger text-xs mt-1">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                  placeholder="10 digit WhatsApp number"
                />
                {errors.whatsapp && (
                  <p className="text-danger text-xs mt-1">{errors.whatsapp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Role
                  <span className="text-red-700 dark:text-red-500 mx-1">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-inputBgColor border border-inputBorderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocusColor text-textPrimary"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brandColor text-white rounded-lg hover:bg-brandHover transition-colors"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-modalBackdrop flex items-center justify-center z-50 p-4">
          <div className="bg-modalBg rounded-lg shadow-custom-lg max-w-md w-full">
            <div className="bg-navBgColor px-6 py-4 border-b border-borderColor">
              <h3 className="text-lg font-semibold text-textPrimary">
                Confirm Deletion
              </h3>
            </div>

            <div className="p-6">
              <p className="text-textSecondary mb-4">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-borderColor text-textPrimary rounded-lg hover:bg-hoverBg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-2 bg-danger text-white rounded-lg hover:bg-dangerHover transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
