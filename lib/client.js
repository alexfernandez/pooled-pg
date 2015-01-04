'use strict';

/**
 * A client that sends request to a pooled-pg server.
 * (C) 2015 Alex Fernández.
 */

// requires
require('prototypes');
var net = require('net');
var testing = require('testing');

// constants
var TEST_ADDRESS = 'pooled://test:test@localhost:5433/test';

// globals
var clients = [];


exports.connect = function(address, callback)
{
	var client = new exports.Client(address);
	callback(null, client, client.done);
};

exports.end = function()
{
	clients.forEach(function(client)
	{
		client.end();
	});
};

exports.Client = function(address)
{
	// self-reference
	var self = this;

	// init
	clients.push(self);
	
	function connect(callback)
	{
		var fullHost = address.substringFrom('@').substringUpTo('/');
		var options = {
			host: fullHost.substringUpTo(':'),
			port: fullHost.substringFrom(':'),
		};
		var socket = net.connect(options, function(error)
		{
			if (error)
			{
				return callback(error);
			}
			return callback(null, socket);
		});
	}

	self.query = function(query, params, callback)
	{
		if (typeof params == 'function')
		{
			callback = params;
			params = null;
		}
		connect(function(error, socket)
		{
			if (error)
			{
				return callback('Could not connect to  ' + address + ': ' + error);
			}
			var message = {
				query: query,
				params: params,
			};
			socket.write(JSON.stringify(message), function(error)
			{
				if (error)
				{
					return callback('Could not connect: ' + error);
				}
				socket.on('data', function(data)
				{
					socket.end();
					return callback(null, JSON.parse(data));
				});
				socket.on('error', function(error)
				{
					return callback('Could not receive data: ' + error);
				});
			});
		});
	};

	self.done = function()
	{
	};

	self.end = function()
	{
	};
};

function testClient(callback)
{
	var client = new exports.Client(TEST_ADDRESS);
	client.query('select current_user', function(error)
	{
		testing.check(error, 'Could not run query to %s', TEST_ADDRESS, callback);
		client.end();
		testing.success(callback);
	});
}

/**
 * Run package tests.
 */
exports.test = function(callback)
{
	var tests = [
		testClient,
	];
	testing.run(tests, callback);
};

// run tests if invoked directly
if (__filename == process.argv[1])  
{
	exports.test(testing.show);
}
