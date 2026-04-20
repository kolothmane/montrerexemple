import "@/styles/globals.css";
import Script from "next/script";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Script
        id="sf-embedded-messaging-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            function initEmbeddedMessaging() {
              try {
                embeddedservice_bootstrap.settings.language = 'en_US';
                embeddedservice_bootstrap.init(
                  '00DdM00000t04Yb',
                  'KYC_Agent',
                  'https://orgfarm-8b6669b6c3-dev-ed.develop.my.site.com/ESWKYCAgent1776412177665',
                  {
                    scrt2URL: 'https://orgfarm-8b6669b6c3-dev-ed.develop.my.salesforce-scrt.com'
                  }
                );
              } catch (err) {
                console.error('Error loading Embedded Messaging: ', err);
              }
            }
          `,
        }}
      />
      <Script
        id="sf-embedded-messaging-bootstrap"
        src="https://orgfarm-8b6669b6c3-dev-ed.develop.my.site.com/ESWKYCAgent1776412177665/assets/js/bootstrap.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof initEmbeddedMessaging === "function") {
            initEmbeddedMessaging();
          }
        }}
      />
    </>
  );
}
