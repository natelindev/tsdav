import clsx from 'clsx';
import React from 'react';

import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'WEBDAV',
    Svg: require('../../static/img/undraw_cloud_files_wmo8.svg').default,
    description: <>webdav can help you sync any file and collections of files with the cloud</>,
  },
  {
    title: 'CALDAV',
    Svg: require('../../static/img/undraw_events_2p66.svg').default,
    description: <>CALDAV allows you to sync your calendars with multiple cloud providers</>,
  },
  {
    title: 'CARDDAV',
    Svg: require('../../static/img/undraw_People_search_re_5rre.svg').default,
    description: <>CARDDAV allows you to sync contacts with multiple cloud providers</>,
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <h1 className={styles.headline}>Supported protocols</h1>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
