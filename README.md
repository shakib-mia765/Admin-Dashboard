ultrafaang-admin-dashboard/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── apps/
│   ├── web/
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   │
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── router.jsx
│   │   │   │   ├── providers.jsx
│   │   │   │   └── App.jsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── DataTable.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── StatCard.jsx
│   │   │   │
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── AuthPage.jsx
│   │   │   │   │   └── auth.api.js
│   │   │   │   │
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── DashboardPage.jsx
│   │   │   │   │
│   │   │   │   └── users/
│   │   │   │       ├── UsersPage.jsx
│   │   │   │       └── users.api.js
│   │   │   │
│   │   │   ├── layouts/
│   │   │   │   └── AdminLayout.jsx
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api.js
│   │   │   │   └── permissions.js
│   │   │   │
│   │   │   ├── store/
│   │   │   │   └── store.js
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   └── index.css
│   │   │   │
│   │   │   └── main.jsx
│   │   │
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── server/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.js
│       │
│       ├── src/
│       │   ├── config/
│       │   │   └── env.js
│       │   │
│       │   ├── middleware/
│       │   │   ├── auth.js
│       │   │   └── error-handler.js
│       │   │
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   └── auth.module.js
│       │   │   │
│       │   │   ├── dashboard/
│       │   │   │   └── dashboard.module.js
│       │   │   │
│       │   │   └── users/
│       │   │       └── users.module.js
│       │   │
│       │   ├── shared/
│       │   │   ├── database.js
│       │   │   ├── logger.js
│       │   │   └── response.js
│       │   │
│       │   ├── app.js
│       │   └── server.js
│       │
│       ├── tests/
│       │   └── api.test.js
│       │
│       └── package.json
│
├── packages/
│   └── validation/
│       ├── src/
│       │   └── index.js
│       └── package.json
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── eslint.config.js
├── package.json
├── pnpm-workspace.yaml
└── README.md
