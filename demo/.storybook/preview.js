import '@primer/css/dist/primer.css'

const isProd = process.env.NODE_ENV == 'production';
const appName = process.env.STORYBOOK_APP_NAME;

const serverHost = isProd ? `https://${appName}.herokuapp.com` : 'http://localhost:4000';

export const parameters = {
  server: {
    url: `${serverHost}/rails/stories`,
  },
  options: {
    storySort: {
      method: 'alphabetical',
    }
  }
};
