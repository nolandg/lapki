sudo certbot certonly \
  --dns-digitalocean \
  --dns-digitalocean-credentials ~/digitalocean.ini \
  -d powellriver.ca \
  -d www.powellriver.ca \
  -d api.powellriver.ca \
  -d static.powellriver.ca \
  -d dev.powellriver.ca \
  -d dev.api.powellriver.ca \
  -d dev.static.powellriver.ca