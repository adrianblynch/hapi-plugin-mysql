'use strict';

var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
var Hoek = require('hoek');

var lab = exports.lab = Lab.script();
var it = lab.it;
var expect = Code.expect;

var dbOptions = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'test'
};

lab.experiment('Integration', function () {

	it('Makes a db connection that works', function (done) {
		var options = Hoek.clone(dbOptions);

		var server = new Hapi.Server();
		server.connection();

		server.register({
			register: require('../'),
			options: options
		}, function (err) {
			expect(err).to.not.exist();

			server.route([{
				method: 'POST',
				path: '/test',
				config: {
					handler: function (request, reply) {
						var sql = 'INSERT INTO test SET id = 1';

						expect(request.app.db, 'db connection').to.exist();

						request.app.db.query(sql, function (err, results) {
							expect(err, 'error').to.not.exist();
							expect(results.insertId, 'insert Id').to.exist();

							return reply(results.affectedRows);
						});
					}
				}
			},{
				method: 'GET',
				path: '/test',
				config: {
					handler: function (request, reply) {
						var sql = 'SELECT * FROM test';

						expect(request.app.db, 'db connection').to.exist();

						request.app.db.query(sql, function (err, results) {
							expect(err, 'error').to.not.exist();

							return reply(results);
						});
					}
				}
			}]);

			server.inject({
				method: 'POST',
				url: '/test'
			}, function (response) {
				expect(response.statusCode, 'post status code').to.equal(200);
				expect(response.result, 'post result').to.be.above(0);

				server.inject({
					method: 'GET',
					url: '/test'
				}, function (response) {
					expect(response.statusCode, 'get status code').to.equal(200);
					expect(response.result.length, 'get result').to.be.above(0);

					done();
				});
			});
		});
	});

	it('Makes a db connection using transactions that works', function (done) {
		var options = Hoek.clone(dbOptions);
		options.useTransactions = true;

		var server = new Hapi.Server();
		server.connection();

		server.register({
			register: require('../'),
			options: options
		}, function (err) {
			expect(err).to.not.exist();

			server.route([{
				method: 'POST',
				path: '/test',
				config: {
					handler: function (request, reply) {
						var sql = 'INSERT INTO test SET id = 2';

						expect(request.app.db, 'db connection').to.exist();

						request.app.db.query(sql, function (err, results) {
							expect(err, 'error').to.not.exist();
							expect(results.insertId, 'insert Id').to.exist();

							return reply(results.affectedRows);
						});
					}
				}
			},{
				method: 'GET',
				path: '/test',
				config: {
					handler: function (request, reply) {
						var sql = 'SELECT * FROM test WHERE id = 2';

						expect(request.app.db, 'db connection').to.exist();

						request.app.db.query(sql, function (err, results) {
							expect(err, 'error').to.not.exist();

							return reply(results);
						});
					}
				}
			}]);

			server.inject({
				method: 'POST',
				url: '/test'
			}, function (response) {
				expect(response.statusCode, 'post status code').to.equal(200);
				expect(response.result, 'post result').to.be.above(0);

				server.inject({
					method: 'GET',
					url: '/test'
				}, function (response) {
					expect(response.statusCode, 'get status code').to.equal(200);
					expect(response.result.length, 'get result').to.be.above(0);

					done();
				});
			});
		});
	});

	it('Quite fail when connection is deleted', function (done) {
		var options = Hoek.clone(dbOptions);

		var server = new Hapi.Server();
		server.connection();

		server.register({
			register: require('../'),
			options: options
		}, function (err) {
			expect(err).to.not.exist();

			server.route([{
				method: 'GET',
				path: '/test',
				config: {
					handler: function (request, reply) {
						request.app.db = undefined;
						return reply('ok');
					}
				}
			}]);

			server.inject({
				method: 'GET',
				url: '/test'
			}, function (response) {
				expect(response.statusCode, 'post status code').to.equal(200);
				expect(response.result, 'post result').to.equal('ok');

				done();
			});
		});
	});

	it('Pool is set to null on Server.stop()', function (done) {
		var options = Hoek.clone(dbOptions);

		var server = new Hapi.Server();
		server.connection();

		server.register({
			register: require('../'),
			options: options
		}, function (err) {
			expect(err).to.not.exist();

			server.start(function(err) {
				expect(err).to.not.exist();

				server.stop(function() {
					setImmediate(done);
				});
			});
		});
	});
});
