function FindProxyForURL(url, host) {
    // Proxy everything internal through proxy.hypergate.com
    if (shExpMatch(url, "*.internal.hypergate.com/*")) {
        return "PROXY proxy.hypergate.com:3128";
    }
    // Default to a direct connection for all other URLs
    return "DIRECT";
}
