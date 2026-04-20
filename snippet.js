<script type='text/javascript'>
	function initEmbeddedMessaging() {
		try {
			embeddedservice_bootstrap.settings.language = 'en_US'; // For example, enter 'en' or 'en-US'

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
	};
</script>
<script type='text/javascript' src='https://orgfarm-8b6669b6c3-dev-ed.develop.my.site.com/ESWKYCAgent1776412177665/assets/js/bootstrap.min.js' onload='initEmbeddedMessaging()'></script>
