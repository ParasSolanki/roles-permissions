# @roles-permissions/api

## Installation

Install Dependencies.

```bash
  pnpm install
```

## Run Locally

Start the dev server

```bash
  pnpm dev
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .dev.vars file
Since this project uses Turso Sqlite you will need `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.

| Name                | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| ALLOWED_ORIGIN      | The URL of your application.                                        |
| ENVIRONMENT         | "development", "staging", "preview" or "production"                 |
| TOKEN_SECRET        | A secret key that is used to sign and verify authentication tokens. |
| DATABASE_URL        | The database URL.                                                   |
| DATABASE_AUTH_TOKEN | The database Auth token.                                            |
