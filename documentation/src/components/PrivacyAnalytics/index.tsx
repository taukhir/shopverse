import {useEffect} from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {readReaderState, READER_EVENT, type ReaderState} from '@site/src/utils/readerLibrary';

declare global { interface Window { plausible?: (event: string, options?: unknown) => void; } }

export default function PrivacyAnalytics() {
  const location=useLocation(); const {siteConfig}=useDocusaurusContext(); const domain=String(siteConfig.customFields?.analyticsDomain??'');
  useEffect(()=>{if(!domain)return;const sync=(event?:Event)=>{const consent=(event as CustomEvent<ReaderState>)?.detail?.analyticsConsent??readReaderState().analyticsConsent;const existing=document.querySelector<HTMLScriptElement>('script[data-shopverse-analytics]');if(!consent){existing?.remove();return;}if(existing)return;const script=document.createElement('script');script.defer=true;script.dataset.domain=domain;script.dataset.shopverseAnalytics='true';script.src='https://plausible.io/js/script.js';document.head.appendChild(script);};sync();window.addEventListener(READER_EVENT,sync);return()=>window.removeEventListener(READER_EVENT,sync);},[domain]);
  useEffect(()=>{if(domain&&readReaderState().analyticsConsent)window.plausible?.('pageview',{u:window.location.href});},[domain,location.pathname]);
  return null;
}
