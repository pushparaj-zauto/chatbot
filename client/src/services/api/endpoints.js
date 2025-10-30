const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_VERIFICATION: "/auth/resend-verification",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  CHUNKS: {
    GET: "/chat/chunks",
    DELETE_ONE: (chunkId) => `/chat/chunks/${chunkId}`,
    DELETE_ALL: "/chat/chunks",
  },
  CHAT: {
    SEND: "/chat/message",
    SESSION: "/chat/session",
    RECREATE_COLLECTION: "/chat/recreate-collection",
    TRANSCRIBE: "/chat/transcribe",
  },
  EVENTS: {
    LIST: "/events",
    GET: (id) => `/events/${id}`,
    UPDATE: (id) => `/events/${id}`,
    DELETE: (id) => `/events/${id}`,
  },
  PERSONS: {
    LIST: "/persons",
    GET: (id) => `/persons/${id}`,
    UPDATE: (id) => `/persons/${id}`,
    DELETE: (id) => `/persons/${id}`,
  },
  COMPANIES: {
    LIST: "/companies",
    GET: (id) => `/companies/${id}`,
    UPDATE: (id) => `/companies/${id}`,
    DELETE: (id) => `/companies/${id}`,
  },
  PROMPT: {
    GET: "/chat/system-prompt",
    UPDATE: "/chat/system-prompt",
  },
  CONFIGURABLES: {
    GET: "/configurables",
    INITIALIZE: "/configurables/initialize",
    ADD_OPTION: (entityType) => `/configurables/${entityType}/status/options`,
    DELETE_OPTION: (optionId) => `/configurables/options/${optionId}`,
  },
  TEAM: {
    LIST: "/team/users",
    CREATE: "/team/users",
    UPDATE: (id) => `/team/users/${id}`,
    DELETE: (id) => `/team/users/${id}`,
  },
};

export default API_ENDPOINTS;
