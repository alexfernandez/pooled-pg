[![Build Status](https://secure.travis-ci.org/alexfernandez/pooled-pg.png)](http://travis-ci.org/alexfernandez/pooled-pg)

# pooled-pg

A driver to PostgreSQL that is compatible with [pg](https://github.com/brianc/node-postgres/),
with more effective pooling strategies.

## Installation

Use npm:

    $ npm install pooled-pg

To run as a server, please install globally:

    $ sudo npm install -g pooled-pg

## Basic Usage: Pooled Mode

Basic usage is as simple as with [pg](https://github.com/brianc/node-postgres/):

Since pooled-pg is designed to be compatible with pg, just replace `pg` with `pooled-pg`
and voilà!
The pooling is done using `generic-pool` which should be a bit more robust than `pg`'s own pooling,
which according to [pg's author](http://blog.argteam.com/coding/node-js-postgres-pooling-revisited-with-transactions/)
is not 100% reliable.

### `pg.connect()`

In the following line, change `pg`:

	var pg = require('pg');
    pg.connect(address, callback);

to `pooled-pg`, so that it looks like this:

	var pooled = require('pooled-pg');
    pooled.connect(address, callback);

You can call the driver `pg`, but we change it here to `pooled` to avoid confusion.
Full example:

```
var pooled = require('pooled-pg');
var address = 'postgresql://user:password@server:5432/database';
pooled.connect(address, function(error, client, done)
{
	client.query('select current_user', function(error, result)
	{
		done();
		console.log('Current user: %s', result.rows[0].current_user);
	});
});
```

### `pg.Client()`

If you were using pg `Client`, just use `pooled-pg's Client`:

    var client = new pooled.Client(address);

The rest of you code will remain the same. Your connections are now pooled!

### Defaults

pooled-pg has a set of defaults compatible with [pg's](https://github.com/brianc/node-postgres/wiki/pg#pgdefaults).
E.g. you can set pool size with:

    pooled.defaults.poolSize = 20;

Note: at the present moment, only `pooled.defaults.poolSize` and `pooled.defaults.poolIdleTimeout` are used.

## Advanced Usage: Remote Mode

Sometimes the normal usage for the [pg](https://github.com/brianc/node-postgres/) driver is not enough.
If you have more than a few hundred connections, PostgreSQL does not behave nicely.
In those situations pooled-pg has a new, more interesting usage mode:
install a daemon on the PostgreSQL server which pools the connections,
and use a remote light client that connects to the daemon.

### Daemon

On the PostgreSQL server install `pooled-pg` globally:

    $ sudo npm install -g pooled-pg

And then start a server, by default on port 5433:

    $ pooled-server

You will probably want to set up an init or Upstart script to keep it running across reboots.

### Daemon Options

The following options are available in the server:

* `-v`: display the current version of the server and quit.
* `-p [port]`: open the server on the given port.
* `-h [host]`: use the given PostgreSQL host.
* `-c`: run in cluster mode (see below).
* `-s`: do not log connection times.
* `-d`: run in debug mode.

### Remote Connections

To connect from your frontend servers you just need to modify the connection string
so that it starts with `remote:` instead of `postgresql:`, and change the port. As simple as that!
The change has been designed so that it can be done using only configuration values,
and therefore allows for easy experimentation to see which options is more performant.

Full example:

```
var pooled = require('pooled-pg');
var address = 'remote://user:password@server:5433/database';
pooled.connect(address, function(error, client, done)
{
	client.query('select current_user', function(error, result)
	{
		done();
		console.log('Current user: %s', result.rows[0].current_user);
	});
});
```

### Cluster Mode

By default the pooled server running in remote mode will only use one processor.
If you want the server to run in clustered mode, just add `-c` to the command line:

    $ pooled-server -c

In the command line output you will see one "cluster" and as many "pooled" as CPUs there are on your machine
(two in this example):

```
[Mon Jan 12 2015 18:41:43 GMT+0100 (CET)] INFO PostgreSQL server started on port 5433: cluster
[Mon Jan 12 2015 18:41:43 GMT+0100 (CET)] INFO PostgreSQL server started on port 5433: pooled
[Mon Jan 12 2015 18:41:43 GMT+0100 (CET)] INFO PostgreSQL server started on port 5433: pooled
```

The first one is the master, and the rest are the workers.
Now the server will be able to scale with the number of CPUs.

### Loadtest Your Server

If you want to see how your server behaves, you can use the command `pooled-loadtest`:

    $ pooled-loadtest remote://user:password@server:5432/database -n 10000

for a pooled server, or for a remote setup:

    $ pooled-loadtest remote://user:password@server:5432/database -n 10000

Check out some more options with:

    $ pooled-loadtest --help

### Caveats of Remote Mode

A few remarks are in order.

The remote mode is now able to send and receive messages longer than a TCP packet.
The protocol has changed in version 0.0.4; please do not mix 0.0.3 server with 0.0.4 remotes or viceversa.

If you use `pooled-pg` in remote mode, keep in mind that the user and password for PostgreSQL
are travelling in the clear;
using a VPN between both machines would be the absolute minimum security required.

## License

This package is published under the MIT license.
You can integrate it in any commercial, closed software and/or make changes to the code with complete liberty.
If you send your changes back to the main repo we will be grateful,
but it is by no means required.


