package com.sudarshana.server.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IpGeolocationService {
    private static final Logger logger = LoggerFactory.getLogger(IpGeolocationService.class);

    // Short timeout so rate-limited (429) responses fail fast and don't block
    // the synchronized getAllReports() path, which evaluates every message IP.
    private final RestTemplate restTemplate;
    private final Map<String, IpLocationResult> cache = new ConcurrentHashMap<>();

    public IpGeolocationService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000); // 2 seconds
        factory.setReadTimeout(3000);    // 3 seconds
        this.restTemplate = new RestTemplate(factory);
    }

    public static class IpLocationResult {
        private final String country;
        private final String countryCode;
        private final String city;
        private final String isp;
        private final boolean proxyOrHosting;
        private final String type; // e.g. "Hosting/Datacenter", "Residential", "VPN/Proxy"

        public IpLocationResult(String country, String countryCode, String city, String isp, boolean proxyOrHosting, String type) {
            this.country = country;
            this.countryCode = countryCode;
            this.city = city;
            this.isp = isp;
            this.proxyOrHosting = proxyOrHosting;
            this.type = type;
        }

        public String getCountry() { return country; }
        public String getCountryCode() { return countryCode; }
        public String getCity() { return city; }
        public String getIsp() { return isp; }
        public boolean isProxyOrHosting() { return proxyOrHosting; }
        public String getType() { return type; }
    }

    public IpLocationResult resolveIp(String ip) {
        if (ip == null || ip.trim().isEmpty() || ip.equals("127.0.0.1") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
            return new IpLocationResult("Local Network", "LOCAL", "Private", "Internal ISP", false, "Local/Intranet");
        }

        String cleanIp = ip.trim();

        // Check cache first
        if (cache.containsKey(cleanIp)) {
            return cache.get(cleanIp);
        }

        // Hardcode answers for demo data IPs to work offline and look realistic
        if (cleanIp.equals("198.51.100.10")) {
            return cacheIp(cleanIp, new IpLocationResult("United States", "US", "Seattle", "Amazon Web Services", true, "Hosting/Datacenter"));
        } else if (cleanIp.equals("185.190.4.99")) {
            return cacheIp(cleanIp, new IpLocationResult("Netherlands", "NL", "Amsterdam", "M247 Europe", true, "VPN/Proxy"));
        } else if (cleanIp.equals("185.190.4.12")) {
            return cacheIp(cleanIp, new IpLocationResult("Romania", "RO", "Bucharest", "Voxility S.R.L.", true, "VPN/Proxy"));
        } else if (cleanIp.equals("203.0.113.88")) {
            return cacheIp(cleanIp, new IpLocationResult("Canada", "CA", "Toronto", "Rogers Communications", false, "Residential"));
        } else if (cleanIp.equals("198.51.100.22")) {
            return cacheIp(cleanIp, new IpLocationResult("United States", "US", "Chicago", "Comcast Cable", false, "Residential"));
        } else if (cleanIp.equals("203.0.113.110")) {
            return cacheIp(cleanIp, new IpLocationResult("Russia", "RU", "Moscow", "Selectel ISP", true, "Hosting/Datacenter"));
        } else if (cleanIp.equals("198.51.100.5")) {
            return cacheIp(cleanIp, new IpLocationResult("United Kingdom", "GB", "London", "British Telecom", false, "Residential"));
        } else if (cleanIp.equals("192.168.1.15") || cleanIp.equals("192.168.1.55") || cleanIp.equals("192.168.1.102") || cleanIp.equals("192.168.2.14") || cleanIp.equals("192.168.1.10")) {
            return cacheIp(cleanIp, new IpLocationResult("Local Network", "LOCAL", "Private", "Internal ISP", false, "Local/Intranet"));
        }

        try {
            // Fetch from free ip-api.com API
            String url = "http://ip-api.com/json/" + cleanIp;
            Map<?, ?> resp = restTemplate.getForObject(url, Map.class);
            if (resp != null && "success".equals(resp.get("status"))) {
                String country = (String) resp.get("country");
                String countryCode = (String) resp.get("countryCode");
                String city = (String) resp.get("city");
                String isp = (String) resp.get("isp");
                if (isp == null) isp = "";
                
                // Heuristics for proxy/hosting detection
                String ispLower = isp.toLowerCase();
                
                // If it is Google or Microsoft Mail Transfer Agent, Google/MS masks the sender IP
                boolean isGoogleMta = ispLower.contains("google") || ispLower.contains("gmail");
                boolean isMicrosoftMta = ispLower.contains("microsoft") || ispLower.contains("outlook") || ispLower.contains("hotmail") || ispLower.contains("office365");

                if (isGoogleMta) {
                    IpLocationResult result = new IpLocationResult("Masked by Google", "LOCAL", "Google Transit MTA", "Google LLC (Mail Infrastructure)", false, "Mail Transfer Agent");
                    return cacheIp(cleanIp, result);
                } else if (isMicrosoftMta) {
                    IpLocationResult result = new IpLocationResult("Masked by Microsoft", "LOCAL", "Microsoft Transit MTA", "Microsoft Corp (Mail Infrastructure)", false, "Mail Transfer Agent");
                    return cacheIp(cleanIp, result);
                }

                boolean isProxyOrHosting = ispLower.contains("hosting") || 
                                           ispLower.contains("datacenter") || 
                                           ispLower.contains("amazon") || 
                                           ispLower.contains("google") || 
                                           ispLower.contains("microsoft") || 
                                           ispLower.contains("ovh") || 
                                           ispLower.contains("digitalocean") || 
                                           ispLower.contains("linode") ||
                                           ispLower.contains("m247") ||
                                           ispLower.contains("voxility") ||
                                           ispLower.contains("selectel") ||
                                           ispLower.contains("vpn");
                                           
                String type = "Residential";
                if (isProxyOrHosting) {
                    if (ispLower.contains("vpn") || ispLower.contains("m247") || ispLower.contains("voxility")) {
                        type = "VPN/Proxy";
                    } else {
                        type = "Hosting/Datacenter";
                    }
                }
                
                IpLocationResult result = new IpLocationResult(country, countryCode, city, isp, isProxyOrHosting, type);
                return cacheIp(cleanIp, result);
            }
        } catch (Exception e) {
            logger.warn("Failed to geolocate IP {}: {}", cleanIp, e.getMessage());
        }

        return new IpLocationResult("Unknown Location", "UN", "Unknown City", "Unknown ISP", false, "Unclassified");
    }

    private IpLocationResult cacheIp(String ip, IpLocationResult result) {
        cache.put(ip, result);
        return result;
    }

    /**
     * Resolves an IP using cache only â€” never makes a network call.
     * Use this during report generation (GET /api/threads) so that
     * the synchronized report path never blocks on external HTTP timeouts.
     * Returns null if the IP hasn't been cached yet (resolved during ingestion).
     */
    public IpLocationResult resolveIpCachedOnly(String ip) {
        if (ip == null || ip.trim().isEmpty() || ip.equals("127.0.0.1")
                || ip.startsWith("192.168.") || ip.startsWith("10.")) {
            return new IpLocationResult("Local Network", "LOCAL", "Private", "Internal ISP", false, "Local/Intranet");
        }
        String cleanIp = ip.trim();
        // Return from cache if present; includes hardcoded demo IPs which are pre-cached on first resolveIp call
        return cache.get(cleanIp);
    }
}

