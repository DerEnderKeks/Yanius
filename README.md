# Yanius
*Yet Another Node Image Upload Server*

*(The name is actually a lie. You can upload every file type.)*

# Usage
#### Dependencies
- [nodejs](https://nodejs.org) v.6.4.0+
- [rethinkdb](https://www.rethinkdb.com/)
- way too many npm modules

#### Installation
##### Debian/Ubuntu
```bash
git clone https://github.com/DerEnderKeks/Yanius.git
cd Yanius
sudo apt-get install build-essentials
npm install
cp config/default.json.example config/default.json
```

> Make a PR if you know how to install this on other systems

#### Configuration
Edit `config/default.json`.
You have to insert your rethinkdb connection data there.

If you want to use [secure cookies](https://en.wikipedia.org/wiki/HTTP_cookie#Secure_cookie) you have to use a proxy server like [nginx](https://www.nginx.com/).
You also have to insert `proxy_set_header X-Forwarded-Proto https;` into your nginx proxy configuration to use secure cookies.

#### Start

##### Simple
`npm start`

##### With Debug Output
`DEBUG:"yanius:*" node --harmony ./bin/www`

##### Development Mode
`DEBUG:"yanius:*" NODE_ENV="development" node --harmony ./bin/www`
> **WARNING:** Don't use this in production. Seriously. This mode show stacktraces to the user.

## License

[MIT](LICENSE)
