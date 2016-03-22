Contribute
===
(for a big dose of good karma ;)

Ask [Yaniv Keinan] for:
* .env
* .admin.env
* AWS user

#### Put AWS credentials at ~/.aws/credentials
```sh
[default]
aws_access_key_id = YOUR_AWS_ACCESS_KEY
aws_secret_access_key = YOUR_AWS_ACCESS_SECRET
```

#### Clone and initialize project
```sh
git clone git@github.com:Backfeed/protocol-service.git
npm install
cd restApi
npm install
sls project init -n protocol-service -p default -d backfeed.cc -c true -e protocol_dev@backfeed.cc
```

#### Install global npm dependencies
```sh
npm i -g nodemon
```

#### Testing
At root level run from terminal:
```sh
nodemon -x 'sls serve start'
npm run sanity
```

###### Thank you for helping out!

[Yaniv Keinan]: <https://github.com/jankei>