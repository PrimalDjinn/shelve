import vue from "@vitejs/plugin-vue";

export default defineNuxtConfig({
  extends: "../base",

  compatibilityDate: "2025-01-24",

  hub: {
    db: {
      dialect: 'sqlite',
    },
  },

  ssr: false,

  nitro: {
    experimental: {
      openAPI: true,
    },
    rollupConfig: {
      plugins: [vue() as any],
    },
    imports: {
      dirs: ["./server/services"],
    },
  },

  css: ["~/assets/css/index.css"],

  runtimeConfig: {
    private: {
      /** @deprecated */
      resendApiKey: "",
      /** @deprecated */
      resendWebhookSecret: "",
      /** @deprecated */
      senderEmail: "",
      encryptionKey: "",
      adminEmails: "",
      allowedOrigins: "",
      github: {
        privateKey: "",
      },
    },
    email: {
      provider: "",
    },
    oauth: {
      google: {
        clientId: "",
        clientSecret: "",
      },
      github: {
        clientId: "",
        clientSecret: "",
      },
    },
  },

  $development: {
    runtimeConfig: {
      public: {
        github: {
          appName: "shelve-local",
        },
      },
    },
  },

  $production: {
    runtimeConfig: {
      public: {
        github: {
          appName: "shelve-cloud",
        },
      },
    },
  },

  image: {
    format: ["webp", "jpeg", "jpg", "png", "svg"],
  },

  modules: ["@nuxt/ui", "nuxt-auth-utils", "@nuxthub/core", "botid/nuxt"],
});
