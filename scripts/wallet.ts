import { config } from "../src/config.js";
import { sign } from "../src/shark/sign.js";

async function getbalance() {
  const timestamp = Date.now().toString();
  const params = new URLSearchParams({
    marginAsset: "INR",
    timestamp: timestamp,
  });

  const query = params.toString();
  const signature = sign(query, config.SHARK_API_SECRET);
  // console.log(signature);
  const url = `https://api.sharkexchange.in/v1/wallet/futures-wallet/details?${query}`;
  // console.log(url);

  const res = await fetch(url, {
    headers: {
      "api-key": config.SHARK_API_KEY,
      signature: signature,
    },
  });
  const data = await res.json();
  console.log(data);
}

getbalance();
