function excludeUrl(requestDetails){
	if(/ipapi.co/.test(requestDetails.url)) {
			//The URL matched our exclusion criteria
			// console.log('exclude');
			return true;
	} //else
	return false;
	//Do your normal event processing here
}

async function checkIpGeo(hostname){
	try{
		const ip = await browser.dns.resolve(hostname);
	
		// console.log(`IP: ${JSON.stringify(ip.addresses)}`);

		let ipAddress;
		if (Array.isArray(ip.addresses)){
			ipAddress = ip.addresses[0];
		}
		else{
			ipAddress = ip.addresses;
		}

		const ipapiUrl = `https://ipapi.co/${ipAddress}/json/`;
		try{
			const response = await fetch(ipapiUrl);
			const result = await response.json();
			// console.log(result);
			return result;
		}
		catch(err){
			console.log("fetch geolocation error");
			console.error(err);
		}
	}
	catch(err){
		console.log("dns resolve error");
		console.error(err);
	}
}

async function logURL(requestDetails) {
  // console.log(`Loading: ${requestDetails.url}`);

	const exclude = excludeUrl(requestDetails); // the ipapi.co trigger from extension
	if (!exclude){
		const hostname = (new URL(requestDetails.url)).hostname;
		let geoResult = null;
		let country_code;

		// see if it have been queried before by checking localstorage, if not check and store it
		try{
			const storageResult = await browser.storage.local.get(hostname);
			if (!storageResult[hostname].count){
				throw "key not set in storage, set it at catch block";
			}
			const count = storageResult[hostname].count;
			country_code = storageResult[hostname].country_code;
			await browser.storage.local.set({
				[hostname]: {
					count: count+1, 
					country_code: country_code,
				}
			});
		}
		catch(err){
			geoResult = await checkIpGeo(hostname);
			country_code = geoResult.country_code
			await browser.storage.local.set({
				[hostname]: {
					count: 1, 
					country_code: geoResult.country_code,
				}
			});
		}

		if (country_code === "CN"){
			console.log(`CN - ${requestDetails.url}`);
			browser.notifications.create("CN", {
				type:"basic",
				title: "CN site",
				message: `Origin Url: ${requestDetails.originUrl}\n\nUrl: ${requestDetails.url}`
			})
		}
	}
}

browser.webRequest.onBeforeRequest.addListener(
  logURL,
	{urls: ["<all_urls>"]},
	["blocking"]
);

