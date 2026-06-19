# Payload Blank Template

This template comes configured with the bare minimum to get started on anything you need.

## Quick start

This app is configured for Payload CMS with PostgreSQL.

## Quick Start - local setup

To spin up this template locally, follow these steps:

### Clone

After you click the `Deploy` button above, you'll want to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

### Development

1. First [clone the repo](#clone) if you have not done so already
2. `cd hd-cms-prototype && cp .env.example .env` to copy the example environment variables.
3. Start PostgreSQL locally. With Docker, run `docker compose up -d postgres`.
4. `pnpm install && pnpm dev` to install dependencies and start the dev server
5. Open `http://localhost:3000` in your browser.

Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user.

#### Docker (Optional)

If you prefer to run both the app and database in Docker, the provided `docker-compose.yml` file can be used.

To do so, follow these steps:

- Copy `.env.example` to `.env` and set a real `PAYLOAD_SECRET`
- Run `docker compose up` to start the app and PostgreSQL, optionally pass `-d` to run in the background

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/3.x/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Media

  This is the uploads enabled collection. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this app locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Open `http://localhost:3000` to login and create your first admin user

The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
