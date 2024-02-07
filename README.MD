# PAC Proxy with Kerberos Authentication Setup for Hypergate

This guide outlines the steps to set up a PAC (Proxy Auto-Configuration) proxy with Kerberos authentication for Android devices managed by an MDM (such as Intune). The setup involves configuring a Squid proxy server and an HTTP server to host the PAC file, all containerized using Docker.

## Prerequisites

- Docker and Docker Compose installed on your server
- Administrative access to your domain for Kerberos configuration
- Microsoft Intune for managing Android devices

## Configuration Steps

### 1. Clone the Repository

Start by cloning this repository to your local machine or server where you plan to run the Docker containers.

```bash
git clone https://github.com/hypergate-com/kerberos-proxy.git
```

### 2. Adjust Configuration Files

You'll need to adjust several configuration files including krb5.conf, squid.conf, and the PAC file (config.pac) to your needs.

#### krb5.conf 
Adjust the file with the following content, adjusting the realm and server addresses to match your environment:

```conf
[libdefaults]
 default_realm = HYPERGATE.COM
 dns_lookup_kdc = no
 dns_lookup_realm = no
 default_tkt_enctypes = aes256-cts-hmac-sha1-96 rc4-hmac
 default_tgs_enctypes = aes256-cts-hmac-sha1-96 rc4-hmac
 permitted_enctypes = aes256-cts-hmac-sha1-96 rc4-hmac

[realms]
 HYPERGATE.COM = {
  kdc = kdc.hypergate.com
  admin_server = kdc.hypergate.com
 }

[domain_realm]
 .hypergate.com = HYPERGATE.COM
 hypergate.com = HYPERGATE.COM
```

#### squid.conf

Adjust the squid.conf file tailored to your setup. The important part is:

```conf
...
auth_param negotiate program /usr/lib/squid/negotiate_kerberos_auth -s HTTP/news.internal.hypergate.com@HYPERGATE.COM -k /etc/squid/squid.keytab -s GSS_C_NO_NAME
auth_param negotiate children 10
auth_param negotiate keep_alive on
acl authenticated proxy_auth REQUIRED
...

```

#### squid.keytab

Generate the squid.keytab file for Kerberos authentication on your Windows Server:

```powershell
ktpass -out squid.keytab -princ HTTP/proxy.hypergate.com@AD.INFRA.PAPERS.TECH -mapuser [user]@HYPERGATE.COM -crypto RC4-HMAC -pass [password] -ptype KRB5_NT_PRINCIPAL
```

#### config.pac

Create a config.pac file to specify the proxy settings for clients:

```javascript
function FindProxyForURL(url, host) {
    // Proxy everything internal through proxy.hypergate.com
    if (shExpMatch(url, "*.internal.hypergate.com/*")) {
        return "PROXY proxy.hypergate.com:3128";
    }
    // Default to a direct connection for all other URLs
    return "DIRECT";
}
```

## Configure Chrome in the MDM

Create an application configuration for Chrome with the following Properties:

| Key          | Description     | Value   |
|--------------|-----------------|---------|
| ProxySettings | Proxy settings | { "ProxyMode":"pac_script", "ProxyPacUrl":"http://proxy.hypergate.com/config.pac" } |
| AuthServerAllowlist | Authentication server allowlist | *.hypergate.com  |
| AuthAndroidNegotiateAccountType | Account type for HTTP Negotiate authentication | ch.papers.hypergate  |
| AuthSchemes | Supported authentication schemes | negotiate  |

# Start the solution
```bash
docker-compose up -d
```
