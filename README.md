# Yanius [![Version](https://img.shields.io/badge/Version-2.0.1-green.svg?style=flat-square)](https://github.com/DerEnderKeks/Yanius/blob/master/package.json#L3)
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
sudo apt-get install build-essential
npm install
cp config/default.json.example config/default.json
```

> Make a PR if you know how to install this on other systems

#### Updating
As long the `Major` part of the version number (`Major.Minor.Patch`) didn't change, you can update using `git pull`.
Otherwise you also have to execute the appropriate migration scripts. You can find them in `/scripts/migration/`.

If it doesn't start after an update do `rm -rf node_modules && npm i` before asking for help.

##### Example
To update from 0.x.x to 1.x.x you have to:

* execute `node ./scripts/migration/0_x_x-to-1_x_x.js`
* pray to a god of your choice

#### Configuration
Edit `config/default.json`.
You have to insert your rethinkdb connection data there.
Also, you can set the url of your Yanius instance there.

If you want to use [secure cookies](https://en.wikipedia.org/wiki/HTTP_cookie#Secure_cookie) you have to use a proxy server like [nginx](https://www.nginx.com/).
You also have to insert `proxy_set_header X-Forwarded-Proto https;` into your nginx proxy configuration to use secure cookies.

#### Start

##### Simple
`npm start`

##### With Debug Output
`DEBUG="yanius:*" node --harmony ./bin/www`

##### Development Mode
`DEBUG="yanius:*" NODE_ENV="development" node --harmony ./bin/www`
> **WARNING:** Don't use this in production. Seriously. This mode shows stacktraces to the user.

#### How To Upload Files
##### Linux
You could use a custom script/program to upload files. You can use [mine](https://gist.github.com/DerEnderKeks/30cc7b3aebee4eee444337f452e19565) if you want.

##### Windows
You can use [ShareX](https://getsharex.com/).

In ShareX 

- go to `Destinations -> Destination settings... -> Custom uploaders`
- click on `Import -> From URL...`
- insert `http://goo.gl/D1BX26`
- click `Ok`
- adjust `Request URL` and `Arguments -> apikey`
- click `Update` on the left side of the window
- close that window
- select `Custom [Image, File, Text] Uploader` in `Destinations -> [Image, File, Text] uploader`

##### General
If you want to make your own script/program to upload files make sure it does the following:

- `POST` request to `/api/upload`
- Form field `apikey` is set to your API Key (Get it from `/dashboard/account`)
- Form field `file` is set to the file you want to upload
- (Optional) Form field `hidden` is set to `true` or `false` (if a file is hidden nobody can download it)

The server responds as JSON.

If the upload was successful:
```JSON
{
    "message": "File uploaded",
    "url": "your.domain/<shortname>"
}
```
Otherwise:
```JSON
{
    "message": "<error message>"
}
```

## License

[MIT](LICENSE)
