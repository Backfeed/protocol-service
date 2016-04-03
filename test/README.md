# deployment

Deploy changes to Amazon by:

* change "Default" to the stage you want to deploy to by editing s-project.json in two places 
(this is to work around an serverless bug)

go to /restApi/
* `sls function deploy`
* `sls endpoint deploy`
* `sls resource deploy`


# running tests

you can run `mocha test` from the root directory

# troubleshouting

If you get errors having to do with the system reputation, check these things:

* the protocol-servers-users table should have a trigger for protocol-service-restApi-util-syncccachedsystemrep

You can do that (for example, the exact table name depends on your stage) visiting

https://console.aws.amazon.com/dynamodb/home?region=us-east-1#tables:selected=protocol-service-users-dev

As the AWS interface uses a non-resizable select box, just remember *it is the second one from the bottom that starts with 'protocol-service'.

* the table protocol-service-caching should have a totalRepInSystem set to 0

if you run into problems deploying functions temporarily remove the optimizer plugin from project.json

`serverless-optimizer-plugin`
