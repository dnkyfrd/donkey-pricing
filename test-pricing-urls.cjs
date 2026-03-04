const fetch = require('node-fetch');

// URLs to test for Ruhr Region (updated coordinates)
const urls = {
  memberships: 'https://stables.donkey.bike/api/public/plans?pricing_type=account&account_id=977',
  just_ride: 'https://stables.donkey.bike/api/public/pricings?pricing_type=account&account_id=977',
  day_deals: 'https://stables.donkey.bike/api/public/nearby?filter_type=account&account_id=977'
};

// Headers from the working script
const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; DonkeyRepublic-PricingScript/1.0)'
};

async function fetchUrl(url, name, acceptHeader) {
  try {
    console.log(`\n=== Fetching ${name} ===`);
    console.log(`URL: ${url}`);
    console.log(`Accept: ${acceptHeader}`);
    
    const response = await fetch(url, { 
      headers: { ...headers, 'accept': acceptHeader }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response size: ${response.headers.get('content-length')} bytes`);
    
    const text = await response.text();
    console.log(`Raw response length: ${text.length} characters`);
    
    let jsonData;
    try {
      jsonData = JSON.parse(text);
      console.log(`Data type: ${Array.isArray(jsonData) ? 'Array' : typeof jsonData}`);
      if (Array.isArray(jsonData)) {
        console.log(`Array length: ${jsonData.length}`);
      }
      console.log('\n--- Response Data ---');
      console.log(JSON.stringify(jsonData, null, 2));
      return { name, data: jsonData, status: response.status };
    } catch (error) {
      console.log('Failed to parse JSON. Raw response:');
      console.log(text.substring(0, 1000));
      return { name, error: 'Invalid JSON', status: response.status, rawText: text.substring(0, 500) };
    }
  } catch (error) {
    console.error(`Error fetching ${name}:`, error.message);
    return { name, error: error.message };
  }
}

async function testAllUrls() {
  console.log('Testing Donkey Bike pricing APIs for Ruhr Region...\n');
  
  try {
    const results = await Promise.allSettled([
      fetchUrl(urls.memberships, 'Memberships', 'application/com.donkeyrepublic.v8'),
      fetchUrl(urls.just_ride, 'Just Ride', 'application/com.donkeyrepublic.v4'),
      fetchUrl(urls.day_deals, 'Day Deals', 'application/com.donkeyrepublic.v8')
    ]);
    
    console.log('\n=== SUMMARY ===');
    results.forEach((result, index) => {
      const names = ['Memberships', 'Just Ride', 'Day Deals'];
      if (result.status === 'fulfilled') {
        const { status, error } = result.value;
        if (error) {
          console.log(`⚠️  ${names[index]}: HTTP ${status} - ${error}`);
        } else {
          console.log(`✅ ${names[index]}: Success (${status})`);
        }
      } else {
        console.log(`❌ ${names[index]}: Failed - ${result.reason.message}`);
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAllUrls();
