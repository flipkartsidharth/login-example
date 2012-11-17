  /**
   * This a factory function that returns a
   * middleware function for checking whether
   * a user is logged in
   * If a user is not logged in they will be redirected 
   * to /login
   */ 
  function authenticateUser() {
    return function (req, res, next) {
      function isLoginPage() {
        return req.path === '/login';
      }

      if (isLoginPage() || req.session.isLoggedIn === true) {
        next();
      } else {
        res.redirect('/login');
      }
    };
  }

  /**
   * This a factory function that returns a
   * route middleware function for checking whether
   * the current route's sellerid parameter is the 
   * same as the sellerId in the session
   *
   * If the sellerIds do not match the use will be redirected
   * to /error.
   */
  function sellerHasAccess{
    return function (req, res, next) {
      if(req.session.username === req.params.sellerId){
        next();
      } else {
        res.redirect('/error');
      }
    }
  }

  var express = require('express');


  /**
   * Get the memcached store. Couchbase uses the same protocol
   * so this works with couchbase too
   */
  var MemcachedStore = require('connect-memcached')(express);

  var app = express.createServer();

  app.use(express.favicon());
  app.set('view engine', 'jade');

  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.cookieParser());

  /**
   * Add the session middleware using the memcached store.
   * This must come after the cookieParser as the session 
   * depends on the session cookie being set.
   *
   * The MemcachedStore object can be constructed passing extra parameters.
   * to specify which couchbase instances to use.
   */
  app.use(express.session({ 
    secret: 'CatOnTheKeyboard', 
    store: new MemcachedStore 
  }));

  /**
   * Add the authenticateUser middleware
   * this must come after the session middleware
   * as it depends on the session being set up.
   */
  app.use(authenticateUser());

  app.get('/', function(req, res){
    if (req.session.views) {
      ++req.session.views;
    } else {
      req.session.views = 1;
    }
    res.send('Viewed <strong>' + req.session.views + '</strong> times.');
  });


  /**
   * A get request with the url parameter :sellerId
   * The sellerHasAccess middleware will check it the sellerId matches with
   * the session.
   */
  app.get('/:sellerId/something', sellerHasAccess(), function(req, res){
    res.send("It's getting cold " + req.params.sellerId + ".");
  });

  /**
   * Set the session as logged in by setting 
   * isLoggedIn as true and setting the username
   *
   * The user can then be redirected to /
   */
  app.post('/login', function (req, res) {
    req.session.isLoggedIn = true;
    req.session.username = req.body.username;
    res.redirect('/');
  });

  /**
   * This renders the login page's jade template
   */
  app.get('/login', function (req, res) {
    res.render('login');
  });

  /**
   * Log out by setting isLoggedIn as false
   */
  app.get('/logout', function (req, res) {
    req.session.isLoggedIn = false;
    res.redirect('/');
  });

  /**
   * Page to redirect to when something fails
   */
  app.get('/error', function (req, res) {
     res.send("Fail! Fail! Fail!");
  });

  app.listen(3000);
  console.log('Express app started on port 3000');