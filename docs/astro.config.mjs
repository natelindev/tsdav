// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://tsdav.vercel.app',
  image: {
    service: passthroughImageService(),
  },
  vite: {
    resolve: {
      alias: {
        'xml-js': path.resolve(__dirname, 'node_modules/xml-js'),
      },
    },
  },
  integrations: [
    starlight({
      title: 'tsdav',
      favicon: '/favicon.svg',
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: '/favicon.ico',
            sizes: 'any',
          },
        },
      ],
      logo: {
        src: './src/assets/logo.svg',
      },
      social: {
        github: 'https://github.com/natelindev/tsdav',
      },
      customCss: ['./src/styles/custom.css'],
      components: {
        PageTitle: './src/components/PageTitle.astro',
      },
      sidebar: [
        {
          label: 'Overview',
          items: [
            { label: 'Introduction', link: '/intro' },
            { label: 'Cloud Providers', link: '/cloud-providers' },
            { label: 'Smart Calendar Sync', link: '/smart-calendar-sync' },
            { label: 'Migration (v1 to v2)', link: '/migration' },
            { label: 'Contributing', link: '/contributing' },
          ],
        },
        {
          label: 'CalDAV API',
          items: [
            { label: 'fetchCalendars', link: '/caldav/fetchcalendars', badge: { text: 'PROPFIND', class: 'method-propfind' } },
            { label: 'fetchCalendarObjects', link: '/caldav/fetchcalendarobjects', badge: { text: 'REPORT', class: 'method-report' } },
            { label: 'createCalendarObject', link: '/caldav/createcalendarobject', badge: { text: 'PUT', class: 'method-put' } },
            { label: 'updateCalendarObject', link: '/caldav/updatecalendarobject', badge: { text: 'PUT', class: 'method-put' } },
            { label: 'deleteCalendarObject', link: '/caldav/deletecalendarobject', badge: { text: 'DELETE', class: 'method-delete' } },
            { label: 'calendarQuery', link: '/caldav/calendarquery', badge: { text: 'REPORT', class: 'method-report' } },
            { label: 'calendarMultiGet', link: '/caldav/calendarmultiget', badge: { text: 'REPORT', class: 'method-report' } },
            { label: 'syncCalendars', link: '/caldav/synccalendars', badge: { text: 'PROPFIND', class: 'method-propfind' } },
            { label: 'makeCalendar', link: '/caldav/makecalendar', badge: { text: 'MKCALENDAR', class: 'method-mkcol' } },
            { label: 'freeBusyQuery', link: '/caldav/freebusyquery', badge: { text: 'REPORT', class: 'method-report' } },
            { label: 'import-ical-feed', link: '/caldav/import-ical-feed' },
            { label: 'fetchCalendarUserAddresses', link: '/caldav/fetchcalendaruseraddresses' },
          ],
        },
        {
          label: 'CardDAV API',
          items: [
            { label: 'fetchAddressBooks', link: '/carddav/fetchaddressbooks', badge: { text: 'PROPFIND', class: 'method-propfind' } },
            { label: 'fetchVCards', link: '/carddav/fetchvcards', badge: { text: 'REPORT', class: 'method-report' } },
            { label: 'createVCard', link: '/carddav/createvcard', badge: { text: 'PUT', class: 'method-put' } },
            { label: 'updateVCard', link: '/carddav/updatevcard', badge: { text: 'PUT', class: 'method-put' } },
            { label: 'deleteVCard', link: '/carddav/deletevcard', badge: { text: 'DELETE', class: 'method-delete' } },
            { label: 'addressBookQuery', link: '/carddav/addressbookquery', badge: { text: 'REPORT', class: 'method-report' } },
            { label: 'addressBookMultiGet', link: '/carddav/addressbookmultiget', badge: { text: 'REPORT', class: 'method-report' } },
          ],
        },
        {
          label: 'WebDAV API',
          items: [
            { label: 'davRequest', link: '/webdav/davrequest' },
            { label: 'propfind', link: '/webdav/propfind', badge: { text: 'PROPFIND', class: 'method-propfind' } },
            { label: 'createObject', link: '/webdav/createobject', badge: { text: 'PUT', class: 'method-put' } },
            { label: 'updateObject', link: '/webdav/updateobject', badge: { text: 'PUT', class: 'method-put' } },
            { label: 'deleteObject', link: '/webdav/deleteobject', badge: { text: 'DELETE', class: 'method-delete' } },
            {
              label: 'Account Discovery',
              items: [
                { label: 'serviceDiscovery', link: '/webdav/account/servicediscovery' },
                { label: 'fetchPrincipalUrl', link: '/webdav/account/fetchprincipalurl' },
                { label: 'fetchHomeUrl', link: '/webdav/account/fetchhomeurl' },
                { label: 'createAccount', link: '/webdav/account/createaccount' },
              ],
            },
            {
              label: 'Collections',
              items: [
                { label: 'makeCollection', link: '/webdav/collection/makecollection', badge: { text: 'MKCOL', class: 'method-mkcol' } },
                { label: 'collectionQuery', link: '/webdav/collection/collectionquery', badge: { text: 'REPORT', class: 'method-report' } },
                { label: 'syncCollection', link: '/webdav/collection/synccollection', badge: { text: 'REPORT', class: 'method-report' } },
                { label: 'smartCollectionSync', link: '/webdav/collection/smartcollectionsync' },
                { label: 'isCollectionDirty', link: '/webdav/collection/iscollectiondirty' },
                { label: 'supportedReportSet', link: '/webdav/collection/supportedreportset', badge: { text: 'PROPFIND', class: 'method-propfind' } },
              ],
            },
          ],
        },
        {
          label: 'Type Reference',
          autogenerate: { directory: 'types' },
        },
        {
          label: 'Helpers & Tools',
          items: [
            { label: 'Interactive Converter', link: '/helper' },
            { label: 'authHelpers', link: '/helpers/authhelpers' },
            { label: 'requestHelpers', link: '/helpers/requesthelpers' },
            { label: 'constants', link: '/helpers/constants' },
          ],
        },
        {
          label: 'AI & LLM Integration',
          items: [{ label: 'LLM Integration (/llms.txt)', link: '/llms' }],
        },
      ],
    }),
    react(),
  ],
});
