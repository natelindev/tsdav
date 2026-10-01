/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: 'tsdav',
  tagline: 'webdav request made easy',
  url: 'https://tsdav.vercel.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: 'img/favicon.ico',
  organizationName: 'natelindev', // Usually your GitHub org/user name.
  projectName: 'tsdav', // Usually your repo name.
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'tsdav',
      logo: {
        alt: 'tsdav logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://github.com/natelindev/tsdav',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `© ${new Date().getFullYear()} Nathaniel Lin. MIT licensed.`,
    },
    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
    },
  },
  presets: [
    [
      require.resolve('@docusaurus/preset-classic'),
      {
        docs: {
          path: 'docs',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/natelindev/tsdav/edit/main/docs/',
          lastVersion: 'current',
          versions: {
            current: {
              label: require('../package.json').version,
            },
            '1.1.6': {
              label: '1.1.6',
            },
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      },
    ],
  ],
  plugins: [
    require.resolve('@cmfcmf/docusaurus-search-local'),
    require.resolve('./docusuarusWebpack5Plugin'),
    require.resolve('docusaurus-markdown-source-plugin'),
    [
      require.resolve('docusaurus-plugin-llms'),
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        docsDir: 'docs',
        title: 'tsdav Documentation',
        description:
          'TypeScript WebDAV client library wrapping CalDAV and CardDAV workflows for browsers and Node.js.',
        excludeImports: true,
        removeDuplicateHeadings: true,
        includeOrder: [
          'intro.*',
          'webdav/**/*',
          'caldav/**/*',
          'carddav/**/*',
          'types/**/*',
          'helpers/**/*',
          'helper.*',
          'smart calendar sync.*',
          'cloud providers.*',
          'migration.*',
          'contributing.*',
          'llms.*',
        ],
        includeUnmatchedLast: true,
      },
    ],
  ],
};
