import { useState, useEffect } from "react";
import axiosInstance from "../../services/api/axiosInstance";
import toast from "react-hot-toast";
import API_ENDPOINTS from "../../services/api/endpoints";
import { User, Mail, Phone, Briefcase, X } from "lucide-react";

const Persons = () => {
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.PERSONS.LIST);
      setPersons(response.data.persons || []);
    } catch (error) {
      toast.error("Failed to load persons");
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
      toast.error("Failed to load person details");
      console.error(error);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPerson(null);
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
          Persons
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage person extracted from your conversations
        </p>
      </div>

      {persons.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No people found yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {persons.map((person) => (
            <div
              key={person.id}
              onClick={() => fetchPersonDetails(person.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {person.name}
                    </h3>
                    {person.role && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {person.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {person.email && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-2" />
                    {person.email}
                  </div>
                )}
                {person.phone && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4 mr-2" />
                    {person.phone}
                  </div>
                )}
              </div>

              {person.events && person.events.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {person.events.length} related event(s)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedPerson.name}
                </h2>
                <button
                  onClick={handleCloseDetailsModal}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedPerson.role && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedPerson.role}
                  </p>
                </div>
              )}

              {selectedPerson.email && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedPerson.email}
                  </p>
                </div>
              )}

              {selectedPerson.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedPerson.phone}
                  </p>
                </div>
              )}

              {selectedPerson.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedPerson.notes}
                  </p>
                </div>
              )}

              {selectedPerson.events && selectedPerson.events.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Related Events
                  </label>
                  <div className="space-y-2">
                    {selectedPerson.events.map((ep) => (
                      <div
                        key={ep.event.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ep.event.title}
                        </p>
                        {ep.event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
